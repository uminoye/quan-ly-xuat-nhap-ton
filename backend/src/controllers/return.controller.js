const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// ============================================================
// Hàm nội bộ: cộng tồn kho
// ============================================================
async function addInventory(client, warehouseId, productId, qty, refType, refId, note) {
    await client.query(`
        INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
        VALUES ($1, $2, $3)
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
    `, [warehouseId, productId, qty]);

    await client.query(`
        INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
        VALUES ($1, $2, 'IN', $3, $4, $5)
    `, [warehouseId, productId, qty, refType, refId]);
}

// ============================================================
// GET — Danh sách return requests + phiếu bù (ReturnsPage)
// ============================================================
const getAllReturns = async (req, res) => {
    try {
        const { action, period = 'month' } = req.query;
        let whereClause = `WHERE (rr.status IN ('return_pending', 'return_completed', 'pending', 'logistics_handled', 'return_to_sales'))`;

        if (action) {
            whereClause += ` AND rr.logistics_action = '${action}'`;
        }
        const dateSql = require('../utils/dateFilter').buildDateFilter(period, 'rr.created_at');
        whereClause += dateSql;

        const result = await db.getAll(`
            SELECT
                rr.id, rr.order_id, rr.customer_reject_reason,
                rr.logistics_action, rr.logistics_note, rr.handling_result, rr.status,
                rr.complaint_source, rr.compensation_no, rr.factory_acknowledged,
                rr.created_at, rr.updated_at,
                so.order_no, so.expected_delivery_date, so.actual_delivery_date,
                so.status AS order_status,
                c.company_name AS customer_name, c.phone AS customer_phone,
                u.full_name AS logistics_handler,
                cr.id AS compensation_id, cr.compensation_no AS cr_compensation_no,
                cr.status AS compensation_status, cr.defect_type,
                cr.responded_at AS compensation_responded_at
            FROM return_requests rr
            JOIN sales_orders so ON rr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            LEFT JOIN users u ON u.id = (
                SELECT handled_by FROM delivery_requests WHERE order_id = so.id ORDER BY id DESC LIMIT 1
            )
            LEFT JOIN compensation_requests cr ON cr.return_id = rr.id
            ${whereClause}
            ORDER BY rr.created_at DESC
        `);
        res.status(200).json(result);
    } catch (err) {
        console.error('[getAllReturns] ERROR:', err.message);
        res.status(200).json([]); // fallback: trả rỗng thay vì crash
    }
};

// ============================================================
// GET — Chi tiết 1 return request
// ============================================================
const getReturnByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const rr = await db.getOne(`
            SELECT
                rr.*,
                so.order_no,
                c.company_name AS customer_name,
                (SELECT json_agg(json_build_object(
                    'product_id', soi.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'quantity', soi.quantity,
                    'unit_price', COALESCE(soi.unit_price, p.sale_price, 0)
                )) FROM sales_order_items soi
                JOIN products p ON p.id = soi.product_id
                WHERE soi.order_id = so.id) AS order_items
            FROM return_requests rr
            JOIN sales_orders so ON rr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            WHERE rr.order_id = $1
        `, [order_id]);
        if (!rr) return res.status(404).json({ message: 'Khong tim thay yeu cau tra hang' });
        res.status(200).json(rr);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay chi tiet', error: err.message });
    }
};

// ============================================================
// GET — Danh sách phiếu bù (compensation_requests)
// ============================================================
const getCompensations = async (req, res) => {
    try {
        const { status, period = 'month' } = req.query;
        let whereClause = 'WHERE 1=1';
        if (status) whereClause += ` AND cr.status = '${status}'`;
        const dateSql = require('../utils/dateFilter').buildDateFilter(period, 'cr.created_at');
        whereClause += dateSql;

        const result = await db.getAll(`
            SELECT
                cr.id, cr.compensation_no, cr.return_id, cr.order_id,
                cr.defect_type, cr.total_items, cr.status,
                cr.created_at, cr.updated_at, cr.responded_at, cr.resolution_note,
                so.order_no, c.company_name AS customer_name,
                w.name AS warehouse_name, w.warehouse_code,
                (SELECT json_agg(json_build_object(
                    'product_id', ci.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'defective_qty', ci.defective_qty,
                    'unit_price', ci.unit_price
                )) FROM compensation_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.compensation_id = cr.id) AS items
            FROM compensation_requests cr
            JOIN return_requests rr ON rr.id = cr.return_id
            JOIN sales_orders so ON cr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            LEFT JOIN warehouses w ON w.id = cr.warehouse_id
            ${whereClause}
            ORDER BY cr.created_at DESC
        `);
        res.status(200).json(result);
    } catch (err) {
        console.error('[getCompensations] ERROR:', err.message);
        res.status(200).json([]); // fallback: trả rỗng thay vì crash
    }
};

// ============================================================
// XỬ LÝ HOÀN HÀNG — 1 bước gộp (init + complete)
// ============================================================
const processReturn = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, logistics_action } = req.body;
        const userId = req.user?.id || null;

        if (!order_id) {
            return res.status(400).json({ message: 'Thieu order_id' });
        }

        await client.query('BEGIN');

        // --- Lấy thông tin đơn hàng ---
        const orderRes = await client.query(`
            SELECT so.*, c.company_name AS customer_name,
                (SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = so.id ORDER BY id DESC LIMIT 1) AS original_warehouse_id
            FROM sales_orders so
            JOIN customers c ON so.customer_id = c.id
            WHERE so.id = $1
        `, [order_id]);
        if (!orderRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay don hang' });
        }
        const order = orderRes.rows[0];
        const originalWarehouseId = order.original_warehouse_id;

        // --- Lấy return_request ---
        const rrRes = await client.query(`SELECT * FROM return_requests WHERE order_id = $1`, [order_id]);
        let rr = rrRes.rows[0];
        if (!rr) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay yeu cau tra hang cho don nay' });
        }
        const finalAction = logistics_action || rr?.logistics_action || 'khong_nhan_hang';

        // --- Lấy items trong đơn hàng ---
        const itemsRes = await client.query(`
            SELECT soi.product_id, soi.quantity, p.name, p.sku, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price
            FROM sales_order_items soi
            JOIN products p ON p.id = soi.product_id
            WHERE soi.order_id = $1
        `, [order_id]);
        const items = itemsRes.rows;

        // --- Sinh mã phiếu nhập ---
        const receiptNo = await generateCode('PNH', client);

        const result = {
            order_id, order_no: order.order_no,
            logistics_action: finalAction,
            items_restocked: 0, items_to_defective: 0,
            claim_no: null, receipt_no: receiptNo,
            destination: null,
        };

        // ======================================================
        // ① KHÔNG NHẬN HÀNG → cộng tồn kho gốc + hủy đơn
        // ======================================================
        if (finalAction === 'khong_nhan_hang') {
            await client.query(`
                INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, status, note, responded_by, responded_reason, defect_type)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'completed', $3, $4, $5, 'khong_nhan_hang')
            `, [receiptNo, originalWarehouseId, `Khong nhan hang — Don ${order.order_no}`, userId, 'khong_nhan_hang']);

            const ridRes = await client.query(`SELECT lastval() AS id`);
            const receiptId = ridRes.rows[0].id;

            for (const item of items) {
                await addInventory(client, originalWarehouseId, item.product_id, item.quantity, 'return_receipt', receiptId, `Khong nhan hang - Don ${order.order_no}`);
            }

            // Đánh dấu đơn = canceled
            await client.query(`
                UPDATE sales_orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);
            await client.query(`
                UPDATE return_requests SET status = 'return_completed', handling_result = 'khong_nhan_hang', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [rr.id]);

            result.items_restocked = items.length;
            result.destination = 'kho_goc';

        // ======================================================
        // ② LỖI DO NHÀ MÁY → kho lỗi + tạo phiếu bù nhà máy
        // ======================================================
        } else if (finalAction === 'loi_nha_may') {
            // Tao phieu bù nha may (chua cong hang vao kho — doi factory/admin duyet moi cong)
            const compensationNo = await generateCode('PBH', client);
            await client.query(`
                INSERT INTO compensation_requests (compensation_no, return_id, order_id, warehouse_id, defect_type, total_items, status)
                VALUES ($1, $2, $3, $4, 'loi_nha_may', $5, 'pending')
            `, [compensationNo, rr.id, order_id, originalWarehouseId, items.length]);

            const compRes = await client.query(`SELECT lastval() AS id`);
            const compId = compRes.rows[0].id;

            for (const item of items) {
                await client.query(`
                    INSERT INTO compensation_items (compensation_id, product_id, defective_qty, unit_price)
                    VALUES ($1, $2, $3, $4)
                `, [compId, item.product_id, item.quantity, item.unit_price]);
            }

            await client.query(`
                UPDATE return_requests SET status = 'return_completed', handling_result = 'loi_nha_may',
                compensation_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            `, [compensationNo, rr.id]);

            await client.query(`
                UPDATE sales_orders SET status = 'return_completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);

            result.items_to_defective = 0;
            result.claim_no = compensationNo;
            result.destination = 'doi_duyet';

            // Gửi notification cho Nhà máy
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ('Factory', $1, $2, 'error', 'compensation', $3)
            `, [
                `Phieu bu hang — Don ${order.order_no}`,
                `Phat hien loi do nha may tren don ${order.order_no} (${order.customer_name}). Kho loi: ${items.length} loai san pham. Vui long xac nhan va bu hang.`,
                compId,
            ]);

        // ======================================================
        // ③ LỖI VẬN CHUYỂN → kho lỗi + đơn quay về Sales tạo đơn bù
        // ======================================================
        } else if (finalAction === 'loi_van_tai') {
            // Lấy kho lỗi
            const defectWhRes = await client.query(`SELECT id FROM warehouses WHERE warehouse_code = 'KHO-LOI' LIMIT 1`);
            const defectWarehouseId = defectWhRes.rows[0]?.id || originalWarehouseId;

            await client.query(`
                INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, status, note, responded_by, responded_reason, defect_type)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'completed', $3, $4, $5, 'loi_van_tai')
            `, [receiptNo, defectWarehouseId, `Hang loi van tai — Don ${order.order_no}`, userId, 'loi_van_tai']);

            const ridRes = await client.query(`SELECT lastval() AS id`);
            const receiptId = ridRes.rows[0].id;

            // Đưa tất cả hàng vào kho lỗi
            for (const item of items) {
                await addInventory(client, defectWarehouseId, item.product_id, item.quantity, 'return_receipt', receiptId, `Hang loi van tai - Don ${order.order_no}`);
            }

            // Đánh dấu return_request: gửi về Sales quyết định
            await client.query(`
                UPDATE return_requests
                SET status = 'return_to_sales', handling_result = 'loi_van_tai', logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [`Hang loi van tai. Kho loi: ${items.length} loai san pham. Vui long tao don moi bu hang cho khach.`, rr.id]);

            // Đơn quay về Sales — chưa cancel để Sales còn reference
            await client.query(`
                UPDATE sales_orders SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);

            // Ghi log giao dịch
            await client.query(`
                INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
                VALUES ($1, $2, 'return_to_sales', $3)
            `, [order_id, userId, `Loi van tai. Hang vao kho loi. Don tra ve Sales de tao don bu hang.`]);

            // Gửi notification cho Sales: cần tạo đơn bù hàng
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ('Sales', $1, $2, 'warning', 'sales_order', $3)
            `, [
                `Yeu cau bu hang — Don ${order.order_no}`,
                `Don hang ${order.order_no} (${order.customer_name}) bi loi van chuyen. Hang da dua vao kho loi. Vui long TAO DON HANG MOI voi noi dung "Bu hang cho khach" de gui lai cho khach.`,
                order_id,
            ]);

            result.items_to_defective = items.length;
            result.destination = 'kho_loi';
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xu ly hoan hang thanh cong!', ...result });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[processReturn] ERROR:', err);
        res.status(500).json({ message: 'Loi xu ly tra hang', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// PUT — Phê duyệt / từ chối phiếu bù (Admin/Kho/Nhà máy)
// ============================================================
const processCompensation = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { compensation_id, action, resolution_note } = req.body;
        // action: 'approve' | 'reject'

        if (!compensation_id) {
            return res.status(400).json({ message: 'Thieu compensation_id' });
        }

        await client.query('BEGIN');

        const compRes = await client.query(`SELECT * FROM compensation_requests WHERE id = $1`, [compensation_id]);
        if (!compRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay phieu bu' });
        }
        const comp = compRes.rows[0];

        // Tìm warehouse gốc đã xuất hàng (từ stock_outbound_notes)
        const outboundRes = await client.query(`
            SELECT warehouse_id FROM stock_outbound_notes
            WHERE order_id = $1 ORDER BY id ASC LIMIT 1
        `, [comp.order_id]);
        const warehouseId = outboundRes.rows[0]?.warehouse_id || comp.warehouse_id;
        if (!warehouseId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Khong xac dinh duoc kho goc da xuat hang!' });
        }

        // Lấy items trong phiếu bù
        const itemsRes = await client.query(`
            SELECT product_id, defective_qty FROM compensation_items WHERE compensation_id = $1
        `, [compensation_id]);

        // Tạo phiếu nhập kho (bù hàng) — trạng thái completed luôn vì nhà máy đã confirm
        const receipt_no = await generateCode('receipt');
        await client.query(`
            INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, note, status, created_at, updated_at)
            VALUES ($1, $2, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, $3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [receipt_no, warehouseId, `Bu hang tu phieu bu ${comp.compensation_no} — don ${comp.order_id}`]);

        const receiptDb = await client.query(`SELECT id FROM production_receipts WHERE receipt_no = $1`, [receipt_no]);
        const receiptId = receiptDb.rows[0].id;

        // Ghi nhận từng sản phẩm vào kho gốc
        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO production_receipt_items (receipt_id, product_id, quantity)
                VALUES ($1, $2, $3)
            `, [receiptId, item.product_id, item.defective_qty]);

            // Cập nhật tồn kho
            await client.query(`
                INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (warehouse_id, product_id)
                DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
            `, [warehouseId, item.product_id, item.defective_qty]);

            // Ghi log giao dịch
            await client.query(`
                INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                VALUES ($1, $2, 'IN', $3, 'compensation_receipt', $4)
            `, [warehouseId, item.product_id, item.defective_qty, receiptId]);
        }

        await client.query(`
            UPDATE compensation_requests
            SET status = 'approved', resolution_note = $1, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [resolution_note || `Da dong y bu hang. Phieu nhap kho: ${receipt_no}`, compensation_id]);

        await client.query(`
            UPDATE return_requests
            SET factory_acknowledged = TRUE, factory_responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [comp.return_id]);

        const orderRes = await client.query(`SELECT order_no FROM sales_orders WHERE id = $1`, [comp.order_id]);
        const orderNo = orderRes.rows[0]?.order_no || '';

        // Gửi thông báo cho 3 vai trò: Sales + Logistics + Kho (Lỗi nhà máy)
        const notificationTargets = ['Sales', 'Logistics', 'Warehouse'];
        for (const role of notificationTargets) {
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ($1, $2, $3, 'success', 'compensation', $4)
            `, [
                role,
                `Da bu hang (Loi nha may) — ${orderNo}`,
                `Phieu bu ${comp.compensation_no} da duoc xac nhan boi Nha may. Hang da duoc bu vao kho goc. Phieu nhap: ${receipt_no}. Don hang: ${orderNo}.`,
                compensation_id,
            ]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da dong y bu hang!', status: 'approved' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xu ly phieu bu', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// Legacy — backward compat
// ============================================================
const processReturnInit = async (req, res) => {
    res.status(400).json({ message: 'Dung /api/returns/process (1 buoc) thay vi /init + /complete' });
};

const processReturnComplete = async (req, res) => {
    const { order_id, logistics_action, logistics_note } = req.body;
    return processReturn({ body: { order_id, logistics_action, logistics_note }, user: req.user, userId: req.user?.id });
};

// ============================================================
// GET — Danh sách thông báo
// ============================================================
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role?.name || req.user?.role;

        const result = await db.getAll(`
            SELECT n.*
            FROM notifications n
            WHERE (n.recipient_role = $1 OR n.recipient_user_id = $2)
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [role, userId]);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay thong bao', error: err.message });
    }
};

// ============================================================
// PUT — Đánh dấu đã đọc
// ============================================================
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.run(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da danh dau da doc' });
    } catch (err) {
        res.status(500).json({ message: 'Loi cap nhat', error: err.message });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role?.name || req.user?.role;
        await db.run(`
            UPDATE notifications SET is_read = true
            WHERE (recipient_role = $1 OR recipient_user_id = $2) AND is_read = false
        `, [role, userId]);
        res.status(200).json({ message: 'Da danh dau tat ca da doc' });
    } catch (err) {
        res.status(500).json({ message: 'Loi', error: err.message });
    }
};

module.exports = {
    getAllReturns,
    getReturnByOrder,
    getCompensations,
    processReturn,
    processReturnInit,
    processReturnComplete,
    processCompensation,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};
