const db = require('../config/database');

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

module.exports = { processOrder };
