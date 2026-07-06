const db = require('../config/database');

const getAllWarehouses = async (req, res) => {
    try {
        console.log('[WAREHOUSE] GET all - userId:', req.userId);
        const rows = await db.getAll(`SELECT id, warehouse_code, name, location, warehouse_type FROM warehouses ORDER BY id ASC`);
        console.log('[WAREHOUSE] GET all - rows:', rows.length);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[WAREHOUSE] GET all error:', err.code, err.message);
        res.status(500).json({ message: 'Loi lay danh sach kho', detail: err.message });
    }
};

const getWarehousesForOutbound = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT id, warehouse_code, name, location, warehouse_type
            FROM warehouses
            WHERE (warehouse_type IS NULL OR warehouse_type != 'defective')
            AND warehouse_code != 'KHO-LOI'
            ORDER BY id ASC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach kho', detail: err.message });
    }
};

const createWarehouse = async (req, res) => {
    try {
        const { name, location } = req.body;
        if (!name) return res.status(400).json({ message: 'Ten kho khong duoc de trong' });
        const year = new Date().getFullYear();
        const existing = await db.getAll(`SELECT warehouse_code FROM warehouses WHERE warehouse_code LIKE $1`, [`KHO-${year}-%`]);
        const nextNum = (existing.length + 1).toString().padStart(4, '0');
        const warehouse_code = `KHO-${year}-${nextNum}`;
        console.log('[WAREHOUSE] Create:', warehouse_code, name);
        const result = await db.run(
            `INSERT INTO warehouses (warehouse_code, name, location) VALUES ($1, $2, $3) RETURNING id, warehouse_code, name, location`,
            [warehouse_code, name, location]
        );
        console.log('[WAREHOUSE] Created:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[WAREHOUSE] Create error:', err.code, err.message);
        res.status(500).json({ message: 'Loi khi them kho moi', detail: err.message });
    }
};

const getDefectiveOrders = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT
                rr.id, rr.order_id, rr.logistics_action, rr.handling_result,
                rr.complaint_source, rr.status, rr.created_at, rr.updated_at,
                so.order_no,
                c.company_name AS customer_name,
                so.expected_delivery_date, so.actual_delivery_date,
                (
                    SELECT COALESCE(
                        (SELECT w.name FROM stock_outbound_notes son
                         JOIN warehouses w ON w.id = son.warehouse_id
                         WHERE son.order_id = so.id ORDER BY son.id DESC LIMIT 1),
                        (SELECT w.name FROM production_receipts pr
                         JOIN warehouses w ON w.id = pr.warehouse_id
                         WHERE pr.note LIKE '%' || so.order_no || '%' ORDER BY pr.id DESC LIMIT 1),
                        'Kho lỗi'
                    )
                ) AS warehouse_name,
                (
                    SELECT json_agg(json_build_object(
                        'product_id', soi.product_id,
                        'product_name', p.name,
                        'sku', p.sku,
                        'quantity', soi.quantity,
                        'unit_price', COALESCE(soi.unit_price, p.sale_price, 0)
                    )) FILTER (WHERE soi.product_id IS NOT NULL)
                    FROM sales_order_items soi
                    LEFT JOIN products p ON p.id = soi.product_id
                    WHERE soi.order_id = so.id
                ) AS order_items
            FROM return_requests rr
            JOIN sales_orders so ON rr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            WHERE rr.logistics_action IN ('loi_van_tai', 'loi_nha_may')
            ORDER BY rr.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[getDefectiveOrders] error:', err.message);
        res.status(500).json({ message: 'Loi lay danh sach don loi', error: err.message });
    }
};

const deleteWarehouse = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const row = await db.getOne(`SELECT COALESCE(SUM(on_hand_qty), 0) as total FROM inventory_balances WHERE warehouse_id = $1`, [id]);
        if (row && Number(row.total) > 0) {
            return res.status(400).json({ message: `Kho con ${row.total} mon hang, khong duoc xoa!` });
        }
        await client.query('BEGIN');
        await client.query(`DELETE FROM inventory_balances WHERE warehouse_id = $1`, [id]);
        await client.query(`DELETE FROM warehouses WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xoa kho thanh cong!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[WAREHOUSE] Delete error:', err.code, err.message);
        res.status(500).json({ message: 'Kho nay da co lich su giao dich, khong nen xoa!' });
    } finally {
        client.release();
    }
};

module.exports = { getAllWarehouses, getWarehousesForOutbound, createWarehouse, deleteWarehouse, getDefectiveOrders };
