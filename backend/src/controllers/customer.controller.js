const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const getAllCustomers = async (req, res) => {
    console.log('[DEBUG getAllCustomers] start');
    try {
        console.log('[DEBUG getAllCustomers] running query');
        const rows = await db.getAll(`
            SELECT c.*, u.full_name as creator_name
            FROM customers c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.id DESC
        `);
        console.log('[DEBUG getAllCustomers] query done, rows:', rows.length);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[DEBUG getAllCustomers] ERROR:', err.message);
        console.error('[DEBUG getAllCustomers] STACK:', err.stack);
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const getNextCustomerCode = async (req, res) => {
    const db = require('../config/database');
    const client = await db.pool.connect();
    try {
        const prefix = 'KH';
        const year = new Date().getFullYear();

        await client.query('BEGIN');
        const lockRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
            [`${prefix}-${year}-%`]
        );
        let nextNum = 1;
        if (lockRes.rows[0]?.code) {
            const lastNum = parseInt(lockRes.rows[0].code.split('-').pop(), 10);
            nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
        }
        await client.query('COMMIT');

        const nextCode = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
        res.status(200).json({ next_code: nextCode });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[getNextCustomerCode] ERROR:', err.message);
        res.status(500).json({ message: 'Lỗi sinh mã tiếp theo', error: err.message });
    } finally {
        client.release();
    }
};

const createCustomer = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { company_name, phone, address, contact_person } = req.body;
        const created_by = req.userId;

        console.log('\n========== [CREATE CUSTOMER] ==========');
        console.log('req.userId:', created_by);
        console.log('req.body:', JSON.stringify(req.body, null, 2));

        if (!company_name || !company_name.trim()) {
            client.release();
            return res.status(400).json({ message: 'Ten cong ty khong duoc de trong' });
        }

        await client.query('BEGIN');
        const newCustomerCode = await generateCode('customer', client);
        console.log('  newCustomerCode:', newCustomerCode);

        const result = await client.query(
            `INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [newCustomerCode, company_name.trim(), phone?.trim() || null, address?.trim() || null, contact_person?.trim() || null, created_by]
        );
        await client.query('COMMIT');
        client.release();
        console.log('  SUCCESS — customer id:', result.rows[0].id);
        console.log('=======================================\n');
        res.status(201).json({ message: 'Tao khach hang thanh cong', id: result.rows[0].id, customer_code: newCustomerCode });
    } catch (err) {
        console.error('  ERROR:', err.message);
        if (err.code) console.error('  SQL error code:', err.code);
        console.error('=======================================\n');
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Mã khách hàng đã tồn tại. Vui lòng thử lại.' });
        }
        res.status(500).json({ message: 'Lỗi tạo khách hàng', error: err.message });
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

module.exports = { getAllCustomers, getNextCustomerCode, createCustomer, deleteCustomer };
