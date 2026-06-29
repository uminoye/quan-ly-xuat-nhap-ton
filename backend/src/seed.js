// Seed script - chay truc tiep tren may tinh cua ban
// Ket noi Neon PostgreSQL va insert seed data
require('dotenv').config();
const { Pool } = require('pg');

// Kiem tra DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('Loi: Chua co DATABASE_URL!');
    console.error('Vui long copy connection string tu Neon vao file .env cua backend');
    console.error('Hoac chay: set DATABASE_URL="postgresql://..." && node src/seed.js');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const bcrypt = require('bcryptjs');
const PASSWORD = '123456';
const HASH = bcrypt.hashSync(PASSWORD, 10);

async function seed() {
    console.log('Bat dau seed du lieu len Neon...\n');
    const client = await pool.connect();

    try {
        // Seed roles
        await client.query(`
            INSERT INTO roles (name, description) VALUES
            ('Admin', 'Quan tri vien he thong'),
            ('Sales', 'Nhan vien kinh doanh'),
            ('Logistics', 'Nhan vien dieu phoi'),
            ('Warehouse', 'Nhan vien kho'),
            ('Factory', 'Nha may san xuat')
            ON CONFLICT DO NOTHING
        `);
        console.log('✓ Roles da insert');

        // Seed users
        const users = [
            ['Nguyen Van Admin', 'admin@congty.com', 1],
            ['Tran Thi Sale', 'sale@congty.com', 2],
            ['Le Van Logistics', 'logistics@congty.com', 3],
            ['Pham Thu Kho', 'kho@congty.com', 4],
            ['Truong Nha May', 'nhamay@congty.com', 5],
        ];

        for (const [name, email, roleId] of users) {
            await client.query(`
                INSERT INTO users (full_name, email, password_hash, role_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (email) DO UPDATE SET password_hash = $3
            `, [name, email, HASH, roleId]);
        }
        console.log('✓ Users da insert (mat khau: 123456)');

        // Seed warehouses
        await client.query(`
            INSERT INTO warehouses (warehouse_code, name, location) VALUES
            ('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong')
            ON CONFLICT (warehouse_code) DO NOTHING
        `);
        console.log('✓ Warehouses da insert');

        // Seed products
        const products = [
            ['LAP-XPS15', 'Laptop Dell XPS 15 9530', 'Cai', 'Laptop', 35000000, 50],
            ['MAC-M3', 'MacBook Pro 14 inch M3', 'Cai', 'Laptop', 39990000, 50],
            ['IPH-15P', 'iPhone 15 Pro Max 256GB', 'Chiec', 'Dien thoai', 29500000, 50],
            ['MON-LG27', 'Man hinh LG 27 inch 4K', 'Bo', 'Phu kien', 8500000, 50],
            ['KEY-MX', 'Ban phim co Logitech MX Mechanical', 'Cai', 'Phu kien', 3200000, 50],
        ];

        for (const [sku, name, unit, category, price, minStock] of products) {
            await client.query(`
                INSERT INTO products (sku, name, unit, category, sale_price, min_stock)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (sku) DO NOTHING
            `, [sku, name, unit, category, price, minStock]);
        }
        console.log('✓ Products da insert');

        // Seed customers
        const customers = [
            ['KH-TGDD', 'The Gioi Di Dong (MWG)', '18001060', 'Khu cong nghe cao, Quan 9, TPHCM', 'Anh Hieu (Phong Thu Mua)', 2],
            ['KH-FPT', 'FPT Retail', '18006601', '261 Khanh Hoi, Quan 4, TPHCM', 'Chi Mai (Quan ly chuoi)', 2],
            ['KH-PV', 'Phong Vu Computer', '18006867', '214 Quan Thanh, Ba Dinh, Ha Noi', 'Anh Nam (Giam doc kinh doanh)', 2],
            ['KH-CELL', 'CellphoneS', '18002097', '115 Thai Ha, Dong Da, Ha Noi', 'Chi Linh (Truong phong cung ung)', 2],
        ];

        for (const [code, company, phone, address, contact, createdBy] of customers) {
            await client.query(`
                INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (customer_code) DO NOTHING
            `, [code, company, phone, address, contact, createdBy]);
        }
        console.log('✓ Customers da insert');

        console.log('\n========================================');
        console.log('Seed thanh cong! Tat ca mat khau: 123456');
        console.log('========================================');
        console.log('  admin@congty.com / 123456 (Admin)');
        console.log('  sale@congty.com / 123456 (Sales)');
        console.log('  logistics@congty.com / 123456 (Logistics)');
        console.log('  kho@congty.com / 123456 (Warehouse)');
        console.log('  nhamay@congty.com / 123456 (Factory)');
        console.log('========================================\n');

    } catch (err) {
        console.error('Loi khi seed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
