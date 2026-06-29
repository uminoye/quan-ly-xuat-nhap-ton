const db = require('../config/database');

const getAllWarehouses = async (req, res) => {
    try {
        const rows = await db.getAll(`SELECT * FROM warehouses ORDER BY id ASC`);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach kho' });
    }
};

const createWarehouse = async (req, res) => {
    try {
        const { name, location } = req.body;
        if (!name) return res.status(400).json({ message: 'Ten kho khong duoc de trong' });
        const result = await db.run(
            `INSERT INTO warehouses (name, location) VALUES ($1, $2) RETURNING id`,
            [name, location]
        );
        res.status(201).json({ id: result.rows[0].id, name, location });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi them kho moi' });
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
        res.status(500).json({ message: 'Kho nay da co lich su giao dich, khong nen xoa!' });
    } finally {
        client.release();
    }
};

module.exports = { getAllWarehouses, createWarehouse, deleteWarehouse };
