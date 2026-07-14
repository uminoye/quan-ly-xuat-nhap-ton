// Setup script - Tao bang + Seed data len Neon
// Chay: node src/setup.js
require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('Loi: Chua co DATABASE_URL! Copy vao .env truoc.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const bcrypt = require('bcryptjs');
const PASSWORD = '123456';
const HASH = bcrypt.hashSync(PASSWORD, 10);

async function setup() {
    console.log('Ket noi Neon thanh cong!\n');
    const client = await pool.connect();

    try {
        // ====== TAO BANG SCHEMA ======
        console.log('[1/2] Tao bang tren Neon...');

        await client.query(`CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL, description VARCHAR(255)
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL, role_id INTEGER REFERENCES roles(id),
            status VARCHAR(20) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY, customer_code VARCHAR(50) UNIQUE NOT NULL, company_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20), address TEXT, contact_person VARCHAR(100), created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS warehouses (
            id SERIAL PRIMARY KEY, warehouse_code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL, location TEXT,
            warehouse_type VARCHAR(30) DEFAULT NULL
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS auto_codes (
            code VARCHAR(50) PRIMARY KEY,
            prefix VARCHAR(20) NOT NULL,
            year INTEGER NOT NULL
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_auto_codes_prefix_year ON auto_codes(prefix, year)`);
        await client.query(`CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY, sku VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL,
            unit VARCHAR(50), category VARCHAR(100), image_url TEXT, min_stock INTEGER DEFAULT 50,
            sale_price DECIMAL(15, 2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS production_receipts (
            id SERIAL PRIMARY KEY, receipt_no VARCHAR(50) UNIQUE NOT NULL,
            warehouse_id INTEGER REFERENCES warehouses(id), receipt_date TIMESTAMP NOT NULL,
            created_by INTEGER REFERENCES users(id), status VARCHAR(50) DEFAULT 'pending',
            note TEXT, responded_by VARCHAR(100), responded_reason TEXT,
            expected_delivery_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS production_receipt_items (
            id SERIAL PRIMARY KEY, receipt_id INTEGER REFERENCES production_receipts(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS sales_orders (
            id SERIAL PRIMARY KEY, order_no VARCHAR(50) UNIQUE NOT NULL,
            customer_id INTEGER REFERENCES customers(id), order_date TIMESTAMP NOT NULL,
            expected_delivery_date TIMESTAMP, actual_delivery_date TIMESTAMP,
            created_by INTEGER REFERENCES users(id), status VARCHAR(50) DEFAULT 'draft',
            delivery_step INTEGER DEFAULT 0,
            note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`DO $$ BEGIN
            ALTER TABLE production_receipts ADD COLUMN IF NOT EXISTS defect_type VARCHAR(50);
        EXCEPTION WHEN others THEN NULL;
        END $$`);
        await client.query(`DO $$ BEGIN
            ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_step INTEGER DEFAULT 0;
        EXCEPTION WHEN others THEN NULL;
        END $$`);
        await client.query(`DO $$ BEGIN
            ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS note TEXT;
        EXCEPTION WHEN others THEN NULL;
        END $$`);
        await client.query(`CREATE TABLE IF NOT EXISTS sales_order_items (
            id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL,
            unit_price DECIMAL(15, 2)
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS delivery_requests (
            id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES sales_orders(id),
            handled_by INTEGER REFERENCES users(id), received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'received', logistics_note TEXT, warehouse_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS stock_outbound_notes (
            id SERIAL PRIMARY KEY, outbound_no VARCHAR(50) UNIQUE NOT NULL,
            order_id INTEGER REFERENCES sales_orders(id), warehouse_id INTEGER REFERENCES warehouses(id),
            export_date TIMESTAMP, created_by INTEGER REFERENCES users(id),
            status VARCHAR(50) DEFAULT 'pending', note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS stock_outbound_note_items (
            id SERIAL PRIMARY KEY, outbound_note_id INTEGER REFERENCES stock_outbound_notes(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS inventory_balances (
            id SERIAL PRIMARY KEY, warehouse_id INTEGER REFERENCES warehouses(id),
            product_id INTEGER REFERENCES products(id), on_hand_qty INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(warehouse_id, product_id)
        )`);
        await client.query(`CREATE TABLE IF NOT EXISTS inventory_transactions (
            id SERIAL PRIMARY KEY, warehouse_id INTEGER REFERENCES warehouses(id),
            product_id INTEGER REFERENCES products(id), transaction_type VARCHAR(20) NOT NULL,
            quantity INTEGER NOT NULL, reference_type VARCHAR(50), reference_id INTEGER,
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        // Indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_balances_warehouse ON inventory_balances(warehouse_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_balances_product ON inventory_balances(product_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type)`);
        await client.query(`CREATE TABLE IF NOT EXISTS shipping_orders (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES sales_orders(id),
            carrier_code VARCHAR(20) NOT NULL,
            carrier_name VARCHAR(100) NOT NULL,
            tracking_no VARCHAR(100) UNIQUE NOT NULL,
            shipping_fee DECIMAL(15, 2) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'assigned',
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            shipped_at TIMESTAMP,
            delivered_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_shipping_orders_order ON shipping_orders(order_id)`);

        // ====== RETURNS & COMPENSATIONS ======
        await client.query(`CREATE TABLE IF NOT EXISTS return_requests (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES sales_orders(id) UNIQUE,
            customer_reject_reason VARCHAR(50),
            customer_reject_detail TEXT,
            complaint_source VARCHAR(30),
            logistics_action VARCHAR(50),
            logistics_note TEXT,
            handling_result VARCHAR(50),
            compensation_no VARCHAR(50),
            factory_acknowledged BOOLEAN DEFAULT FALSE,
            factory_responded_at TIMESTAMP,
            status VARCHAR(30) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`DO $$ BEGIN ALTER TABLE return_requests ADD CONSTRAINT return_requests_order_id_key UNIQUE (order_id); EXCEPTION WHEN others THEN NULL; END $$`);
        await client.query(`DO $$ BEGIN ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_step INTEGER DEFAULT 0; EXCEPTION WHEN others THEN NULL; END $$`);
        await client.query(`DO $$ BEGIN ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS note TEXT; EXCEPTION WHEN others THEN NULL; END $$`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id)`);

        await client.query(`CREATE TABLE IF NOT EXISTS return_items (
            id SERIAL PRIMARY KEY,
            return_id INTEGER REFERENCES return_requests(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            quantity INTEGER NOT NULL,
            is_defective BOOLEAN DEFAULT true,
            handled_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)`);

        // compensation_requests: ton tai truoc return_requests (do return_requests tham chieu no qua return_id)
        await client.query(`CREATE TABLE IF NOT EXISTS compensation_requests (
            id SERIAL PRIMARY KEY,
            compensation_no VARCHAR(50) UNIQUE NOT NULL,
            return_id INTEGER REFERENCES return_requests(id),
            order_id INTEGER REFERENCES sales_orders(id),
            warehouse_id INTEGER REFERENCES warehouses(id),
            defect_type VARCHAR(30),
            total_items INTEGER DEFAULT 0,
            status VARCHAR(30) DEFAULT 'pending',
            resolution_note TEXT,
            responded_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_compensation_requests_return ON compensation_requests(return_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_compensation_requests_status ON compensation_requests(status)`);

        // compensation_items: ton tai truoc compensation_requests (do compensation_requests tham chieu no qua compensation_id)
        await client.query(`CREATE TABLE IF NOT EXISTS compensation_items (
            id SERIAL PRIMARY KEY,
            compensation_id INTEGER REFERENCES compensation_requests(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            defective_qty INTEGER NOT NULL,
            unit_price DECIMAL(15, 2) DEFAULT 0
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_compensation_items_compensation ON compensation_items(compensation_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(order_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_delivery_requests_order ON delivery_requests(order_id)`);

        // ====== CLAIMS (ĐÒI BỒI THƯỜNG) ======
        await client.query(`CREATE TABLE IF NOT EXISTS supplier_claims (
            id SERIAL PRIMARY KEY,
            claim_no VARCHAR(50) UNIQUE NOT NULL,
            return_id INTEGER REFERENCES return_requests(id),
            order_id INTEGER REFERENCES sales_orders(id),
            warehouse_id INTEGER REFERENCES warehouses(id),
            defect_reason VARCHAR(100),
            total_items INTEGER DEFAULT 0,
            status VARCHAR(30) DEFAULT 'pending',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_supplier_claims_return ON supplier_claims(return_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_supplier_claims_status ON supplier_claims(status)`);

        await client.query(`CREATE TABLE IF NOT EXISTS carrier_claims (
            id SERIAL PRIMARY KEY,
            claim_no VARCHAR(50) UNIQUE NOT NULL,
            return_id INTEGER REFERENCES return_requests(id),
            order_id INTEGER REFERENCES sales_orders(id),
            carrier_code VARCHAR(20),
            carrier_name VARCHAR(100),
            warehouse_id INTEGER REFERENCES warehouses(id),
            defect_reason VARCHAR(100),
            total_items INTEGER DEFAULT 0,
            estimated_amount DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'pending',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_carrier_claims_return ON carrier_claims(return_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_carrier_claims_status ON carrier_claims(status)`);

        // ====== NOTIFICATIONS (THÔNG BÁO) ======
        await client.query(`CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            recipient_role VARCHAR(30) NOT NULL,
            recipient_user_id INTEGER REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            message TEXT,
            type VARCHAR(30) DEFAULT 'info',
            reference_type VARCHAR(30),
            reference_id INTEGER,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, is_read)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(recipient_user_id, is_read)`);

        console.log('   ✓ Tat ca bang da tao!\n');

        // ====== SEED DATA ======
        console.log('[2/2] Seed du lieu...');

        await client.query(`INSERT INTO roles (name, description) VALUES
            ('Admin', 'Quan tri vien he thong'),
            ('Sales', 'Nhan vien kinh doanh'),
            ('Logistics', 'Nhan vien dieu phoi'),
            ('Warehouse', 'Nhan vien kho'),
            ('Factory', 'Nha may san xuat')
            ON CONFLICT DO NOTHING`);
        console.log('   ✓ Roles');

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
        console.log('   ✓ Users (mat khau: 123456)');

        await client.query(`
            INSERT INTO warehouses (warehouse_code, name, location, warehouse_type) VALUES
            ('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong', 'main'),
            ('KHO-LOI',  'Kho Hang Loi / Hu Hong', 'Khu vuc cach ly, KCN Song Than, Binh Duong', 'defective')
            ON CONFLICT (warehouse_code) DO NOTHING
        `);
        console.log('   ✓ Warehouses');

        const products = [
            ['LAP-XPS15', 'Laptop Dell XPS 15 9530', 'Cai', 'Laptop', 35000000, 50],
            ['MAC-M3', 'MacBook Pro 14 inch M3', 'Cai', 'Laptop', 39990000, 50],
            ['IPH-15P', 'iPhone 15 Pro Max 256GB', 'Chiec', 'Dien thoai', 29500000, 50],
            ['MON-LG27', 'Man hinh LG 27 inch 4K', 'Bo', 'Phu kien', 8500000, 50],
            ['KEY-MX', 'Ban phim co Logitech MX Mechanical', 'Cai', 'Phu kien', 3200000, 50],
        ];
        for (const [sku, name, unit, cat, price, min] of products) {
            await client.query(`INSERT INTO products (sku, name, unit, category, sale_price, min_stock)
                VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (sku) DO NOTHING`,
                [sku, name, unit, cat, price, min]);
        }
        console.log(`   ✓ ${products.length} Products`);

        const customers = [
            ['KH-TGDD', 'The Gioi Di Dong (MWG)', '18001060', 'Khu cong nghe cao, Quan 9, TPHCM', 'Anh Hieu (Phong Thu Mua)', 2],
            ['KH-FPT', 'FPT Retail', '18006601', '261 Khanh Hoi, Quan 4, TPHCM', 'Chi Mai (Quan ly chuoi)', 2],
            ['KH-PV', 'Phong Vu Computer', '18006867', '214 Quan Thanh, Ba Dinh, Ha Noi', 'Anh Nam (Giam doc kinh doanh)', 2],
            ['KH-CELL', 'CellphoneS', '18002097', '115 Thai Ha, Dong Da, Ha Noi', 'Chi Linh (Truong phong cung ung)', 2],
        ];
        for (const [code, company, phone, addr, contact, createdBy] of customers) {
            await client.query(`INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
                VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (customer_code) DO NOTHING`,
                [code, company, phone, addr, contact, createdBy]);
        }
        console.log(`   ✓ ${customers.length} Customers`);

        await client.query(`INSERT INTO auto_codes (code, prefix, year) VALUES
            ('GHN-2026-0001', 'GHN', 2026),
            ('GR-2026-0001',  'GR',  2026),
            ('GHT-2026-0001','GHT', 2026),
            ('CLS-2026-0001','CLS', 2026),
            ('CLC-2026-0001','CLC', 2026)
            ON CONFLICT (code) DO NOTHING`);
        console.log('   ✓ Shipping prefixes');        console.log('\n========================================');
        console.log('Setup thanh cong! Tat ca mat khau: 123456');
        console.log('========================================');
        console.log('  admin@congty.com     / 123456 (Admin)');
        console.log('  sale@congty.com      / 123456 (Sales)');
        console.log('  logistics@congty.com / 123456 (Logistics)');
        console.log('  kho@congty.com       / 123456 (Warehouse)');
        console.log('  nhamay@congty.com    / 123456 (Factory)');
        console.log('========================================');
        console.log('\nBay gio ban co the dang nhap tren website!');

    } catch (err) {
        console.error('\nLoi:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
