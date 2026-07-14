require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    await pool.query(`INSERT INTO customers (customer_code, company_name, contact_person, phone, address, created_by) VALUES
    ('KH001', 'Cong ty Dien May Xanh', 'Nguyen Van A', '0901234567', '123 Nguyen Trai, HCM', 1),
    ('KH002', 'Cong ty FPT Shop', 'Tran Van B', '0987654321', '456 Le Loi, HN', 1),
    ('KH003', 'Cellphones', 'Le Thi C', '0912345678', '789 Tran Hung Dao, HCM', 1),
    ('KH004', 'Hoang Ha Mobile', 'Pham Van D', '0909876543', '321 Cach Mang Thang 8, HN', 1)`);
    console.log('Customers created!');
    process.exit(0);
}
run();
