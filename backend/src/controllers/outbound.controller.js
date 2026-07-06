const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const getAllOutbounds = async (req, res) => {
    try {
        const query = `
            SELECT
                o.id, o.outbound_no, o.order_id, o.warehouse_id, o.export_date,
                o.created_by, o.status, o.note, o.created_at, o.updated_at,
                s.order_no, s.order_date, s.expected_delivery_date, s.actual_delivery_date,
                s.status AS order_status, s.note AS order_note, s.created_at AS order_created_at,
                c.company_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
                w.name AS warehouse_name, w.warehouse_code AS warehouse_code,
                u.full_name AS creator_name,
                COALESCE(SUM(soi.quantity * COALESCE(soi.unit_price, 0)), 0) AS total_amount,
                (
                    SELECT json_agg(json_build_object(
                        'id', soi2.id, 'product_id', soi2.product_id,
                        'product_name', p2.name, 'product_sku', p2.sku,
                        'quantity', soi2.quantity, 'unit_price', COALESCE(soi2.unit_price, 0)
                    ))
                    FROM sales_order_items soi2
                    JOIN products p2 ON p2.id = soi2.product_id
                    WHERE soi2.order_id = s.id
                ) AS items
            FROM stock_outbound_notes o
            LEFT JOIN warehouses w ON o.warehouse_id = w.id
            LEFT JOIN users u ON o.created_by = u.id
            LEFT JOIN sales_orders s ON o.order_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sales_order_items soi ON soi.order_id = s.id
            GROUP BY o.id, s.id, c.id, w.id, u.id
            ORDER BY o.id DESC
        `;
        const rows = await db.getAll(query);
        const parsedRows = rows.map(row => ({
            ...row,
            items: Array.isArray(row.items) ? row.items.filter(i => i && i.id != null) : [],
        }));
        res.status(200).json(parsedRows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach', error: err.message });
    }
};

const getPendingOutboundRequests = async (req, res) => {
    try {
        const query = `
            SELECT
                s.id, s.order_no, s.order_date, s.expected_delivery_date,
                CASE WHEN s.status IN ('canceled', 'returned') THEN NULL ELSE s.actual_delivery_date END AS actual_delivery_date,
                s.status AS order_status, s.note AS order_note, s.created_at, s.updated_at,
                c.company_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
                COALESCE(SUM(soi.quantity * COALESCE(soi.unit_price, p.sale_price, 0)), 0) AS total_amount,
                (
                    SELECT json_agg(json_build_object(
                        'id', soi2.id, 'product_id', soi2.product_id,
                        'product_name', p2.name, 'product_sku', p2.sku,
                        'quantity', soi2.quantity, 'unit_price', COALESCE(soi2.unit_price, p2.sale_price, 0)
                    ))
                    FROM sales_order_items soi2
                    JOIN products p2 ON p2.id = soi2.product_id
                    WHERE soi2.order_id = s.id
                ) AS items,
                (
                    SELECT d.status FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS delivery_status,
                (
                    SELECT d.logistics_note FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS delivery_note,
                (
                    SELECT d.warehouse_note FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS warehouse_note,
                (
                    SELECT son.warehouse_id FROM stock_outbound_notes son
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS warehouse_id,
                (
                    SELECT w.name FROM stock_outbound_notes son
                    JOIN warehouses w ON w.id = son.warehouse_id
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS warehouse_name,
                (
                    SELECT son.export_date FROM stock_outbound_notes son
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS export_date
            FROM sales_orders s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sales_order_items soi ON s.id = soi.order_id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE s.status IN ('warehouse_processing', 'shipping', 'completed', 'returned', 'canceled', 'waiting_sales', 'customer_rejected', 'return_pending')
                OR EXISTS (
                    SELECT 1 FROM delivery_requests d
                    WHERE d.order_id = s.id
                        AND COALESCE(d.status, '') IN ('warehouse_processing', 'shipping', 'completed', 'waiting_sales', 'customer_rejected', 'return_pending')
                )
            GROUP BY s.id, c.id
            ORDER BY s.updated_at DESC, s.id DESC
        `;
        const rows = await db.getAll(query);
        const parsedRows = rows.map(row => ({
            ...row,
            items: Array.isArray(row.items) ? row.items.filter(i => i && i.id != null) : [],
        }));
        res.status(200).json(parsedRows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach don cho xuat', error: err.message });
    }
};

const createOutboundFromPending = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, warehouse_id, export_date, note } = req.body;
        const created_by = req.user?.id || 1;
        if (!order_id || !warehouse_id) return res.status(400).json({ message: 'Thieu thong tin don hang hoac kho xuat!' });

        const items = await db.getAll(
            `SELECT soi.product_id, soi.quantity, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price
             FROM sales_order_items soi LEFT JOIN products p ON soi.product_id = p.id WHERE soi.order_id = $1`,
            [order_id]
        );
        if (!items.length) return res.status(400).json({ message: 'Khong tim thay chi tiet san pham cua don hang nay!' });

        for (const item of items) {
            const stock = await db.getOne(
                `SELECT on_hand_qty FROM inventory_balances WHERE product_id = $1 AND warehouse_id = $2`,
                [item.product_id, warehouse_id]
            );
            const qty = stock ? stock.on_hand_qty : 0;
            if (qty < item.quantity) {
                return res.status(400).json({ message: `San pham ID ${item.product_id} chi con ${qty}, khong du de xuat ${item.quantity}!` });
            }
        }

        await client.query('BEGIN');
        const outbound_no = await generateCode('outbound');
        const result = await client.query(
            `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING id`,
            [outbound_no, order_id, warehouse_id, export_date || new Date().toISOString().split('T')[0], created_by, note || null]
        );
        const outboundId = result.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [outboundId, item.product_id, item.quantity]
            );
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                VALUES ($1, $2, 0)
                ON CONFLICT (warehouse_id, product_id) DO UPDATE
                SET on_hand_qty = inventory_balances.on_hand_qty - $3, updated_at = CURRENT_TIMESTAMP`,
                [warehouse_id, item.product_id, item.quantity]
            );
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                 VALUES ($1, $2, 'OUT', $3, 'stock_outbound', $4)`,
                [warehouse_id, item.product_id, item.quantity, outboundId]
            );
        }
        await client.query(`UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Xuat kho thanh cong! Da tru ton va cap nhat don hang.', outbound_id: outboundId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xuat kho', error: err.message });
    } finally {
        client.release();
    }
};

const respondOutbound = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id } = req.params;
        const { action, reason, warehouse_action } = req.body;
        const userId = req.user?.id || null;

        if (action === 'reject') {
            // Kho từ chối → gửi về Sales với hướng xử lý
            await client.query('BEGIN');
            await client.query(
                `UPDATE sales_orders SET status = 'waiting_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [order_id]
            );
            await client.query(
                `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note, warehouse_note)
                 VALUES ($1, $2, 'waiting_sales', $3, $4)`,
                [order_id, userId, warehouse_action || null, reason || null]
            );
            await client.query('COMMIT');
            res.status(200).json({ message: 'Da tu choi xuat hang. Don cho Sales xu ly.' });
        } else {
            // Chấp nhận → giữ nguyên
            res.status(200).json({ message: 'Da tiep nhan don hang.' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cap nhat phan hoi' });
    } finally {
        client.release();
    }
};

const createOutbound = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, warehouse_id, export_date, note } = req.body;
        const created_by = req.user?.id || 1;
        if (!order_id || !warehouse_id) return res.status(400).json({ message: 'Thieu thong tin don hang hoac kho xuat!' });

        const items = await db.getAll(
            `SELECT soi.product_id, soi.quantity, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price, p.name, p.sku
             FROM sales_order_items soi LEFT JOIN products p ON soi.product_id = p.id WHERE soi.order_id = $1`,
            [order_id]
        );
        if (!items.length) return res.status(400).json({ message: 'Khong tim thay chi tiet san pham!' });

        for (const item of items) {
            const stock = await db.getOne(
                `SELECT on_hand_qty FROM inventory_balances WHERE product_id = $1 AND warehouse_id = $2`,
                [item.product_id, warehouse_id]
            );
            if ((stock ? stock.on_hand_qty : 0) < item.quantity) {
                return res.status(400).json({ message: `San pham [${item.name || item.sku}] chi con ${stock?.on_hand_qty || 0}, khong du!` });
            }
        }

        await client.query('BEGIN');
        const outbound_no = await generateCode('outbound');
        const result = await client.query(
            `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING id`,
            [outbound_no, order_id, warehouse_id, export_date, created_by, note]
        );
        const outboundId = result.rows[0].id;

        for (const item of items) {
            await client.query(`INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [outboundId, item.product_id, item.quantity]);

            // Neu chua co record ton kho, tao moi; neu co thi tru ton
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                VALUES ($1, $2, 0)
                ON CONFLICT (warehouse_id, product_id) DO UPDATE
                SET on_hand_qty = inventory_balances.on_hand_qty - $3, updated_at = CURRENT_TIMESTAMP`,
                [warehouse_id, item.product_id, item.quantity]);

            await client.query(`INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id) VALUES ($1, $2, 'OUT', $3, 'stock_outbound', $4)`,
                [warehouse_id, item.product_id, item.quantity, outboundId]);
        }
        await client.query(`UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Xuat kho thanh cong! Da tru ton va cap nhat don hang.', outbound_id: outboundId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Loi tao phieu xuat!', error: err.message });
    } finally {
        client.release();
    }
};

const createOutboundFallback = async (_req, res) => {
    res.status(501).json({ message: 'Chua ho tro' });
};

const getWarehouseStock = async (req, res) => {
    try {
        const { warehouse_id } = req.params;
        const rows = await db.getAll(`
            SELECT ib.product_id, ib.on_hand_qty, p.name AS product_name, p.sku
            FROM inventory_balances ib
            JOIN products p ON p.id = ib.product_id
            WHERE ib.warehouse_id = $1 AND ib.on_hand_qty > 0
            ORDER BY p.name ASC
        `, [warehouse_id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay ton kho', error: err.message });
    }
};

module.exports = {
    getAllOutbounds, getPendingOutboundRequests, createOutbound,
    createOutboundFromPending, respondOutbound, createOutboundFallback, getWarehouseStock
};
