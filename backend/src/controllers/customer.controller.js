const db = require('../config/database');
const generateCode = require('../utils/autoCode');

const getAllCustomers = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT c.*, u.full_name as creator_name
            FROM customers c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.id DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const createCustomer = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { company_name, phone, address, contact_person } = req.body;
        const created_by = req.userId;

        if (!company_name || !company_name.trim()) {
            client.release();
            return res.status(400).json({ message: 'Ten cong ty khong duoc de trong' });
        }

        await client.query('BEGIN');
        const newCustomerCode = await generateCode('customer', client);
        const result = await client.query(
            `INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [newCustomerCode, company_name.trim(), phone?.trim() || null, address?.trim() || null, contact_person?.trim() || null, created_by]
        );
        await client.query('COMMIT');
        client.release();
        res.status(201).json({ message: 'Tao khach hang thanh cong', id: result.rows[0].id, customer_code: newCustomerCode });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: 'Loi tao khach hang (co the trung ma KH)' });
        }
        res.status(500).json({ message: 'Loi tao khach hang', error: err.message });
    }
};

const deleteCustomer = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');
        const codeRow = await client.query(`SELECT customer_code FROM customers WHERE id = $1`, [id]);
        const code = codeRow.rows[0]?.customer_code;
        await client.query(`DELETE FROM customers WHERE id = $1`, [id]);
        if (code) await client.query(`DELETE FROM auto_codes WHERE code = $1`, [code]);
        await client.query('COMMIT');
        client.release();
        res.status(200).json({ message: 'Da xoa khach hang' });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
        if (err.code === '23503') {
            return res.status(400).json({ message: 'Khach hang dang duoc su dung, khong the xoa!' });
        }
        res.status(500).json({ message: 'Khong the xoa khach hang nay', error: err.message });
    }
};

module.exports = { getAllCustomers, createCustomer, deleteCustomer };
