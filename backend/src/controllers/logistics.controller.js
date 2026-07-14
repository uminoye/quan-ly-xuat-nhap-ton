const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const CARRIERS = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
  { code: 'GR',  name: 'Giao Hàng Tiết Kiệm (GR)' },
  { code: 'GHT', name: 'Giao Hàng Tiêu Chuẩn (GHT)' },
];

// 2 lý do lỗi sau khi giao (Logistics chọn khi khiếu nại sau giao)
const LOGISTICS_COMPLAINT_ACTIONS = [
  { value: 'loi_nha_may', label: 'Lỗi do nhà máy' },
  { value: 'loi_van_tai', label: 'Lỗi do vận chuyển' },
];

const processOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, new_status, logistics_note } = req.body;
        const handled_by = req.user?.id || req.userId || null;
        if (!order_id || !new_status) {
            return res.status(400).json({ message: 'Thieu order_id hoac new_status' });
        }

        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE sales_orders SET status = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id`,
            [new_status, logistics_note || null, order_id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay don hang' });
        }
        await client.query(
            `INSERT INTO delivery_requests (order_id, handled_by, received_at, status, logistics_note)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
            [order_id, handled_by, new_status, logistics_note || null]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: 'Logistics da xu ly don! Trang thai moi: ' + new_status });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    } finally {
        client.release();
    }
};

const dispatchOrder = async (req, res) => {
  const client = await db.pool.connect();
  let retries = 0;
  const MAX_RETRIES = 3;

  while (retries < MAX_RETRIES) {
    try {
      const { order_id, carrier_code, shipping_fee } = req.body;
      const userId = req.user?.id || null;

      if (!order_id || !carrier_code) {
        return res.status(400).json({ message: 'Thieu order_id hoac carrier_code' });
      }

      const carrier = CARRIERS.find((c) => c.code === carrier_code);
      if (!carrier) {
        return res.status(400).json({ message: 'Don vi van chuyen khong hop le' });
      }

      await client.query('BEGIN');

      // Sinh mã vận đơn
      const CARRIER_PREFIX = { GHN: 'GHN', GR: 'GR', GHT: 'GHT', VTP: 'VTP' };
      const carrierPrefix = CARRIER_PREFIX[carrier.code] || 'GHN';
      const trackingNo = await generateCode(carrierPrefix, client);

      // Tạo shipping order
      const shResult = await client.query(
        `INSERT INTO shipping_orders (order_id, carrier_code, carrier_name, tracking_no, shipping_fee)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [order_id, carrier.code, carrier.name, trackingNo, shipping_fee || 0]
      );
      const shipping_order_id = shResult.rows[0].id;

      // Cập nhật trạng thái đơn hàng → warehouse_processing (chờ kho xuất), bước giao = 1
      await client.query(
        `UPDATE sales_orders SET status = 'warehouse_processing', delivery_step = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );

      // Ghi log
      await client.query(
        `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
         VALUES ($1, $2, 'warehouse_processing', $3)`,
        [order_id, userId, `Dieu phoi ${carrier.name}, Phi ship: ${shipping_fee || 0} VND`]
      );

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Dieu phoi thanh cong!',
        tracking_no: trackingNo,
        carrier: carrier.name,
        shipping_fee: shipping_fee || 0,
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}

      // Race condition: retry nếu duplicate tracking_no (tối đa 3 lần)
      if (err.code === '23505' && err.constraint === 'shipping_orders_tracking_no_key' && retries < MAX_RETRIES - 1) {
        retries++;
        console.warn(`[dispatchOrder] Duplicate tracking_no, retrying (${retries}/${MAX_RETRIES})...`);
        continue;
      }

      console.error('[dispatchOrder] ERROR:', err);
      return res.status(500).json({ message: 'Loi dieu phoi', error: err.message });
    }
  }
};

const rejectOrder = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { order_id, reason } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }

    await client.query('BEGIN');
    await client.query(
      `UPDATE sales_orders SET status = 'waiting_sales', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [reason || 'Logistics tu choi', order_id]
    );
    await client.query(
      `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
       VALUES ($1, $2, 'waiting_sales', $3)`,
      [order_id, req.user?.id || null, reason || 'Logistics tu choi dieu phoi']
    );
    await client.query('COMMIT');
    res.status(200).json({ message: 'Da tu choi don hang. Don quay ve trang thai pending.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Loi tu choi', error: err.message });
  } finally {
    client.release();
  }
};

// Hàm nội bộ: advance 1 bước cho 1 đơn hàng (trong transaction đã có BEGIN)
// forceFail: true  → logistics báo giao thất bại → customer_rejected
// forceSuccess: true → logistics xác nhận giao thành công → completed
// cả hai false → dùng random 20% thất bại
async function advanceDeliveryStep(client, order_id, forceFail = false, forceSuccess = false) {
  const stepRes = await client.query(
    `SELECT delivery_step FROM sales_orders WHERE id = $1`,
    [order_id]
  );
  const currentStep = Number(stepRes.rows[0]?.delivery_step || 1);
  const nextStep = currentStep + 1;

  if (nextStep <= 3) {
    // Chưa xong → chỉ tăng step
    await client.query(
      `UPDATE sales_orders SET delivery_step = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextStep, order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET shipped_at = CURRENT_TIMESTAMP, status = 'in_transit' WHERE order_id = $1`,
      [order_id]
    );
    return { done: false, delivery_step: nextStep };
  }

  // nextStep == 4 → hoàn tất giao hàng
  let customerRejects = false;
  let rejectReason = null;

  if (forceFail) {
    // Logistics chủ động báo không thành công
    customerRejects = true;
    rejectReason = 'khong_nhan_hang';
  } else if (forceSuccess) {
    // Logistics xác nhận giao thành công rõ ràng
    customerRejects = false;
  } else {
    // Random: 5% khách từ chối (trong quá trình giao)
    const rand = Math.random();
    customerRejects = rand < 0.05;
    if (customerRejects) {
      rejectReason = 'khong_nhan_hang';
    }
  }

  if (customerRejects) {
    await client.query(
      `UPDATE sales_orders SET status = 'return_pending', delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET status = 'customer_rejected' WHERE order_id = $1`,
      [order_id]
    );
    await client.query(
      `INSERT INTO return_requests (order_id, customer_reject_reason, status)
       VALUES ($1, $2, 'return_pending')
       ON CONFLICT (order_id) DO UPDATE SET customer_reject_reason = EXCLUDED.customer_reject_reason, status = 'return_pending'`,
      [order_id, rejectReason]
    );
  } else {
    await client.query(
      `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_TIMESTAMP, delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
      [order_id]
    );
  }
  return { done: true, delivered: !customerRejects, customer_rejected: customerRejects, reject_reason: rejectReason };
}

const triggerDeliverySimulation = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { order_id, fail, success } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }
    await client.query('BEGIN');
    const result = await advanceDeliveryStep(client, order_id, !!fail, !!success);
    await client.query('COMMIT');

    if (result.done) {
      return res.status(200).json({
        delivered: result.delivered,
        customer_rejected: result.customer_rejected,
        reject_reason: result.reject_reason,
        delivery_step: 4,
        message: result.delivered ? 'Giao hang thanh cong!' : 'Khach hang tu choi nhan hang!',
      });
    }
    return res.status(200).json({ delivery_step: result.delivery_step, status: 'in_progress', message: `Buoc ${result.delivery_step} hoan tat. Tiep tuc...` });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[triggerDeliverySimulation] ERROR:', err.message);
    res.status(500).json({ message: 'Loi giao hang', error: err.message });
  } finally {
    client.release();
  }
};

const simulateAllShipping = async (req, res) => {
  // Chỉ advance đơn đang trong quá trình giao (delivery_step 1-3)
  // Bước 1: warehouse_processing → Bước 2: shipping → Bước 3: shipping → Bước 4: completed/customer_rejected
  const client = await db.pool.connect();
  try {
    const result = await client.query(
      `SELECT id, order_no FROM sales_orders WHERE status = 'shipping' AND delivery_step BETWEEN 1 AND 3`
    );
    const orders = result.rows;

    const results = [];
    for (const order of orders) {
      await client.query('BEGIN');
      const stepRes = await client.query(
        `SELECT delivery_step FROM sales_orders WHERE id = $1`,
        [order.id]
      );
      const currentStep = Number(stepRes.rows[0]?.delivery_step || 1);
      const nextStep = currentStep + 1;

      if (nextStep <= 3) {
        // Chưa xong → tăng step
        await client.query(
          `UPDATE sales_orders SET delivery_step = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [nextStep, order.id]
        );
        if (nextStep === 2) {
          await client.query(
            `UPDATE shipping_orders SET shipped_at = CURRENT_TIMESTAMP, status = 'in_transit' WHERE order_id = $1`,
            [order.id]
          );
        }
        await client.query('COMMIT');
        results.push({ order_id: order.id, order_no: order.order_no, delivery_step: nextStep, status: 'in_progress' });
      } else {
        // Hoàn tất giao hàng — 5% khách không nhận
        const rand = Math.random();
        const customerRejects = rand < 0.05;
        const rejectReason = customerRejects ? 'khong_nhan_hang' : null;

        if (customerRejects) {
          await client.query(
            `UPDATE sales_orders SET status = 'customer_rejected', delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [order.id]
          );
          await client.query(
            `UPDATE shipping_orders SET status = 'customer_rejected' WHERE order_id = $1`,
            [order.id]
          );
          await client.query(
            `INSERT INTO return_requests (order_id, customer_reject_reason, status)
             VALUES ($1, $2, 'pending')
             ON CONFLICT (order_id) DO UPDATE SET customer_reject_reason = EXCLUDED.customer_reject_reason, status = 'pending'`,
            [order.id, rejectReason]
          );
        } else {
          await client.query(
            `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_TIMESTAMP, delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [order.id]
          );
          await client.query(
            `UPDATE shipping_orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [order.id]
          );
        }
        await client.query('COMMIT');
        results.push({ order_id: order.id, order_no: order.order_no, delivery_step: 4, delivered: !customerRejects });
      }
    }

    res.status(200).json({ message: `Da xu ly ${results.length} don`, results });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('[simulateAllShipping] ERROR:', err);
    res.status(500).json({ message: 'Loi auto-simulate', error: err.message });
  } finally {
    client.release();
  }
};

const processCustomerRejection = async (req, res) => {
  // Chỉ xử lý KHÔNG NHẬN HÀNG (trong quá trình giao)
  // → gửi về Sales quyết định
  const client = await db.pool.connect();
  try {
    const { order_id, logistics_note } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }

    await client.query('BEGIN');

    const existingRR = await client.query(
      `SELECT id FROM return_requests WHERE order_id = $1`,
      [order_id]
    );

    if (!existingRR.rows.length) {
      await client.query(
        `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_note, status)
         VALUES ($1, 'khong_nhan_hang', 'during_delivery', $2, 'logistics_handled')`,
        [order_id, logistics_note || 'Khach khong nhan hang trong qua trinh giao']
      );
    } else {
      await client.query(
        `UPDATE return_requests SET customer_reject_reason = 'khong_nhan_hang', complaint_source = 'during_delivery', logistics_note = $1, updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
        [logistics_note || null, order_id]
      );
    }

    await client.query(
      `UPDATE sales_orders SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE return_requests SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
      [order_id]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: 'Da gui don ve Sales xu ly!',
      logistics_action: 'khong_nhan_hang',
      new_status: 'return_to_sales',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Loi xu ly tra hang', error: err.message });
  } finally {
    client.release();
  }
};

const getShippingOrders = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const dateSql = buildDateFilter(period, 'sh.created_at');
    const result = await db.getAll(`
      SELECT
        sh.id, sh.order_id, sh.carrier_code, sh.carrier_name, sh.tracking_no,
        sh.shipping_fee, sh.status, sh.shipped_at, sh.delivered_at,
        so.order_no, c.company_name AS customer_name,
        so.expected_delivery_date, so.status AS order_status
      FROM shipping_orders sh
      JOIN sales_orders so ON sh.order_id = so.id
      JOIN customers c ON so.customer_id = c.id
      WHERE 1=1 ${dateSql}
      ORDER BY sh.created_at DESC
    `);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Loi lay du lieu', error: err.message });
  }
};

const { buildDateFilter } = require('../utils/dateFilter');

const getReturnRequests = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const dateSql = buildDateFilter(period, 'rr.created_at');
    const result = await db.getAll(`
      SELECT
        rr.id, rr.order_id, rr.customer_reject_reason, rr.complaint_source,
        rr.logistics_action, rr.logistics_note, rr.handling_result, rr.status,
        so.order_no, c.company_name AS customer_name, so.expected_delivery_date,
        so.status AS order_status, so.note AS order_note
      FROM return_requests rr
      JOIN sales_orders so ON rr.order_id = so.id
      JOIN customers c ON so.customer_id = c.id
      WHERE 1=1 ${dateSql}
      ORDER BY rr.created_at DESC
    `);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Loi lay du lieu', error: err.message });
  }
};

const processCompletedOrder = async (req, res) => {
  // Xử lý đơn đã giao thành công:
  // - action=confirm: xác nhận hoàn thành (không làm gì thêm)
  // - action=complaint: tạo khiếu nại sau giao
  const client = await db.pool.connect();
  try {
    const { order_id, action, note, logistics_action } = req.body;
    if (!order_id || !action) {
      return res.status(400).json({ message: 'Thieu order_id hoac action' });
    }
    if (!['confirm', 'complaint'].includes(action)) {
      return res.status(400).json({ message: 'Action khong hop le' });
    }

    await client.query('BEGIN');

    if (action === 'confirm') {
      // Chỉ cập nhật ghi chú
      await client.query(
        `UPDATE sales_orders SET note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [`[Logistics] Xac nhan giao thanh cong: ${note || ''}`, order_id]
      );
    } else {
      // complaint: tạo return_request cho khiếu nại sau giao
      // logistics_action chỉ có 2 giá trị: 'loi_nha_may' | 'loi_van_tai'
      if (!logistics_action || !['loi_nha_may', 'loi_van_tai'].includes(logistics_action)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Khi yeu cau sau giao, can chon: loi_nha_may hoac loi_van_tai' });
      }

      await client.query(
        `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_action, logistics_note, status)
         VALUES ($1, 'khieu_nai_sau_giao', 'after_delivery', $2, $3, 'return_pending')
         ON CONFLICT (order_id) DO UPDATE SET
           complaint_source = 'after_delivery',
           logistics_action = EXCLUDED.logistics_action,
           logistics_note = EXCLUDED.logistics_note,
           status = 'return_pending',
           updated_at = CURRENT_TIMESTAMP`,
        [order_id, logistics_action, note || 'Khieu nai sau khi giao thanh cong']
      );

      await client.query(
        `UPDATE sales_orders SET status = 'return_pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );
      await client.query(
        `UPDATE shipping_orders SET status = 'return_pending' WHERE order_id = $1`,
        [order_id]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: action === 'confirm' ? 'Da xac nhan hoan thanh' : 'Da tao yeu cau khieu nai sau giao',
      complaint_source: action === 'complaint' ? 'after_delivery' : null,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ message: 'Loi xu ly', error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  processOrder,
  dispatchOrder,
  rejectOrder,
  triggerDeliverySimulation,
  simulateAllShipping,
  processCustomerRejection,
  processCompletedOrder,
  getShippingOrders,
  getReturnRequests,
  CARRIERS,
};
