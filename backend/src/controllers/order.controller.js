const db = require('../config/database');

const getNextOrderNo = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;

        await client.query(
            `SELECT 1 FROM sales_orders WHERE order_no LIKE $1 FOR UPDATE`,
            [pattern]
        );

        const soRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1`,
            [pattern]
        );
        const acRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [pattern]
        );

        let maxNum = 0;
        [soRes.rows[0]?.order_no, acRes.rows[0]?.code].forEach(code => {
            if (!code) return;
            const n = parseInt(String(code).split('-').pop(), 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        const order_no = `SO-${year}-${String(maxNum + 1).padStart(4, '0')}`;

        await client.query('COMMIT');
        res.status(200).json({ order_no });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi sinh ma don', error: err.message });
    } finally {
        client.release();
    }
};

const { buildDateFilter } = require('../utils/dateFilter');

const getAllOrders = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateSql = buildDateFilter(period, 'o.created_at');
        const query = `
            SELECT
                o.id,
                o.order_no,
                o.customer_id,
                c.company_name as customer_name,
                o.order_date,
                o.expected_delivery_date,
                o.actual_delivery_date,
                o.created_by,
                o.status,
                o.delivery_step,
                o.note,
                o.created_at,
                o.updated_at,
                (
                    SELECT dr.warehouse_note FROM delivery_requests dr
                    WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1
                ) AS warehouse_note,
                (
                    SELECT dr.logistics_note FROM delivery_requests dr
                    WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1
                ) AS logistics_note,
                oi.id as item_id,
                oi.product_id,
                oi.quantity,
                oi.unit_price,
                p.name as product_name,
                p.sku as product_sku
            FROM sales_orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN sales_order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE 1=1 ${dateSql}
            ORDER BY o.created_at DESC, oi.id ASC
        `;
        const rows = await db.getAll(query);

        const ordersMap = new Map();
        rows.forEach((row) => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    order_no: row.order_no,
                    customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    order_date: row.order_date,
                    expected_delivery_date: row.expected_delivery_date,
                    actual_delivery_date: row.actual_delivery_date,
                    created_by: row.created_by,
                    status: row.status,
                    delivery_step: row.delivery_step,
                    note: row.note,
                    warehouse_note: row.warehouse_note,
                    logistics_note: row.logistics_note,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    items: [],
                });
            }
            if (row.item_id) {
                ordersMap.get(row.id).items.push({
                    id: row.item_id,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    product_sku: row.product_sku,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                });
            }
        });
        res.status(200).json(Array.from(ordersMap.values()));
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const getOrderItems = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await db.getAll(`SELECT * FROM sales_order_items WHERE order_id = $1`, [id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu' });
    }
};

const createOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { customer_id, order_date, expected_delivery_date, note, items } = req.body;
        if (!customer_id) return res.status(400).json({ message: 'Vui long chon khach hang!' });
        if (!order_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });

        await client.query('BEGIN');

        // Tìm số lớn nhất từ cả sales_orders và auto_codes (đề phòng seed cũ), lock để tránh race condition
        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;

        await client.query(
            `SELECT 1 FROM sales_orders WHERE order_no LIKE $1 FOR UPDATE`,
            [pattern]
        );

        const soRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1`,
            [pattern]
        );
        const acRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [pattern]
        );

        let maxNum = 0;
        [soRes.rows[0]?.order_no, acRes.rows[0]?.code].forEach(code => {
            if (!code) return;
            const n = parseInt(String(code).split('-').pop(), 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        const order_no = `SO-${year}-${String(maxNum + 1).padStart(4, '0')}`;

        // Insert đơn hàng
        const result = await client.query(
            `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [order_no, customer_id, order_date, expected_delivery_date, note]
        );
        const orderId = result.rows[0].id;

        // Insert các sản phẩm
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tao don hang thanh cong', id: orderId, order_no });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi Database: ' + err.message });
    } finally {
        client.release();
    }
};

const updateOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { customer_id, expected_delivery_date, note, items } = req.body;
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET customer_id = $1, expected_delivery_date = $2, note = $3, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
            [customer_id, expected_delivery_date, note, orderId]
        );
        await client.query(`DELETE FROM sales_order_items WHERE order_id = $1`, [orderId]);
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da cap nhat toan bo don hang!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cap nhat don' });
    } finally {
        client.release();
    }
};

const deleteOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const order = await client.query(`SELECT status FROM sales_orders WHERE id = $1`, [id]);
        if (!order.rows.length) return res.status(404).json({ message: 'Khong tim thay don hang' });
        const currentStatus = order.rows[0].status || 'pending';
        if (!['pending', 'returned', 'waiting_sales', 'return_to_sales'].includes(currentStatus)) {
            return res.status(400).json({ message: 'Khong the xoa don hang da duoc xu ly!' });
        }
        await client.query('BEGIN');
        // Xoa cac bang con theo dung thu tu (neu co FK)
        const outboundNotes = await client.query(
            `SELECT id FROM stock_outbound_notes WHERE order_id = $1`, [id]
        );
        for (const note of outboundNotes.rows) {
            await client.query(
                `DELETE FROM stock_outbound_note_items WHERE outbound_note_id = $1`, [note.id]
            );
        }
        await client.query(`DELETE FROM stock_outbound_notes WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM delivery_requests WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM shipping_orders WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_order_items WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_orders WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xoa don hang thanh cong' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete order error:', err.message);
        res.status(500).json({ message: 'Loi khi xoa: ' + err.message });
    } finally {
        client.release();
    }
};

const processLogistics = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, new_status, reason_type, detail_note } = req.body;
        let finalNote = '';
        if (new_status === 'returned') {
            finalNote = `[LOGISTICS TU CHOI]: ${reason_type} | Chi tiet: ${detail_note}`;
        } else {
            finalNote = detail_note || '';
        }
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET status = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [new_status, finalNote, order_id]
        );
        await client.query(
            `INSERT INTO delivery_requests (order_id, handled_by, received_at, status, logistics_note, warehouse_note)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)`,
            [order_id, req.user?.id || null, new_status, finalNote, null]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da cap nhat trang thai don hang!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi khi xu ly don hang' });
    } finally {
        client.release();
    }
};

const reportWarehouseIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { issue_note } = req.body;
        const order = await db.getOne(`SELECT note FROM sales_orders WHERE id = $1`, [id]);
        const currentNote = order ? (order.note || '') : '';
        const newNote = `[KHO BAO LOI]: ${issue_note} | Ghi chu cu: ${currentNote}`;
        await db.run(
            `UPDATE sales_orders SET status = 'logistics_review', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newNote, id]
        );
        res.status(200).json({ message: 'Da bao loi va gui ve cho Logistics!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi bao thieu hang' });
    }
};

const exportOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [orderId]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xuat kho, don hang chuyen sang trang thai Dang giao!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi chot don' });
    } finally {
        client.release();
    }
};

const confirmDelivery = async (req, res) => {
    try {
        const orderId = req.params.id;
        await db.run(
            `UPDATE sales_orders SET status = 'completed', actual_delivery_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [orderId]
        );
        res.status(200).json({ message: 'Xac nhan don hang da giao thanh cong!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi xac nhan giao hang' });
    }
};

const returnInventory = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        await client.query('BEGIN');
        const outbound = await db.getOne(
            `SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
            [orderId]
        );
        if (outbound) {
            const items = await db.getAll(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [orderId]);
            for (const item of items) {
                await client.query(
                    `UPDATE inventory_balances SET on_hand_qty = COALESCE(on_hand_qty, 0) + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3`,
                    [item.quantity, item.product_id, outbound.warehouse_id]
                );
            }
            await client.query(
                `UPDATE sales_orders SET status = 'canceled', actual_delivery_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [orderId]
            );
        } else {
            await client.query(
                `UPDATE sales_orders SET status = 'returned', actual_delivery_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [orderId]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: outbound ? 'Da hoan tra ton kho!' : 'Da cap nhat trang thai hoan tra!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi hoan tra ton kho' });
    } finally {
        client.release();
    }
};

const processCustomerRejection = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { action, note } = req.body; // action: 'return_to_warehouse' | 'return_pending'
        await client.query('BEGIN');

        // Lấy thông tin outbound để biết kho nào
        const outbound = await client.query(
            `SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
            [orderId]
        );

        if (action === 'return_to_warehouse') {
            // Hoàn đơn lại vào kho đã xuất
            if (outbound.rows.length > 0) {
                const warehouseId = outbound.rows[0].warehouse_id;
                const items = await client.query(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [orderId]);
                for (const item of items.rows) {
                    await client.query(
                        `UPDATE inventory_balances SET on_hand_qty = COALESCE(on_hand_qty, 0) + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3`,
                        [item.quantity, item.product_id, warehouseId]
                    );
                }
            }
            await client.query(
                `UPDATE sales_orders SET status = 'canceled', actual_delivery_date = NULL, note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [note || 'Khach tu choi nhan don - da hoan tra kho', orderId]
            );
        } else {
            // Chuyển qua xu ly hoan
            await client.query(
                `UPDATE sales_orders SET status = 'return_pending', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [note || 'Khach tu choi nhan don - chuyen xu ly hoan', orderId]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: action === 'return_to_warehouse'
                ? 'Da hoan don lai vao kho!'
                : 'Da chuyen don sang xu ly hoan!'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xu ly yeu cau tra hang', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// PUT /orders/:id/return-to-sales
// Logistics gửi đơn khách không nhận về cho Sales xử lý
// ============================================================
const returnToSales = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { note } = req.body;

        await client.query('BEGIN');

        // Lấy return_request hiện tại
        const rrRes = await client.query(`SELECT id FROM return_requests WHERE order_id = $1`, [orderId]);
        if (rrRes.rows.length) {
            await client.query(`
                UPDATE return_requests SET status = 'return_to_sales',
                customer_reject_reason = 'khong_nhan_hang', complaint_source = 'during_delivery',
                logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE order_id = $2
            `, [note || null, orderId]);
        }

        // Chuyển đơn về return_to_sales (Sales tự quyết định)
        await client.query(`
            UPDATE sales_orders SET status = 'return_to_sales', note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
        `, [`[Logistics] Khach khong nhan hang: ${note || ''}`, orderId]);

        // Ghi log
        await client.query(`
            INSERT INTO delivery_requests (order_id, status, logistics_note)
            VALUES ($1, 'return_to_sales', $2)
        `, [orderId, note || 'Logistics gui don ve Sales']);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da gui don ve Sales xu ly!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi gui don ve Sales', error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllOrders, getNextOrderNo, getOrderItems, createOrder, updateOrder, deleteOrder,
    processLogistics, reportWarehouseIssue, exportOrder, confirmDelivery, returnInventory,
    processCustomerRejection, returnToSales
};
