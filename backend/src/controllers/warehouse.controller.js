const db = require('../config/database');

const getAllWarehouses = async (req, res) => {
    try {
        console.log('[WAREHOUSE] GET all - userId:', req.userId);
        const rows = await db.getAll(`SELECT id, warehouse_code, name, location FROM warehouses ORDER BY id ASC`);
        console.log('[WAREHOUSE] GET all - rows:', rows.length);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[WAREHOUSE] GET all error:', err.code, err.message);
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

module.exports = { getAllWarehouses, createWarehouse, deleteWarehouse };
