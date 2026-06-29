const db = require('../config/database');

const getAllOrders = async (req, res) => {
    try {
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
                o.note,
                o.created_at,
                o.updated_at,
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
                    note: row.note,
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
        const { order_no, customer_id, order_date, expected_delivery_date, note, items } = req.body;
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [order_no, customer_id, order_date, expected_delivery_date, note]
        );
        const orderId = result.rows[0].id;
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Tao don hang thanh cong', id: orderId });
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
    try {
        const { id } = req.params;
        const order = await db.getOne(`SELECT status FROM sales_orders WHERE id = $1`, [id]);
        if (!order) return res.status(404).json({ message: 'Khong tim thay don hang' });
        const currentStatus = order.status || 'pending';
        if (currentStatus !== 'pending' && currentStatus !== 'returned') {
            return res.status(400).json({ message: 'Khong the xoa don hang da duoc xu ly!' });
        }
        await db.run(`DELETE FROM sales_order_items WHERE order_id = $1`, [id]);
        await db.run(`DELETE FROM sales_orders WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da xoa don hang thanh cong' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi xoa' });
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
            `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
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

module.exports = {
    getAllOrders, getOrderItems, createOrder, updateOrder, deleteOrder,
    processLogistics, reportWarehouseIssue, exportOrder, confirmDelivery, returnInventory
};
