const db = require('../config/database');

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
    try {
        const { customer_code, company_name, phone, address, contact_person } = req.body;
        const created_by = req.userId;
        const result = await db.run(
            `INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [customer_code, company_name, phone, address, contact_person, created_by]
        );
        res.status(201).json({ message: 'Tao khach hang thanh cong', id: result.rows[0].id });
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: 'Loi tao khach hang (co the trung ma KH)' });
        }
        res.status(500).json({ message: 'Loi tao khach hang', error: err.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await db.run(`DELETE FROM customers WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da xoa khach hang' });
    } catch (err) {
        res.status(500).json({ message: 'Khong the xoa khach hang nay', error: err.message });
    }
};

module.exports = { getAllCustomers, createCustomer, deleteCustomer };
