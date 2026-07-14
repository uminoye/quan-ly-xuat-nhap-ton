# FULL PROJECT CODE DUMP
## ============================


# 1. DATABASE

## === FILE: D:\Doan_5\database\schema.sql ===
`sql
-- KHOI TAO BANG VAI TRO (ROLES)
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- KHOI TAO BANG NGUOI DUNG (USERS)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- KHOI TAO BANG KHACH HANG (CUSTOMERS)
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address text,
    contact_person VARCHAR(100),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- KHOI TAO BANG KHO HANG (WAREHOUSES)
CREATE TABLE warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location text
);

-- KHOI TAO BANG SAN PHAM (PRODUCTS)
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    category VARCHAR(100),
    image_url TEXT,
    min_stock INTEGER DEFAULT 50,
    sale_price DECIMAL(15, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KHOI TAO BANG PHIEU NHAP KHO TU NHA MAY (PRODUCTION RECEIPTS)
CREATE TABLE production_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER,
    receipt_date DATETIME NOT NULL,
    created_by INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    note text,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- CHI TIET PHIEU NHAP KHO
CREATE TABLE production_receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES production_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- KHOI TAO BANG DON HANG XUAT (SALES ORDERS)
CREATE TABLE sales_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER,
    order_date DATETIME NOT NULL,
    expected_delivery_date DATETIME,
    actual_delivery_date DATETIME,
    created_by INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    note text,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- CHI TIET DON HANG XUAT
CREATE TABLE sales_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2),
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- BANG QUAN LY LOGISTICS TIEP NHAN DON (DELIVERY REQUESTS)
CREATE TABLE delivery_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    handled_by INTEGER,
    received_at DATETIME,
    status VARCHAR(50) DEFAULT 'received',
    logistics_note text,
    warehouse_note text,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- KHOI TAO BANG PHIEU XUAT KHO (STOCK OUTBOUND NOTES)
CREATE TABLE stock_outbound_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outbound_no VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER,
    warehouse_id INTEGER,
    export_date DATETIME,
    created_by INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    note text,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- CHI TIET PHIEU XUAT KHO
CREATE TABLE stock_outbound_note_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outbound_note_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (outbound_note_id) REFERENCES stock_outbound_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- BANG LUU SO TON KHO HIEN TAI (INVENTORY BALANCES)
CREATE TABLE inventory_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER,
    product_id INTEGER,
    on_hand_qty INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- BANG LICH SU GIAO DICH KHO (INVENTORY TRANSACTIONS)
CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER,
    product_id INTEGER,
    transaction_type VARCHAR(20) NOT NULL, -- 'IN' hoac 'OUT'
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- VD: 'production_receipt' hoac 'stock_outbound'
    reference_id INTEGER,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
`

## === FILE: D:\Doan_5\database\seed.sql ===
`sql
-- TAO VAI TRO
INSERT INTO roles (name, description) VALUES 
('Admin', 'Quan tri vien he thong'),
('Sales', 'Nhan vien kinh doanh'),
('Logistics', 'Nhan vien dieu phoi'),
('Warehouse', 'Nhan vien kho'),
('Factory', 'Nha may san xuat');

-- TAO TAI KHOAN MAU (Mat khau mac dinh cho tat ca la: 123456)
-- Mat khau da duoc ma hoa (hash) san de he thong nhan dien an toan
INSERT INTO users (full_name, email, password_hash, role_id) VALUES 
('Nguyen Van Admin', 'admin@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 1),
('Tran Thi Sale', 'sale@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 2),
('Le Van Logistics', 'logistics@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 3),
('Pham Thu Kho', 'kho@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 4),
('Truong Nha May', 'nhamay@congty.com', '$2a$10$7Z2P.Z8Z1t9.n2p/h4.R3e.N2.N9.v.b.C.x.S.V.T.v.B.B.B.B.B.B', 5);

-- TAO KHO HANG MAU
INSERT INTO warehouses (warehouse_code, name, location) VALUES 
('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong');

-- TAO SAN PHAM MAU
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('LAP-XPS15', 'Laptop Dell XPS 15 9530', 'Cái', 'Laptop', 35000000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('MAC-M3', 'MacBook Pro 14 inch M3', 'Cái', 'Laptop', 39990000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('IPH-15P', 'iPhone 15 Pro Max 256GB', 'Chiếc', 'Điện thoại', 29500000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('MON-LG27', 'Màn hình LG 27 inch 4K', 'Bộ', 'Phụ kiện', 8500000);
INSERT INTO products (sku, name, unit, category, sale_price) VALUES ('KEY-MX', 'Bàn phím cơ Logitech MX Mechanical', 'Cái', 'Phụ kiện', 3200000);

-- TAO KHACH HANG MAU
INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by) VALUES 
('KH-TGDD', 'The Gioi Di Dong (MWG)', '18001060', 'Khu cong nghe cao, Quan 9, TPHCM', 'Anh Hieu (Phong Thu Mua)', 2),
('KH-FPT', 'FPT Retail', '18006601', '261 Khanh Hoi, Quan 4, TPHCM', 'Chi Mai (Quan ly chuoi)', 2),
('KH-PV', 'Phong Vu Computer', '18006867', '214 Quan Thanh, Ba Dinh, Ha Noi', 'Anh Nam (Giam doc kinh doanh)', 2),
('KH-CELL', 'CellphoneS', '18002097', '115 Thai Ha, Dong Da, Ha Noi', 'Chi Linh (Truong phong cung ung)', 2);
`

# 2. BACKEND - Config & Utils

## === FILE: D:\Doan_5\backend\src\config\database.js ===
`javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

const query = (text, params, client) => (client || pool).query(text, params);

const getOne = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result.rows[0] || null;
};

const getAll = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result.rows;
};

const run = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result;
};

module.exports = { pool, query, getOne, getAll, run };

`

## === FILE: D:\Doan_5\backend\src\utils\autoCode.js ===
`javascript
/**
 * Sinh mã tiếp theo cho một loại document.
 * Luôn chạy trong transaction riêng để tránh race condition.
 * Format: PREFIX-YYYY-NNNN (VD: SP-2026-0001)
 *
 * @param {string} type       - receipt | order | outbound | product | customer
 * @param {object} dbClient  - optional: pg client từ transaction đang chạy
 */
const PREFIXES = {
  receipt:  'YC',
  order:    'SO',
  outbound: 'PXK',
  product:  'SP',
  customer: 'KH',
  shipping: 'GHN',
  GHN:      'GHN',
  GR:       'GR',
  GHT:      'GHT',
  VTP:      'VTP',
  PNH:      'PNH',
  PBH:      'PBH',
  CLS:      'CLS',
  CLC:      'CLC',
};

const generateCode = async (type, dbClient) => {
  const prefix = PREFIXES[type];
  if (!prefix) throw new Error(`Unknown code type: ${type}`);

  const db = require('../config/database');

  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  // Nếu caller truyền vào pg client (đang trong transaction), dùng nó
  // Nếu không, tạo transaction riêng để đảm bảo FOR UPDATE lock hoạt động
  if (dbClient) {
    return _generateInClient(dbClient, prefix, year, pattern, true);
  }

  const client = await db.pool.connect();
  try {
    return await _generateInClient(client, prefix, year, pattern);
  } finally {
    client.release();
  }
};

async function _generateInClient(client, prefix, year, pattern, inTransaction = false) {
  if (!inTransaction) await client.query('BEGIN');

  const lockResult = await client.query(
    `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
    [`${prefix}-${year}-%`]
  );
  const row = lockResult.rows[0];

  let nextNum = 1;
  if (row?.code) {
    const lastNum = parseInt(row.code.split('-').pop(), 10);
    nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  }

  const newCode = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await client.query(
    `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
    [newCode, prefix, year]
  );

  if (!inTransaction) await client.query('COMMIT');
  return newCode;
}

module.exports = { generateCode };

`

## === FILE: D:\Doan_5\backend\src\server.js ===
`javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

// --- CORS cho Vercel Frontend ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://quan-ly-xuat-nhap-ton.vercel.app',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: function (origin, callback) {
    if (origin) console.log('[CORS] origin:', origin);
    if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      callback(null, true);
    } else {
      console.log('[CORS] BLOCKED:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// --- REQUEST LOGGING ---
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- ROUTES ---
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const customerRoutes = require('./routes/customer.routes');
const orderRoutes = require('./routes/order.routes');
const receiptRoutes = require('./routes/receipt.routes');
const logisticsRoutes = require('./routes/logistics.routes');
const outboundRoutes = require('./routes/outbound.routes');
const returnRoutes = require('./routes/return.routes');
const reportRoutes = require('./routes/report.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const uploadRoutes = require('./routes/upload.routes');

// --- TEST ENDPOINT ---
app.get('/api/test', (_req, res) => {
    res.json({
        message: 'Server Backend da hoat dong tren Render!',
        database: 'Ket noi Neon PostgreSQL thanh cong.',
        timestamp: new Date().toISOString(),
    });
});

// --- REGISTER ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/outbounds', outboundRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('LOI HE THONG:', err.stack);
    res.status(500).json({ message: 'Da co loi xay ra tren server!', error: err.message });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chay tai: http://localhost:${PORT}`);
    console.log(`API Test: http://localhost:${PORT}/api/test`);
});

`

## === FILE: D:\Doan_5\backend\src\setup.js ===
`javascript
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
            ['SPH-A24', 'Samsung Galaxy A24 128GB', 'Chiec', 'Dien thoai', 7200000, 80],
            ['SPH-XIA', 'Xiaomi Redmi Note 13 Pro', 'Chiec', 'Dien thoai', 6500000, 80],
            ['TAB-S9F', 'Samsung Galaxy Tab S9 FE', 'Chiec', 'Tablet', 14500000, 30],
            ['HDP-SONY', 'Tai nghe Sony WH-1000XM5', 'Chiec', 'Phu kien', 8900000, 40],
            ['HDP-AIR', 'AirPods Pro 2 USB-C', 'Chiec', 'Phu kien', 6500000, 60],
            ['CHU-MX', 'Chuot Logitech MX Master 3S', 'Chiec', 'Phu kien', 4200000, 70],
            ['MON-DELL', 'Man hinh Dell 27 inch FHD', 'Bo', 'Phu kien', 7800000, 40],
            ['LAP-HP', 'HP Pavilion 15 Ryzen 7', 'Cai', 'Laptop', 18500000, 30],
            ['LAP-LEG', 'Lenovo IdeaPad Gaming 5', 'Cai', 'Laptop', 21000000, 25],
            ['SPH-VIV', 'Vivo V30e 5G', 'Chiec', 'Dien thoai', 9800000, 50],
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
            ['KH-HNDM', 'Hoang Ha Mobile', '19001071', '123 Le Dai Hanh, Quan 11, TPHCM', 'Anh Tuan (Giam doc chien luoc)', 2],
            ['KH-MRT', 'Mai Rong Tay Media', '02838123456', '45 Nguyen Hue, Quan 1, TPHCM', 'Chi Ngoc (Truong phong IT)', 2],
            ['KH-TIKI', 'Tiki Trading', '19006034', 'L2-03, Etown 3, Quan Tan Binh, TPHCM', 'Anh Duc (Procurement Lead)', 2],
            ['KH-SHOP', 'Shopee Express', '0909123456', 'Khu logistics Binh Chanh, TPHCM', 'Chi Lien (Quan ly kho)', 2],
            ['KH-LAZA', 'Lazada Vietnam', '18001234', 'Saigon Centre, Quan 1, TPHCM', 'Anh Phuc (Operations Manager)', 2],
            ['KH-BACH', 'Bach Hoa Xanh', '18006888', 'KCN Tan Binh, TPHCM', 'Chi Ha (Giam doc mua hang)', 2],
            ['KH-WINM', 'Walmart Minh', '0938123456', '54 Pho Cuong, Quan 2, Ha Noi', 'Anh Son (Chief Buyer)', 2],
            ['KH-ELAND', 'E-Land VN', '02862999999', 'Nam Ky Khoi Nghia, Quan 3, TPHCM', 'Chi Oanh (Sales Director)', 2],
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

`

## === FILE: D:\Doan_5\backend\src\index.js ===
`javascript
// Entry point cho Render - chi chuyen huong sang server.js
require('./server');

`

## === FILE: D:\Doan_5\backend\src\seed.js ===
`javascript
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

`


# 3. BACKEND - Middlewares

## === FILE: D:\Doan_5\backend\src\middlewares\auth.middleware.js ===
`javascript
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Khong tim thay Token xac thuc' });

    try {
        // Support both "Bearer <token>" and plain "<token>" formats
        token = token.trim();
        const parts = token.split(' ');
        const tokenBody = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        const decoded = jwt.verify(
            tokenBody,
            process.env.JWT_SECRET || 'KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON'
        );
        req.userId = decoded.id;
        req.userRole = decoded.role_id;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token khong hop le hoac da het han: ' + error.message });
    }
};

module.exports = { verifyToken };

`


# 4. BACKEND - Controllers

## === FILE: D:\Doan_5\backend\src\controllers\auth.controller.js ===
`javascript
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getOne(`SELECT * FROM users WHERE email = $1`, [email]);

        if (!user) return res.status(404).json({ message: 'Tai khoan khong ton tai' });

        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ message: 'Sai mat khau' });

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET || 'KHOA_BIMAT_CUA_DU_AN_XUAT_NHAP_TON',
            { expiresIn: 86400 }
        );

        res.status(200).json({
            message: 'Dang nhap thanh cong',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id
            },
            accessToken: token
        });
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const rows = await db.getAll(`SELECT id, email, full_name, role_id FROM users ORDER BY id DESC`);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi Database: ' + err.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, full_name, role_id } = req.body;
        if (!email || !password || !full_name) return res.status(400).json({ message: 'Vui long nhap du thong tin!' });

        const hashed_password = bcrypt.hashSync(password, 10);
        await db.run(
            `INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)`,
            [email, hashed_password, full_name, role_id || 2]
        );
        res.status(201).json({ message: 'Tao tai khoan thanh cong!' });
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: 'Email nay da duoc su dung!' });
        }
        res.status(500).json({ message: 'Loi khi tao tai khoan' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role_id, password } = req.body;

        let query = `UPDATE users SET full_name = $1, role_id = $2`;
        let params = [full_name, role_id];

        if (password) {
            query += `, password_hash = $3`;
            params.push(bcrypt.hashSync(password, 10));
            params.push(id);
        } else {
            params.push(id);
        }

        query += ` WHERE id = $${params.length}`;
        await db.run(query, params);
        res.status(200).json({ message: 'Cap nhat thanh cong!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi cap nhat tai khoan' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.getOne(`SELECT role_id FROM users WHERE id = $1`, [id]);
        if (user && user.role_id === 1) {
            return res.status(400).json({ message: 'Tuyet doi khong duoc xoa tai khoan Admin goc!' });
        }
        await db.run(`DELETE FROM users WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da xoa tai khoan nhan vien!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi xoa tai khoan' });
    }
};

module.exports = { login, getAllUsers, createUser, updateUser, deleteUser };

`

## === FILE: D:\Doan_5\backend\src\controllers\customer.controller.js ===
`javascript
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

`

## === FILE: D:\Doan_5\backend\src\controllers\order.controller.js ===
`javascript
const db = require('../config/database');

const getNextOrderNo = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;

        await client.query(
            `SELECT 1 FROM sales_orders WHERE order_no LIKE $1 FOR UPDATE`,
            [pattern]
        );

        const soRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1`,
            [pattern]
        );
        const acRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [pattern]
        );

        let maxNum = 0;
        [soRes.rows[0]?.order_no, acRes.rows[0]?.code].forEach(code => {
            if (!code) return;
            const n = parseInt(String(code).split('-').pop(), 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        const order_no = `SO-${year}-${String(maxNum + 1).padStart(4, '0')}`;

        await client.query('COMMIT');
        res.status(200).json({ order_no });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi sinh ma don', error: err.message });
    } finally {
        client.release();
    }
};

const getAllOrders = async (req, res) => {
    try {
        const query = `
            SELECT
                o.id,
                o.order_no,
                o.customer_id,
                c.company_name as customer_name,
                o.order_date,
                o.expected_delivery_date,
                o.actual_delivery_date,
                o.created_by,
                o.status,
                o.delivery_step,
                o.note,
                o.created_at,
                o.updated_at,
                (
                    SELECT dr.warehouse_note FROM delivery_requests dr
                    WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1
                ) AS warehouse_note,
                (
                    SELECT dr.logistics_note FROM delivery_requests dr
                    WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1
                ) AS logistics_note,
                oi.id as item_id,
                oi.product_id,
                oi.quantity,
                oi.unit_price,
                p.name as product_name,
                p.sku as product_sku
            FROM sales_orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN sales_order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON p.id = oi.product_id
            ORDER BY o.created_at DESC, oi.id ASC
        `;
        const rows = await db.getAll(query);

        const ordersMap = new Map();
        rows.forEach((row) => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    order_no: row.order_no,
                    customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    order_date: row.order_date,
                    expected_delivery_date: row.expected_delivery_date,
                    actual_delivery_date: row.actual_delivery_date,
                    created_by: row.created_by,
                    status: row.status,
                    delivery_step: row.delivery_step,
                    note: row.note,
                    warehouse_note: row.warehouse_note,
                    logistics_note: row.logistics_note,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    items: [],
                });
            }
            if (row.item_id) {
                ordersMap.get(row.id).items.push({
                    id: row.item_id,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    product_sku: row.product_sku,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                });
            }
        });
        res.status(200).json(Array.from(ordersMap.values()));
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const getOrderItems = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await db.getAll(`SELECT * FROM sales_order_items WHERE order_id = $1`, [id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu' });
    }
};

const createOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { customer_id, order_date, expected_delivery_date, note, items } = req.body;
        if (!customer_id) return res.status(400).json({ message: 'Vui long chon khach hang!' });
        if (!order_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });

        await client.query('BEGIN');

        // Tìm số lớn nhất từ cả sales_orders và auto_codes (đề phòng seed cũ), lock để tránh race condition
        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;

        await client.query(
            `SELECT 1 FROM sales_orders WHERE order_no LIKE $1 FOR UPDATE`,
            [pattern]
        );

        const soRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1`,
            [pattern]
        );
        const acRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [pattern]
        );

        let maxNum = 0;
        [soRes.rows[0]?.order_no, acRes.rows[0]?.code].forEach(code => {
            if (!code) return;
            const n = parseInt(String(code).split('-').pop(), 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        const order_no = `SO-${year}-${String(maxNum + 1).padStart(4, '0')}`;

        // Insert đơn hàng
        const result = await client.query(
            `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [order_no, customer_id, order_date, expected_delivery_date, note]
        );
        const orderId = result.rows[0].id;

        // Insert các sản phẩm
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tao don hang thanh cong', id: orderId, order_no });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi Database: ' + err.message });
    } finally {
        client.release();
    }
};

const updateOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { customer_id, expected_delivery_date, note, items } = req.body;
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET customer_id = $1, expected_delivery_date = $2, note = $3, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
            [customer_id, expected_delivery_date, note, orderId]
        );
        await client.query(`DELETE FROM sales_order_items WHERE order_id = $1`, [orderId]);
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da cap nhat toan bo don hang!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cap nhat don' });
    } finally {
        client.release();
    }
};

const deleteOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const order = await client.query(`SELECT status FROM sales_orders WHERE id = $1`, [id]);
        if (!order.rows.length) return res.status(404).json({ message: 'Khong tim thay don hang' });
        const currentStatus = order.rows[0].status || 'pending';
        if (!['pending', 'returned', 'waiting_sales', 'return_to_sales'].includes(currentStatus)) {
            return res.status(400).json({ message: 'Khong the xoa don hang da duoc xu ly!' });
        }
        await client.query('BEGIN');
        // Xoa cac bang con theo dung thu tu (neu co FK)
        const outboundNotes = await client.query(
            `SELECT id FROM stock_outbound_notes WHERE order_id = $1`, [id]
        );
        for (const note of outboundNotes.rows) {
            await client.query(
                `DELETE FROM stock_outbound_note_items WHERE outbound_note_id = $1`, [note.id]
            );
        }
        await client.query(`DELETE FROM stock_outbound_notes WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM delivery_requests WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM shipping_orders WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_order_items WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_orders WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xoa don hang thanh cong' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete order error:', err.message);
        res.status(500).json({ message: 'Loi khi xoa: ' + err.message });
    } finally {
        client.release();
    }
};

const processLogistics = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, new_status, reason_type, detail_note } = req.body;
        let finalNote = '';
        if (new_status === 'returned') {
            finalNote = `[LOGISTICS TU CHOI]: ${reason_type} | Chi tiet: ${detail_note}`;
        } else {
            finalNote = detail_note || '';
        }
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET status = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [new_status, finalNote, order_id]
        );
        await client.query(
            `INSERT INTO delivery_requests (order_id, handled_by, received_at, status, logistics_note, warehouse_note)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)`,
            [order_id, req.user?.id || null, new_status, finalNote, null]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da cap nhat trang thai don hang!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi khi xu ly don hang' });
    } finally {
        client.release();
    }
};

const reportWarehouseIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { issue_note } = req.body;
        const order = await db.getOne(`SELECT note FROM sales_orders WHERE id = $1`, [id]);
        const currentNote = order ? (order.note || '') : '';
        const newNote = `[KHO BAO LOI]: ${issue_note} | Ghi chu cu: ${currentNote}`;
        await db.run(
            `UPDATE sales_orders SET status = 'logistics_review', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newNote, id]
        );
        res.status(200).json({ message: 'Da bao loi va gui ve cho Logistics!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi bao thieu hang' });
    }
};

const exportOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        await client.query('BEGIN');
        await client.query(
            `UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [orderId]
        );
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xuat kho, don hang chuyen sang trang thai Dang giao!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi chot don' });
    } finally {
        client.release();
    }
};

const confirmDelivery = async (req, res) => {
    try {
        const orderId = req.params.id;
        await db.run(
            `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [orderId]
        );
        res.status(200).json({ message: 'Xac nhan don hang da giao thanh cong!' });
    } catch (err) {
        res.status(500).json({ message: 'Loi xac nhan giao hang' });
    }
};

const returnInventory = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        await client.query('BEGIN');
        const outbound = await db.getOne(
            `SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
            [orderId]
        );
        if (outbound) {
            const items = await db.getAll(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [orderId]);
            for (const item of items) {
                await client.query(
                    `UPDATE inventory_balances SET on_hand_qty = COALESCE(on_hand_qty, 0) + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3`,
                    [item.quantity, item.product_id, outbound.warehouse_id]
                );
            }
            await client.query(
                `UPDATE sales_orders SET status = 'canceled', actual_delivery_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [orderId]
            );
        } else {
            await client.query(
                `UPDATE sales_orders SET status = 'returned', actual_delivery_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [orderId]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: outbound ? 'Da hoan tra ton kho!' : 'Da cap nhat trang thai hoan tra!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi hoan tra ton kho' });
    } finally {
        client.release();
    }
};

const processCustomerRejection = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { action, note } = req.body; // action: 'return_to_warehouse' | 'return_pending'
        await client.query('BEGIN');

        // Lấy thông tin outbound để biết kho nào
        const outbound = await client.query(
            `SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
            [orderId]
        );

        if (action === 'return_to_warehouse') {
            // Hoàn đơn lại vào kho đã xuất
            if (outbound.rows.length > 0) {
                const warehouseId = outbound.rows[0].warehouse_id;
                const items = await client.query(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [orderId]);
                for (const item of items.rows) {
                    await client.query(
                        `UPDATE inventory_balances SET on_hand_qty = COALESCE(on_hand_qty, 0) + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3`,
                        [item.quantity, item.product_id, warehouseId]
                    );
                }
            }
            await client.query(
                `UPDATE sales_orders SET status = 'canceled', actual_delivery_date = NULL, note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [note || 'Khach tu choi nhan don - da hoan tra kho', orderId]
            );
        } else {
            // Chuyển qua xu ly hoan
            await client.query(
                `UPDATE sales_orders SET status = 'return_pending', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [note || 'Khach tu choi nhan don - chuyen xu ly hoan', orderId]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: action === 'return_to_warehouse'
                ? 'Da hoan don lai vao kho!'
                : 'Da chuyen don sang xu ly hoan!'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xu ly yeu cau tra hang', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// PUT /orders/:id/return-to-sales
// Logistics gửi đơn khách không nhận về cho Sales xử lý
// ============================================================
const returnToSales = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { note } = req.body;

        await client.query('BEGIN');

        // Lấy return_request hiện tại
        const rrRes = await client.query(`SELECT id FROM return_requests WHERE order_id = $1`, [orderId]);
        if (rrRes.rows.length) {
            await client.query(`
                UPDATE return_requests SET status = 'return_to_sales',
                customer_reject_reason = 'khong_nhan_hang', complaint_source = 'during_delivery',
                logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE order_id = $2
            `, [note || null, orderId]);
        }

        // Chuyển đơn về return_to_sales (Sales tự quyết định)
        await client.query(`
            UPDATE sales_orders SET status = 'return_to_sales', note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
        `, [`[Logistics] Khach khong nhan hang: ${note || ''}`, orderId]);

        // Ghi log
        await client.query(`
            INSERT INTO delivery_requests (order_id, status, logistics_note)
            VALUES ($1, 'return_to_sales', $2)
        `, [orderId, note || 'Logistics gui don ve Sales']);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da gui don ve Sales xu ly!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi gui don ve Sales', error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllOrders, getNextOrderNo, getOrderItems, createOrder, updateOrder, deleteOrder,
    processLogistics, reportWarehouseIssue, exportOrder, confirmDelivery, returnInventory,
    processCustomerRejection, returnToSales
};

`

## === FILE: D:\Doan_5\backend\src\controllers\product.controller.js ===
`javascript
const db = require('../config/database');

const getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT
                p.*,
                COALESCE(p.min_stock, 50) as min_stock,
                COALESCE(SUM(ib.on_hand_qty), 0) as total_stock,
                CASE
                    WHEN COALESCE(SUM(ib.on_hand_qty), 0) = 0 THEN 'Het hang'
                    WHEN COALESCE(SUM(ib.on_hand_qty), 0) < COALESCE(p.min_stock, 50) THEN 'Sap het hang'
                    ELSE 'Con hang'
                END as stock_status,
                (
                    SELECT string_agg(w.name || ': ' || COALESCE(ib2.on_hand_qty, 0)::text, ' | ')
                    FROM warehouses w
                    LEFT JOIN inventory_balances ib2 ON w.id = ib2.warehouse_id AND ib2.product_id = p.id
                ) as stock_breakdown
            FROM products p
            LEFT JOIN inventory_balances ib ON p.id = ib.product_id
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const rows = await db.getAll(query);
        console.log(`[products GET] success, rows: ${rows.length}`);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[products GET] error:', err);
        console.error('[products GET] stack:', err.stack);
        res.status(500).json({ message: 'Loi Database', error: err.message });
    }
};

const createProduct = async (req, res) => {
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const client = await db.pool.connect();
        try {
            const { name, sale_price, unit, category, image_url, min_stock, warehouse_id, initial_stock } = req.body;

            if (!name || String(name).trim().length === 0) {
                client.release();
                return res.status(400).json({ message: 'Vui long nhap Ten san pham' });
            }
            if (!sale_price || isNaN(Number(sale_price)) || Number(sale_price) <= 0) {
                client.release();
                return res.status(400).json({ message: 'Vui long nhap Don gia hop le' });
            }

            await client.query('BEGIN');

            // Sinh SKU trong cùng transaction với FOR UPDATE lock để tránh trùng.
            // Lấy MAX từ cả auto_codes và products (đề phòng seed cũ chỉ insert products).
            const prefix = 'SP';
            const year = new Date().getFullYear();
            const pattern = `${prefix}-${year}-%`;

            await client.query(
                `SELECT 1 FROM auto_codes WHERE code LIKE $1 FOR UPDATE`,
                [pattern]
            );

            const acRes = await client.query(
                `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
                [pattern]
            );
            const pRes = await client.query(
                `SELECT sku FROM products WHERE sku LIKE $1 ORDER BY sku DESC LIMIT 1`,
                [pattern]
            );

            let maxNum = 0;
            [acRes.rows[0]?.code, pRes.rows[0]?.sku].forEach(code => {
                if (!code) return;
                const n = parseInt(String(code).split('-').pop(), 10);
                if (!isNaN(n) && n > maxNum) maxNum = n;
            });
            const sku = `${prefix}-${year}-${String(maxNum + 1).padStart(4, '0')}`;

            await client.query(
                `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
                [sku, prefix, year]
            );

            // Insert san pham
            const insertRes = await client.query(
                `INSERT INTO products (sku, name, sale_price, unit, category, image_url, min_stock)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [sku, String(name).trim(), Number(sale_price), unit || 'Cai', category || null, image_url || null, parseInt(min_stock, 10) || 50]
            );
            const productId = insertRes.rows[0].id;
            const stockQty = parseInt(initial_stock, 10) || 0;

            if (stockQty > 0) {
                if (warehouse_id === 'all') {
                    const whRes = await client.query(`SELECT id FROM warehouses`);
                    for (const row of whRes.rows) {
                        await client.query(
                            `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                             VALUES ($1, $2, $3)
                             ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                            [row.id, productId, stockQty]
                        );
                    }
                } else if (warehouse_id) {
                    await client.query(
                        `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                        [warehouse_id, productId, stockQty]
                    );
                }
            }

            await client.query('COMMIT');
            client.release();
            return res.status(201).json({
                message: stockQty > 0 ? 'Them SP va luu Ton kho thanh cong!' : 'Them san pham thanh cong!',
                sku
            });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch (_) {}
            client.release();

            // Unique violation → retry với số tiếp theo
            if (err.code === '23505' && attempt < MAX_RETRIES) {
                console.warn(`[createProduct] SKU trung, retry lan ${attempt + 1}`);
                await new Promise(r => setTimeout(r, 50 * attempt));
                continue;
            }

            console.error('[createProduct] error:', err.message);
            if (err.code === '23505') {
                return res.status(400).json({ message: 'Ma SKU da ton tai! Vui long thu lai.' });
            }
            return res.status(500).json({ message: 'Loi Database', error: err.message });
        }
    }
};

const updateProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { sku, name, sale_price, unit, category, image_url, min_stock, adjust_stock, target_warehouse } = req.body;

        await client.query(
            `UPDATE products SET sku = $1, name = $2, sale_price = $3, unit = $4, category = $5, image_url = $6, min_stock = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8`,
            [sku, name, sale_price, unit, category || null, image_url || null, parseInt(min_stock, 10) || 50, id]
        );

        if (adjust_stock !== undefined && adjust_stock !== '' && target_warehouse) {
            if (target_warehouse === 'all') {
                return res.status(400).json({ message: 'Muon sua ton kho thi phai chon dung 1 kho cu the!' });
            }
            const newQty = parseInt(adjust_stock, 10) || 0;
            await client.query(
                `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                [target_warehouse, id, newQty]
            );
            return res.status(200).json({ message: 'Da cap nhat SP va Dieu chinh ton kho thanh cong!' });
        }
        res.status(200).json({ message: 'Cap nhat thong tin san pham thanh cong!' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: `Ma SKU "${req.body.sku}" da ton tai!` });
        }
        res.status(500).json({ message: 'Loi Database khi cap nhat thong tin' });
    } finally {
        client.release();
    }
};

const deleteProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;

        let totalStock = 0;
        const stockResult = await client.query(
            `SELECT COALESCE(SUM(on_hand_qty), 0)::int AS total_stock FROM inventory_balances WHERE product_id = $1`,
            [id]
        );
        totalStock = Number(stockResult.rows[0]?.total_stock || 0);

        if (totalStock > 0) {
            client.release();
            return res.status(400).json({ message: 'Khong the xoa san pham vi van con ton kho!' });
        }

        await client.query('BEGIN');
        const skuRow = await client.query(`SELECT sku FROM products WHERE id = $1`, [id]);
        const sku = skuRow.rows[0]?.sku;
        await client.query(`DELETE FROM inventory_transactions WHERE product_id = $1`, [id]);
        await client.query(`DELETE FROM inventory_balances WHERE product_id = $1`, [id]);
        const result = await client.query(`DELETE FROM products WHERE id = $1`, [id]);
        if (sku) await client.query(`DELETE FROM auto_codes WHERE code = $1`, [sku]);
        await client.query('COMMIT');

        if (result.rowCount === 0) {
            client.release();
            return res.status(404).json({ message: 'Khong tim thay san pham can xoa' });
        }
        client.release();
        res.status(200).json({ message: 'Xoa san pham thanh cong' });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
        if (err.code === '23503') {
            return res.status(400).json({ message: 'San pham dang duoc su dung trong don hang hoac phieu, khong the xoa!' });
        }
        res.status(500).json({ message: 'Loi khi xoa san pham', error: err.message });
    }
};

const getNextSku = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const prefix = 'SP';
        const year = new Date().getFullYear();

        // Lấy MAX cả từ auto_codes LẪN products (đề phòng seed cũ không insert auto_codes)
        await client.query('BEGIN');
        const acRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [`${prefix}-${year}-%`]
        );
        const pRes = await client.query(
            `SELECT sku FROM products WHERE sku LIKE $1 ORDER BY sku DESC LIMIT 1`,
            [`${prefix}-${year}-%`]
        );

        let maxNum = 0;
        [acRes.rows[0]?.code, pRes.rows[0]?.sku].forEach(code => {
            if (!code) return;
            const n = parseInt(String(code).split('-').pop(), 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        });
        const sku = `${prefix}-${year}-${String(maxNum + 1).padStart(4, '0')}`;

        await client.query('COMMIT');

        // Không INSERT vào auto_codes ở đây — chỉ preview.
        // Việc INSERT sẽ do createProduct thực hiện trong transaction riêng.
        res.status(200).json({ sku });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ message: 'Loi sinh SKU', error: err.message });
    } finally {
        client.release();
    }
};

module.exports = { getAllProducts, getNextSku, createProduct, updateProduct, deleteProduct };

`

## === FILE: D:\Doan_5\backend\src\controllers\receipt.controller.js ===
`javascript
const db = require('../config/database');

const getAllReceipts = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT p.*, w.name as warehouse_name, u.full_name as creator_name
            FROM production_receipts p
            LEFT JOIN warehouses w ON p.warehouse_id = w.id
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.id DESC
        `);

        if (!rows.length) return res.status(200).json([]);

        const items = await db.getAll(`
            SELECT pri.receipt_id, pri.product_id, pri.quantity, p.name as product_name
            FROM production_receipt_items pri
            LEFT JOIN products p ON p.id = pri.product_id
            WHERE pri.receipt_id = ANY($1::int[])
            ORDER BY pri.id ASC
        `, [rows.map(r => r.id)]);

        const itemsByReceipt = items.reduce((acc, item) => {
            if (!acc[item.receipt_id]) acc[item.receipt_id] = [];
            acc[item.receipt_id].push(item);
            return acc;
        }, {});

        const result = rows.map(row => ({
            ...row,
            items: itemsByReceipt[row.id] || []
        }));
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const { generateCode } = require('../utils/autoCode');

const createRequest = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { warehouse_id, receipt_date, note, items } = req.body;
        const created_by = req.user?.id || 1;
        if (!warehouse_id) return res.status(400).json({ message: 'Vui long chon kho nhap!' });
        if (!receipt_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });
        const cleanWarehouseId = Number(warehouse_id);
        if (isNaN(cleanWarehouseId)) return res.status(400).json({ message: 'Kho khong hop le!' });

        await client.query('BEGIN');
        const receipt_no = await generateCode('receipt', client);
        await client.query(
            `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [receipt_no, cleanWarehouseId, receipt_date, created_by, note || '']
        );
        const receipt = await db.getOne(`SELECT id FROM production_receipts WHERE receipt_no = $1 ORDER BY id DESC LIMIT 1`, [receipt_no], client);
        for (const item of items) {
            if (!item.product_id) continue;
            await client.query(
                `INSERT INTO production_receipt_items (receipt_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [receipt.id, Number(item.product_id), Math.max(1, Number(item.quantity) || 1)]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Da gui yeu cau cho Nha may!', receipt_no });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create receipt error:', err.message, 'Code:', err.code);
        if (err.code === '23505') return res.status(400).json({ message: 'Ma phieu da ton tai, vui long dung ma khac!' });
        if (err.code === '23503') return res.status(400).json({ message: 'Kho hoac san pham khong ton tai trong he thong!' });
        res.status(400).json({ message: 'Loi tao phieu: ' + err.message });
    } finally {
        client.release();
    }
};

const factoryRespond = async (req, res) => {
    try {
        const receiptId = req.params.id;
        const { action, expected_date, reason } = req.body;

        if (!receiptId) return res.status(400).json({ message: 'Thieu ma phieu can xu ly.' });
        if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Hanh dong khong hop le.' });
        if (action === 'accept' && !expected_date) return res.status(400).json({ message: 'Vui long chon ngay giao du kien truoc khi duyet.' });

        const receipt = await db.getOne(`SELECT status, note FROM production_receipts WHERE id = $1`, [receiptId]);
        if (!receipt) return res.status(404).json({ message: 'Khong tim thay phieu can xu ly.' });
        if (receipt.status !== 'pending') return res.status(400).json({ message: `Phieu dang o trang thai ${receipt.status}, khong the duyet.` });

        const newStatus = action === 'accept' ? 'processing' : 'rejected';
        const finalNote = `[NM Phan hoi]: ${reason || 'Khong co ly do'} | Cu: ${receipt.note || ''}`;
        const respondentName = req.user?.full_name || req.user?.name || null;

        await db.run(
            `UPDATE production_receipts SET status = $1, receipt_date = $2, note = $3, responded_by = $4, responded_reason = $5, expected_delivery_date = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7`,
            [newStatus, expected_date || null, finalNote, respondentName, reason || null, expected_date || null, receiptId]
        );

        res.status(200).json({
            message: action === 'accept' ? 'Da duyet phieu va hen ngay giao hang!' : 'Da tu choi yeu cau nhap kho!'
        });
    } catch (err) {
        res.status(500).json({ message: 'Loi cap nhat phieu duyet.', error: err.message });
    }
};

const confirmReceipt = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const receiptId = req.params.id;
        const receipt = await db.getOne(`SELECT status, warehouse_id FROM production_receipts WHERE id = $1`, [receiptId]);
        if (!receipt || receipt.status !== 'processing') {
            return res.status(400).json({ message: 'Nha may chua giao hoac phieu da chot!' });
        }
        const items = await db.getAll(`SELECT product_id, quantity FROM production_receipt_items WHERE receipt_id = $1`, [receiptId]);

        await client.query('BEGIN');
        for (const item of items) {
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (warehouse_id, product_id)
                DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP`,
                [receipt.warehouse_id, item.product_id, item.quantity]
            );
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                 VALUES ($1, $2, 'IN', $3, 'production_receipt', $4)`,
                [receipt.warehouse_id, item.product_id, item.quantity, receiptId]
            );
        }
        await client.query(`UPDATE production_receipts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [receiptId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da nhan hang va cong ton kho!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cong kho' });
    } finally {
        client.release();
    }
};

module.exports = { getAllReceipts, createRequest, factoryRespond, confirmReceipt };

`

## === FILE: D:\Doan_5\backend\src\controllers\outbound.controller.js ===
`javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const getAllOutbounds = async (req, res) => {
    try {
        const query = `
            SELECT
                o.id, o.outbound_no, o.order_id, o.warehouse_id, o.export_date,
                o.created_by, o.status, o.note, o.created_at, o.updated_at,
                s.order_no, s.order_date, s.expected_delivery_date, s.actual_delivery_date,
                s.status AS order_status, s.note AS order_note, s.created_at AS order_created_at,
                c.company_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
                w.name AS warehouse_name, w.warehouse_code AS warehouse_code,
                u.full_name AS creator_name,
                COALESCE(SUM(soi.quantity * COALESCE(soi.unit_price, 0)), 0) AS total_amount,
                (
                    SELECT json_agg(json_build_object(
                        'id', soi2.id, 'product_id', soi2.product_id,
                        'product_name', p2.name, 'product_sku', p2.sku,
                        'quantity', soi2.quantity, 'unit_price', COALESCE(soi2.unit_price, 0)
                    ))
                    FROM sales_order_items soi2
                    JOIN products p2 ON p2.id = soi2.product_id
                    WHERE soi2.order_id = s.id
                ) AS items
            FROM stock_outbound_notes o
            LEFT JOIN warehouses w ON o.warehouse_id = w.id
            LEFT JOIN users u ON o.created_by = u.id
            LEFT JOIN sales_orders s ON o.order_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sales_order_items soi ON soi.order_id = s.id
            GROUP BY o.id, s.id, c.id, w.id, u.id
            ORDER BY o.id DESC
        `;
        const rows = await db.getAll(query);
        const parsedRows = rows.map(row => ({
            ...row,
            items: Array.isArray(row.items) ? row.items.filter(i => i && i.id != null) : [],
        }));
        res.status(200).json(parsedRows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach', error: err.message });
    }
};

const getPendingOutboundRequests = async (req, res) => {
    try {
        const query = `
            SELECT
                s.id, s.order_no, s.order_date, s.expected_delivery_date,
                CASE WHEN s.status IN ('canceled', 'returned') THEN NULL ELSE s.actual_delivery_date END AS actual_delivery_date,
                s.status AS order_status, s.note AS order_note, s.created_at, s.updated_at,
                c.company_name AS customer_name, c.phone AS customer_phone, c.address AS customer_address,
                COALESCE(SUM(soi.quantity * COALESCE(soi.unit_price, p.sale_price, 0)), 0) AS total_amount,
                (
                    SELECT json_agg(json_build_object(
                        'id', soi2.id, 'product_id', soi2.product_id,
                        'product_name', p2.name, 'product_sku', p2.sku,
                        'quantity', soi2.quantity, 'unit_price', COALESCE(soi2.unit_price, p2.sale_price, 0)
                    ))
                    FROM sales_order_items soi2
                    JOIN products p2 ON p2.id = soi2.product_id
                    WHERE soi2.order_id = s.id
                ) AS items,
                (
                    SELECT d.status FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS delivery_status,
                (
                    SELECT d.logistics_note FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS delivery_note,
                (
                    SELECT d.warehouse_note FROM delivery_requests d
                    WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
                ) AS warehouse_note,
                (
                    SELECT son.warehouse_id FROM stock_outbound_notes son
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS warehouse_id,
                (
                    SELECT w.name FROM stock_outbound_notes son
                    JOIN warehouses w ON w.id = son.warehouse_id
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS warehouse_name,
                (
                    SELECT son.export_date FROM stock_outbound_notes son
                    WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1
                ) AS export_date
            FROM sales_orders s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sales_order_items soi ON s.id = soi.order_id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE s.status IN ('warehouse_processing', 'shipping', 'completed', 'returned', 'canceled', 'waiting_sales', 'customer_rejected', 'return_pending')
                OR EXISTS (
                    SELECT 1 FROM delivery_requests d
                    WHERE d.order_id = s.id
                        AND COALESCE(d.status, '') IN ('warehouse_processing', 'shipping', 'completed', 'waiting_sales', 'customer_rejected', 'return_pending')
                )
            GROUP BY s.id, c.id
            ORDER BY s.updated_at DESC, s.id DESC
        `;
        const rows = await db.getAll(query);
        const parsedRows = rows.map(row => ({
            ...row,
            items: Array.isArray(row.items) ? row.items.filter(i => i && i.id != null) : [],
        }));
        res.status(200).json(parsedRows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach don cho xuat', error: err.message });
    }
};

const createOutboundFromPending = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, warehouse_id, export_date, note } = req.body;
        const created_by = req.user?.id || 1;
        if (!order_id || !warehouse_id) return res.status(400).json({ message: 'Thieu thong tin don hang hoac kho xuat!' });

        const items = await db.getAll(
            `SELECT soi.product_id, soi.quantity, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price
             FROM sales_order_items soi LEFT JOIN products p ON soi.product_id = p.id WHERE soi.order_id = $1`,
            [order_id]
        );
        if (!items.length) return res.status(400).json({ message: 'Khong tim thay chi tiet san pham cua don hang nay!' });

        for (const item of items) {
            const stock = await db.getOne(
                `SELECT on_hand_qty FROM inventory_balances WHERE product_id = $1 AND warehouse_id = $2`,
                [item.product_id, warehouse_id]
            );
            const qty = stock ? stock.on_hand_qty : 0;
            if (qty < item.quantity) {
                return res.status(400).json({ message: `San pham ID ${item.product_id} chi con ${qty}, khong du de xuat ${item.quantity}!` });
            }
        }

        await client.query('BEGIN');
        const outbound_no = await generateCode('outbound');
        const result = await client.query(
            `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING id`,
            [outbound_no, order_id, warehouse_id, export_date || new Date().toISOString().split('T')[0], created_by, note || null]
        );
        const outboundId = result.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [outboundId, item.product_id, item.quantity]
            );
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                VALUES ($1, $2, 0)
                ON CONFLICT (warehouse_id, product_id) DO UPDATE
                SET on_hand_qty = inventory_balances.on_hand_qty - $3, updated_at = CURRENT_TIMESTAMP`,
                [warehouse_id, item.product_id, item.quantity]
            );
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                 VALUES ($1, $2, 'OUT', $3, 'stock_outbound', $4)`,
                [warehouse_id, item.product_id, item.quantity, outboundId]
            );
        }
        await client.query(`UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Xuat kho thanh cong! Da tru ton va cap nhat don hang.', outbound_id: outboundId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xuat kho', error: err.message });
    } finally {
        client.release();
    }
};

const respondOutbound = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id } = req.params;
        const { action, reason, warehouse_action } = req.body;
        const userId = req.user?.id || null;

        if (action === 'reject') {
            // Kho từ chối → gửi về Sales với hướng xử lý
            await client.query('BEGIN');
            await client.query(
                `UPDATE sales_orders SET status = 'waiting_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [order_id]
            );
            await client.query(
                `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note, warehouse_note)
                 VALUES ($1, $2, 'waiting_sales', $3, $4)`,
                [order_id, userId, warehouse_action || null, reason || null]
            );
            await client.query('COMMIT');
            res.status(200).json({ message: 'Da tu choi xuat hang. Don cho Sales xu ly.' });
        } else {
            // Chấp nhận → giữ nguyên
            res.status(200).json({ message: 'Da tiep nhan don hang.' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cap nhat phan hoi' });
    } finally {
        client.release();
    }
};

const createOutbound = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, warehouse_id, export_date, note } = req.body;
        const created_by = req.user?.id || 1;
        if (!order_id || !warehouse_id) return res.status(400).json({ message: 'Thieu thong tin don hang hoac kho xuat!' });

        const items = await db.getAll(
            `SELECT soi.product_id, soi.quantity, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price, p.name, p.sku
             FROM sales_order_items soi LEFT JOIN products p ON soi.product_id = p.id WHERE soi.order_id = $1`,
            [order_id]
        );
        if (!items.length) return res.status(400).json({ message: 'Khong tim thay chi tiet san pham!' });

        for (const item of items) {
            const stock = await db.getOne(
                `SELECT on_hand_qty FROM inventory_balances WHERE product_id = $1 AND warehouse_id = $2`,
                [item.product_id, warehouse_id]
            );
            if ((stock ? stock.on_hand_qty : 0) < item.quantity) {
                return res.status(400).json({ message: `San pham [${item.name || item.sku}] chi con ${stock?.on_hand_qty || 0}, khong du!` });
            }
        }

        await client.query('BEGIN');
        const outbound_no = await generateCode('outbound');
        const result = await client.query(
            `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING id`,
            [outbound_no, order_id, warehouse_id, export_date, created_by, note]
        );
        const outboundId = result.rows[0].id;

        for (const item of items) {
            await client.query(`INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [outboundId, item.product_id, item.quantity]);

            // Neu chua co record ton kho, tao moi; neu co thi tru ton
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                VALUES ($1, $2, 0)
                ON CONFLICT (warehouse_id, product_id) DO UPDATE
                SET on_hand_qty = inventory_balances.on_hand_qty - $3, updated_at = CURRENT_TIMESTAMP`,
                [warehouse_id, item.product_id, item.quantity]);

            await client.query(`INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id) VALUES ($1, $2, 'OUT', $3, 'stock_outbound', $4)`,
                [warehouse_id, item.product_id, item.quantity, outboundId]);
        }
        await client.query(`UPDATE sales_orders SET status = 'shipping', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Xuat kho thanh cong! Da tru ton va cap nhat don hang.', outbound_id: outboundId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Loi tao phieu xuat!', error: err.message });
    } finally {
        client.release();
    }
};

const createOutboundFallback = async (_req, res) => {
    res.status(501).json({ message: 'Chua ho tro' });
};

const getWarehouseStock = async (req, res) => {
    try {
        const { warehouse_id } = req.params;
        const rows = await db.getAll(`
            SELECT ib.product_id, ib.on_hand_qty, p.name AS product_name, p.sku
            FROM inventory_balances ib
            JOIN products p ON p.id = ib.product_id
            WHERE ib.warehouse_id = $1 AND ib.on_hand_qty > 0
            ORDER BY p.name ASC
        `, [warehouse_id]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay ton kho', error: err.message });
    }
};

module.exports = {
    getAllOutbounds, getPendingOutboundRequests, createOutbound,
    createOutboundFromPending, respondOutbound, createOutboundFallback, getWarehouseStock
};

`

## === FILE: D:\Doan_5\backend\src\controllers\return.controller.js ===
`javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// ============================================================
// Hàm nội bộ: cộng tồn kho
// ============================================================
async function addInventory(client, warehouseId, productId, qty, refType, refId, note) {
    await client.query(`
        INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
        VALUES ($1, $2, $3)
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
    `, [warehouseId, productId, qty]);

    await client.query(`
        INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
        VALUES ($1, $2, 'IN', $3, $4, $5)
    `, [warehouseId, productId, qty, refType, refId]);
}

// ============================================================
// GET — Danh sách return requests + phiếu bù (ReturnsPage)
// ============================================================
const getAllReturns = async (req, res) => {
    try {
        const { action } = req.query;
        let whereClause = `WHERE (rr.status IN ('return_pending', 'return_completed', 'pending', 'logistics_handled', 'return_to_sales'))`;

        if (action) {
            whereClause += ` AND rr.logistics_action = '${action}'`;
        }

        const result = await db.getAll(`
            SELECT
                rr.id, rr.order_id, rr.customer_reject_reason,
                rr.logistics_action, rr.logistics_note, rr.handling_result, rr.status,
                rr.complaint_source, rr.compensation_no, rr.factory_acknowledged,
                rr.created_at, rr.updated_at,
                so.order_no, so.expected_delivery_date, so.actual_delivery_date,
                so.status AS order_status,
                c.company_name AS customer_name, c.phone AS customer_phone,
                u.full_name AS logistics_handler,
                cr.id AS compensation_id, cr.compensation_no AS cr_compensation_no,
                cr.status AS compensation_status, cr.defect_type,
                cr.responded_at AS compensation_responded_at
            FROM return_requests rr
            JOIN sales_orders so ON rr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            LEFT JOIN users u ON u.id = (
                SELECT handled_by FROM delivery_requests WHERE order_id = so.id ORDER BY id DESC LIMIT 1
            )
            LEFT JOIN compensation_requests cr ON cr.return_id = rr.id
            ${whereClause}
            ORDER BY rr.created_at DESC
        `);
        res.status(200).json(result);
    } catch (err) {
        console.error('[getAllReturns] ERROR:', err.message);
        res.status(200).json([]); // fallback: trả rỗng thay vì crash
    }
};

// ============================================================
// GET — Chi tiết 1 return request
// ============================================================
const getReturnByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const rr = await db.getOne(`
            SELECT
                rr.*,
                so.order_no,
                c.company_name AS customer_name,
                (SELECT json_agg(json_build_object(
                    'product_id', soi.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'quantity', soi.quantity,
                    'unit_price', COALESCE(soi.unit_price, p.sale_price, 0)
                )) FROM sales_order_items soi
                JOIN products p ON p.id = soi.product_id
                WHERE soi.order_id = so.id) AS order_items
            FROM return_requests rr
            JOIN sales_orders so ON rr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            WHERE rr.order_id = $1
        `, [order_id]);
        if (!rr) return res.status(404).json({ message: 'Khong tim thay yeu cau tra hang' });
        res.status(200).json(rr);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay chi tiet', error: err.message });
    }
};

// ============================================================
// GET — Danh sách phiếu bù (compensation_requests)
// ============================================================
const getCompensations = async (req, res) => {
    try {
        const { status } = req.query;
        let whereClause = '';
        if (status) whereClause = `WHERE cr.status = '${status}'`;

        const result = await db.getAll(`
            SELECT
                cr.id, cr.compensation_no, cr.return_id, cr.order_id,
                cr.defect_type, cr.total_items, cr.status,
                cr.created_at, cr.updated_at, cr.responded_at, cr.resolution_note,
                so.order_no, c.company_name AS customer_name,
                w.name AS warehouse_name, w.warehouse_code,
                (SELECT json_agg(json_build_object(
                    'product_id', ci.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'defective_qty', ci.defective_qty,
                    'unit_price', ci.unit_price
                )) FROM compensation_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.compensation_id = cr.id) AS items
            FROM compensation_requests cr
            JOIN return_requests rr ON rr.id = cr.return_id
            JOIN sales_orders so ON cr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            LEFT JOIN warehouses w ON w.id = cr.warehouse_id
            ${whereClause}
            ORDER BY cr.created_at DESC
        `);
        res.status(200).json(result);
    } catch (err) {
        console.error('[getCompensations] ERROR:', err.message);
        res.status(200).json([]); // fallback: trả rỗng thay vì crash
    }
};

// ============================================================
// XỬ LÝ HOÀN HÀNG — 1 bước gộp (init + complete)
// ============================================================
const processReturn = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, logistics_action } = req.body;
        const userId = req.user?.id || null;

        if (!order_id) {
            return res.status(400).json({ message: 'Thieu order_id' });
        }

        await client.query('BEGIN');

        // --- Lấy thông tin đơn hàng ---
        const orderRes = await client.query(`
            SELECT so.*, c.company_name AS customer_name,
                (SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = so.id ORDER BY id DESC LIMIT 1) AS original_warehouse_id
            FROM sales_orders so
            JOIN customers c ON so.customer_id = c.id
            WHERE so.id = $1
        `, [order_id]);
        if (!orderRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay don hang' });
        }
        const order = orderRes.rows[0];
        const originalWarehouseId = order.original_warehouse_id;

        // --- Lấy return_request ---
        const rrRes = await client.query(`SELECT * FROM return_requests WHERE order_id = $1`, [order_id]);
        let rr = rrRes.rows[0];
        if (!rr) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay yeu cau tra hang cho don nay' });
        }
        const finalAction = logistics_action || rr?.logistics_action || 'khong_nhan_hang';

        // --- Lấy items trong đơn hàng ---
        const itemsRes = await client.query(`
            SELECT soi.product_id, soi.quantity, p.name, p.sku, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price
            FROM sales_order_items soi
            JOIN products p ON p.id = soi.product_id
            WHERE soi.order_id = $1
        `, [order_id]);
        const items = itemsRes.rows;

        // --- Sinh mã phiếu nhập ---
        const receiptNo = await generateCode('PNH', client);

        const result = {
            order_id, order_no: order.order_no,
            logistics_action: finalAction,
            items_restocked: 0, items_to_defective: 0,
            claim_no: null, receipt_no: receiptNo,
            destination: null,
        };

        // ======================================================
        // ① KHÔNG NHẬN HÀNG → cộng tồn kho gốc + hủy đơn
        // ======================================================
        if (finalAction === 'khong_nhan_hang') {
            await client.query(`
                INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, status, note, responded_by, responded_reason, defect_type)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'completed', $3, $4, $5, 'khong_nhan_hang')
            `, [receiptNo, originalWarehouseId, `Khong nhan hang — Don ${order.order_no}`, userId, 'khong_nhan_hang']);

            const ridRes = await client.query(`SELECT lastval() AS id`);
            const receiptId = ridRes.rows[0].id;

            for (const item of items) {
                await addInventory(client, originalWarehouseId, item.product_id, item.quantity, 'return_receipt', receiptId, `Khong nhan hang - Don ${order.order_no}`);
            }

            // Đánh dấu đơn = canceled
            await client.query(`
                UPDATE sales_orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);
            await client.query(`
                UPDATE return_requests SET status = 'return_completed', handling_result = 'khong_nhan_hang', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [rr.id]);

            result.items_restocked = items.length;
            result.destination = 'kho_goc';

        // ======================================================
        // ② LỖI DO NHÀ MÁY → kho lỗi + tạo phiếu bù nhà máy
        // ======================================================
        } else if (finalAction === 'loi_nha_may') {
            // Tao phieu bù nha may (chua cong hang vao kho — doi factory/admin duyet moi cong)
            const compensationNo = await generateCode('PBH', client);
            await client.query(`
                INSERT INTO compensation_requests (compensation_no, return_id, order_id, warehouse_id, defect_type, total_items, status)
                VALUES ($1, $2, $3, $4, 'loi_nha_may', $5, 'pending')
            `, [compensationNo, rr.id, order_id, originalWarehouseId, items.length]);

            const compRes = await client.query(`SELECT lastval() AS id`);
            const compId = compRes.rows[0].id;

            for (const item of items) {
                await client.query(`
                    INSERT INTO compensation_items (compensation_id, product_id, defective_qty, unit_price)
                    VALUES ($1, $2, $3, $4)
                `, [compId, item.product_id, item.quantity, item.unit_price]);
            }

            await client.query(`
                UPDATE return_requests SET status = 'return_completed', handling_result = 'loi_nha_may',
                compensation_no = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
            `, [compensationNo, rr.id]);

            await client.query(`
                UPDATE sales_orders SET status = 'return_completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);

            result.items_to_defective = 0;
            result.claim_no = compensationNo;
            result.destination = 'doi_duyet';

            // Gửi notification cho Nhà máy
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ('Factory', $1, $2, 'error', 'compensation', $3)
            `, [
                `Phieu bu hang — Don ${order.order_no}`,
                `Phat hien loi do nha may tren don ${order.order_no} (${order.customer_name}). Kho loi: ${items.length} loai san pham. Vui long xac nhan va bu hang.`,
                compId,
            ]);

        // ======================================================
        // ③ LỖI VẬN CHUYỂN → kho lỗi + đơn quay về Sales tạo đơn bù
        // ======================================================
        } else if (finalAction === 'loi_van_tai') {
            // Lấy kho lỗi
            const defectWhRes = await client.query(`SELECT id FROM warehouses WHERE warehouse_code = 'KHO-LOI' LIMIT 1`);
            const defectWarehouseId = defectWhRes.rows[0]?.id || originalWarehouseId;

            await client.query(`
                INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, status, note, responded_by, responded_reason, defect_type)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'completed', $3, $4, $5, 'loi_van_tai')
            `, [receiptNo, defectWarehouseId, `Hang loi van tai — Don ${order.order_no}`, userId, 'loi_van_tai']);

            const ridRes = await client.query(`SELECT lastval() AS id`);
            const receiptId = ridRes.rows[0].id;

            // Đưa tất cả hàng vào kho lỗi
            for (const item of items) {
                await addInventory(client, defectWarehouseId, item.product_id, item.quantity, 'return_receipt', receiptId, `Hang loi van tai - Don ${order.order_no}`);
            }

            // Đánh dấu return_request: gửi về Sales quyết định
            await client.query(`
                UPDATE return_requests
                SET status = 'return_to_sales', handling_result = 'loi_van_tai', logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [`Hang loi van tai. Kho loi: ${items.length} loai san pham. Vui long tao don moi bu hang cho khach.`, rr.id]);

            // Đơn quay về Sales — chưa cancel để Sales còn reference
            await client.query(`
                UPDATE sales_orders SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [order_id]);

            // Ghi log giao dịch
            await client.query(`
                INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
                VALUES ($1, $2, 'return_to_sales', $3)
            `, [order_id, userId, `Loi van tai. Hang vao kho loi. Don tra ve Sales de tao don bu hang.`]);

            // Gửi notification cho Sales: cần tạo đơn bù hàng
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ('Sales', $1, $2, 'warning', 'sales_order', $3)
            `, [
                `Yeu cau bu hang — Don ${order.order_no}`,
                `Don hang ${order.order_no} (${order.customer_name}) bi loi van chuyen. Hang da dua vao kho loi. Vui long TAO DON HANG MOI voi noi dung "Bu hang cho khach" de gui lai cho khach.`,
                order_id,
            ]);

            result.items_to_defective = items.length;
            result.destination = 'kho_loi';
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xu ly hoan hang thanh cong!', ...result });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[processReturn] ERROR:', err);
        res.status(500).json({ message: 'Loi xu ly tra hang', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// PUT — Phê duyệt / từ chối phiếu bù (Admin/Kho/Nhà máy)
// ============================================================
const processCompensation = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { compensation_id, action, resolution_note } = req.body;
        // action: 'approve' | 'reject'

        if (!compensation_id) {
            return res.status(400).json({ message: 'Thieu compensation_id' });
        }

        await client.query('BEGIN');

        const compRes = await client.query(`SELECT * FROM compensation_requests WHERE id = $1`, [compensation_id]);
        if (!compRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay phieu bu' });
        }
        const comp = compRes.rows[0];

        // Tìm warehouse gốc đã xuất hàng (từ stock_outbound_notes)
        const outboundRes = await client.query(`
            SELECT warehouse_id FROM stock_outbound_notes
            WHERE order_id = $1 ORDER BY id ASC LIMIT 1
        `, [comp.order_id]);
        const warehouseId = outboundRes.rows[0]?.warehouse_id || comp.warehouse_id;
        if (!warehouseId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Khong xac dinh duoc kho goc da xuat hang!' });
        }

        // Lấy items trong phiếu bù
        const itemsRes = await client.query(`
            SELECT product_id, defective_qty FROM compensation_items WHERE compensation_id = $1
        `, [compensation_id]);

        // Tạo phiếu nhập kho (bù hàng) — trạng thái completed luôn vì nhà máy đã confirm
        const receipt_no = await generateCode('receipt');
        await client.query(`
            INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, note, status, created_at, updated_at)
            VALUES ($1, $2, CURRENT_DATE, $3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [receipt_no, warehouseId, `Bu hang tu phieu bu ${comp.compensation_no} — don ${comp.order_id}`]);

        const receiptDb = await client.query(`SELECT id FROM production_receipts WHERE receipt_no = $1`, [receipt_no]);
        const receiptId = receiptDb.rows[0].id;

        // Ghi nhận từng sản phẩm vào kho gốc
        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO production_receipt_items (receipt_id, product_id, quantity)
                VALUES ($1, $2, $3)
            `, [receiptId, item.product_id, item.defective_qty]);

            // Cập nhật tồn kho
            await client.query(`
                INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (warehouse_id, product_id)
                DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
            `, [warehouseId, item.product_id, item.defective_qty]);

            // Ghi log giao dịch
            await client.query(`
                INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                VALUES ($1, $2, 'IN', $3, 'compensation_receipt', $4)
            `, [warehouseId, item.product_id, item.defective_qty, receiptId]);
        }

        await client.query(`
            UPDATE compensation_requests
            SET status = 'approved', resolution_note = $1, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [resolution_note || `Da dong y bu hang. Phieu nhap kho: ${receipt_no}`, compensation_id]);

        await client.query(`
            UPDATE return_requests
            SET factory_acknowledged = TRUE, factory_responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [comp.return_id]);

        const orderRes = await client.query(`SELECT order_no FROM sales_orders WHERE id = $1`, [comp.order_id]);
        const orderNo = orderRes.rows[0]?.order_no || '';

        // Gửi thông báo cho 3 vai trò: Sales + Logistics + Kho (Lỗi nhà máy)
        const notificationTargets = ['Sales', 'Logistics', 'Warehouse'];
        for (const role of notificationTargets) {
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ($1, $2, $3, 'success', 'compensation', $4)
            `, [
                role,
                `Da bu hang (Loi nha may) — ${orderNo}`,
                `Phieu bu ${comp.compensation_no} da duoc xac nhan boi Nha may. Hang da duoc bu vao kho goc. Phieu nhap: ${receipt_no}. Don hang: ${orderNo}.`,
                compensation_id,
            ]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Da dong y bu hang!', status: 'approved' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi xu ly phieu bu', error: err.message });
    } finally {
        client.release();
    }
};

// ============================================================
// Legacy — backward compat
// ============================================================
const processReturnInit = async (req, res) => {
    res.status(400).json({ message: 'Dung /api/returns/process (1 buoc) thay vi /init + /complete' });
};

const processReturnComplete = async (req, res) => {
    const { order_id, logistics_action, logistics_note } = req.body;
    return processReturn({ body: { order_id, logistics_action, logistics_note }, user: req.user, userId: req.user?.id });
};

// ============================================================
// GET — Danh sách thông báo
// ============================================================
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role?.name || req.user?.role;

        const result = await db.getAll(`
            SELECT n.*
            FROM notifications n
            WHERE (n.recipient_role = $1 OR n.recipient_user_id = $2)
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [role, userId]);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay thong bao', error: err.message });
    }
};

// ============================================================
// PUT — Đánh dấu đã đọc
// ============================================================
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.run(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Da danh dau da doc' });
    } catch (err) {
        res.status(500).json({ message: 'Loi cap nhat', error: err.message });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role?.name || req.user?.role;
        await db.run(`
            UPDATE notifications SET is_read = true
            WHERE (recipient_role = $1 OR recipient_user_id = $2) AND is_read = false
        `, [role, userId]);
        res.status(200).json({ message: 'Da danh dau tat ca da doc' });
    } catch (err) {
        res.status(500).json({ message: 'Loi', error: err.message });
    }
};

module.exports = {
    getAllReturns,
    getReturnByOrder,
    getCompensations,
    processReturn,
    processReturnInit,
    processReturnComplete,
    processCompensation,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};

`

## === FILE: D:\Doan_5\backend\src\controllers\logistics.controller.js ===
`javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const CARRIERS = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
  { code: 'GR',  name: 'Giao Hàng Tiết Kiệm (GR)' },
  { code: 'GHT', name: 'Giao Hàng Tiêu Chuẩn (GHT)' },
];

// 2 lý do lỗi sau khi giao (Logistics chọn khi khiếu nại sau giao)
const LOGISTICS_COMPLAINT_ACTIONS = [
  { value: 'loi_nha_may', label: 'Lỗi do nhà máy' },
  { value: 'loi_van_tai', label: 'Lỗi do vận chuyển' },
];

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

const dispatchOrder = async (req, res) => {
  const client = await db.pool.connect();
  let retries = 0;
  const MAX_RETRIES = 3;

  while (retries < MAX_RETRIES) {
    try {
      const { order_id, carrier_code, shipping_fee } = req.body;
      const userId = req.user?.id || null;

      if (!order_id || !carrier_code) {
        return res.status(400).json({ message: 'Thieu order_id hoac carrier_code' });
      }

      const carrier = CARRIERS.find((c) => c.code === carrier_code);
      if (!carrier) {
        return res.status(400).json({ message: 'Don vi van chuyen khong hop le' });
      }

      await client.query('BEGIN');

      // Sinh mã vận đơn
      const CARRIER_PREFIX = { GHN: 'GHN', GR: 'GR', GHT: 'GHT', VTP: 'VTP' };
      const carrierPrefix = CARRIER_PREFIX[carrier.code] || 'GHN';
      const trackingNo = await generateCode(carrierPrefix, client);

      // Tạo shipping order
      const shResult = await client.query(
        `INSERT INTO shipping_orders (order_id, carrier_code, carrier_name, tracking_no, shipping_fee)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [order_id, carrier.code, carrier.name, trackingNo, shipping_fee || 0]
      );
      const shipping_order_id = shResult.rows[0].id;

      // Cập nhật trạng thái đơn hàng → warehouse_processing (chờ kho xuất), bước giao = 1
      await client.query(
        `UPDATE sales_orders SET status = 'warehouse_processing', delivery_step = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );

      // Ghi log
      await client.query(
        `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
         VALUES ($1, $2, 'warehouse_processing', $3)`,
        [order_id, userId, `Dieu phoi ${carrier.name}, Phi ship: ${shipping_fee || 0} VND`]
      );

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Dieu phoi thanh cong!',
        tracking_no: trackingNo,
        carrier: carrier.name,
        shipping_fee: shipping_fee || 0,
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}

      // Race condition: retry nếu duplicate tracking_no (tối đa 3 lần)
      if (err.code === '23505' && err.constraint === 'shipping_orders_tracking_no_key' && retries < MAX_RETRIES - 1) {
        retries++;
        console.warn(`[dispatchOrder] Duplicate tracking_no, retrying (${retries}/${MAX_RETRIES})...`);
        continue;
      }

      console.error('[dispatchOrder] ERROR:', err);
      return res.status(500).json({ message: 'Loi dieu phoi', error: err.message });
    }
  }
};

const rejectOrder = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { order_id, reason } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }

    await client.query('BEGIN');
    await client.query(
      `UPDATE sales_orders SET status = 'waiting_sales', note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [reason || 'Logistics tu choi', order_id]
    );
    await client.query(
      `INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
       VALUES ($1, $2, 'waiting_sales', $3)`,
      [order_id, req.user?.id || null, reason || 'Logistics tu choi dieu phoi']
    );
    await client.query('COMMIT');
    res.status(200).json({ message: 'Da tu choi don hang. Don quay ve trang thai pending.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Loi tu choi', error: err.message });
  } finally {
    client.release();
  }
};

// Hàm nội bộ: advance 1 bước cho 1 đơn hàng (trong transaction đã có BEGIN)
// forceFail: true  → logistics báo giao thất bại → customer_rejected
// forceSuccess: true → logistics xác nhận giao thành công → completed
// cả hai false → dùng random 20% thất bại
async function advanceDeliveryStep(client, order_id, forceFail = false, forceSuccess = false) {
  const stepRes = await client.query(
    `SELECT delivery_step FROM sales_orders WHERE id = $1`,
    [order_id]
  );
  const currentStep = Number(stepRes.rows[0]?.delivery_step || 1);
  const nextStep = currentStep + 1;

  if (nextStep <= 3) {
    // Chưa xong → chỉ tăng step
    await client.query(
      `UPDATE sales_orders SET delivery_step = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextStep, order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET shipped_at = CURRENT_TIMESTAMP, status = 'in_transit' WHERE order_id = $1`,
      [order_id]
    );
    return { done: false, delivery_step: nextStep };
  }

  // nextStep == 4 → hoàn tất giao hàng
  let customerRejects = false;
  let rejectReason = null;

  if (forceFail) {
    // Logistics chủ động báo không thành công
    customerRejects = true;
    rejectReason = 'khong_nhan_hang';
  } else if (forceSuccess) {
    // Logistics xác nhận giao thành công rõ ràng
    customerRejects = false;
  } else {
    // Random: 5% khách từ chối (trong quá trình giao)
    const rand = Math.random();
    customerRejects = rand < 0.05;
    if (customerRejects) {
      rejectReason = 'khong_nhan_hang';
    }
  }

  if (customerRejects) {
    await client.query(
      `UPDATE sales_orders SET status = 'return_pending', delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET status = 'customer_rejected' WHERE order_id = $1`,
      [order_id]
    );
    await client.query(
      `INSERT INTO return_requests (order_id, customer_reject_reason, status)
       VALUES ($1, $2, 'return_pending')
       ON CONFLICT (order_id) DO UPDATE SET customer_reject_reason = EXCLUDED.customer_reject_reason, status = 'return_pending'`,
      [order_id, rejectReason]
    );
  } else {
    await client.query(
      `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_TIMESTAMP, delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE shipping_orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
      [order_id]
    );
  }
  return { done: true, delivered: !customerRejects, customer_rejected: customerRejects, reject_reason: rejectReason };
}

const triggerDeliverySimulation = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { order_id, fail, success } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }
    await client.query('BEGIN');
    const result = await advanceDeliveryStep(client, order_id, !!fail, !!success);
    await client.query('COMMIT');

    if (result.done) {
      return res.status(200).json({
        delivered: result.delivered,
        customer_rejected: result.customer_rejected,
        reject_reason: result.reject_reason,
        delivery_step: 4,
        message: result.delivered ? 'Giao hang thanh cong!' : 'Khach hang tu choi nhan hang!',
      });
    }
    return res.status(200).json({ delivery_step: result.delivery_step, status: 'in_progress', message: `Buoc ${result.delivery_step} hoan tat. Tiep tuc...` });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[triggerDeliverySimulation] ERROR:', err.message);
    res.status(500).json({ message: 'Loi giao hang', error: err.message });
  } finally {
    client.release();
  }
};

const simulateAllShipping = async (req, res) => {
  // Chỉ advance đơn đang trong quá trình giao (delivery_step 1-3)
  // Bước 1: warehouse_processing → Bước 2: shipping → Bước 3: shipping → Bước 4: completed/customer_rejected
  const client = await db.pool.connect();
  try {
    const result = await client.query(
      `SELECT id, order_no FROM sales_orders WHERE status = 'shipping' AND delivery_step BETWEEN 1 AND 3`
    );
    const orders = result.rows;

    const results = [];
    for (const order of orders) {
      await client.query('BEGIN');
      const stepRes = await client.query(
        `SELECT delivery_step FROM sales_orders WHERE id = $1`,
        [order.id]
      );
      const currentStep = Number(stepRes.rows[0]?.delivery_step || 1);
      const nextStep = currentStep + 1;

      if (nextStep <= 3) {
        // Chưa xong → tăng step
        await client.query(
          `UPDATE sales_orders SET delivery_step = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [nextStep, order.id]
        );
        if (nextStep === 2) {
          await client.query(
            `UPDATE shipping_orders SET shipped_at = CURRENT_TIMESTAMP, status = 'in_transit' WHERE order_id = $1`,
            [order.id]
          );
        }
        await client.query('COMMIT');
        results.push({ order_id: order.id, order_no: order.order_no, delivery_step: nextStep, status: 'in_progress' });
      } else {
        // Hoàn tất giao hàng — 5% khách không nhận
        const rand = Math.random();
        const customerRejects = rand < 0.05;
        const rejectReason = customerRejects ? 'khong_nhan_hang' : null;

        if (customerRejects) {
          await client.query(
            `UPDATE sales_orders SET status = 'customer_rejected', delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [order.id]
          );
          await client.query(
            `UPDATE shipping_orders SET status = 'customer_rejected' WHERE order_id = $1`,
            [order.id]
          );
          await client.query(
            `INSERT INTO return_requests (order_id, customer_reject_reason, status)
             VALUES ($1, $2, 'pending')
             ON CONFLICT (order_id) DO UPDATE SET customer_reject_reason = EXCLUDED.customer_reject_reason, status = 'pending'`,
            [order.id, rejectReason]
          );
        } else {
          await client.query(
            `UPDATE sales_orders SET status = 'completed', actual_delivery_date = CURRENT_TIMESTAMP, delivery_step = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [order.id]
          );
          await client.query(
            `UPDATE shipping_orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
            [order.id]
          );
        }
        await client.query('COMMIT');
        results.push({ order_id: order.id, order_no: order.order_no, delivery_step: 4, delivered: !customerRejects });
      }
    }

    res.status(200).json({ message: `Da xu ly ${results.length} don`, results });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('[simulateAllShipping] ERROR:', err);
    res.status(500).json({ message: 'Loi auto-simulate', error: err.message });
  } finally {
    client.release();
  }
};

const processCustomerRejection = async (req, res) => {
  // Chỉ xử lý KHÔNG NHẬN HÀNG (trong quá trình giao)
  // → gửi về Sales quyết định
  const client = await db.pool.connect();
  try {
    const { order_id, logistics_note } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'Thieu order_id' });
    }

    await client.query('BEGIN');

    const existingRR = await client.query(
      `SELECT id FROM return_requests WHERE order_id = $1`,
      [order_id]
    );

    if (!existingRR.rows.length) {
      await client.query(
        `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_note, status)
         VALUES ($1, 'khong_nhan_hang', 'during_delivery', $2, 'logistics_handled')`,
        [order_id, logistics_note || 'Khach khong nhan hang trong qua trinh giao']
      );
    } else {
      await client.query(
        `UPDATE return_requests SET customer_reject_reason = 'khong_nhan_hang', complaint_source = 'during_delivery', logistics_note = $1, updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
        [logistics_note || null, order_id]
      );
    }

    await client.query(
      `UPDATE sales_orders SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );
    await client.query(
      `UPDATE return_requests SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
      [order_id]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: 'Da gui don ve Sales xu ly!',
      logistics_action: 'khong_nhan_hang',
      new_status: 'return_to_sales',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Loi xu ly tra hang', error: err.message });
  } finally {
    client.release();
  }
};

const getShippingOrders = async (req, res) => {
  try {
    const result = await db.getAll(`
      SELECT
        sh.id, sh.order_id, sh.carrier_code, sh.carrier_name, sh.tracking_no,
        sh.shipping_fee, sh.status, sh.shipped_at, sh.delivered_at,
        so.order_no, c.company_name AS customer_name,
        so.expected_delivery_date, so.status AS order_status
      FROM shipping_orders sh
      JOIN sales_orders so ON sh.order_id = so.id
      JOIN customers c ON so.customer_id = c.id
      ORDER BY sh.created_at DESC
    `);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Loi lay du lieu', error: err.message });
  }
};

const getReturnRequests = async (req, res) => {
  try {
    const result = await db.getAll(`
      SELECT
        rr.id, rr.order_id, rr.customer_reject_reason, rr.complaint_source,
        rr.logistics_action, rr.logistics_note, rr.handling_result, rr.status,
        so.order_no, c.company_name AS customer_name, so.expected_delivery_date,
        so.status AS order_status, so.note AS order_note
      FROM return_requests rr
      JOIN sales_orders so ON rr.order_id = so.id
      JOIN customers c ON so.customer_id = c.id
      ORDER BY rr.created_at DESC
    `);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Loi lay du lieu', error: err.message });
  }
};

const processCompletedOrder = async (req, res) => {
  // Xử lý đơn đã giao thành công:
  // - action=confirm: xác nhận hoàn thành (không làm gì thêm)
  // - action=complaint: tạo khiếu nại sau giao
  const client = await db.pool.connect();
  try {
    const { order_id, action, note, logistics_action } = req.body;
    if (!order_id || !action) {
      return res.status(400).json({ message: 'Thieu order_id hoac action' });
    }
    if (!['confirm', 'complaint'].includes(action)) {
      return res.status(400).json({ message: 'Action khong hop le' });
    }

    await client.query('BEGIN');

    if (action === 'confirm') {
      // Chỉ cập nhật ghi chú
      await client.query(
        `UPDATE sales_orders SET note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [`[Logistics] Xac nhan giao thanh cong: ${note || ''}`, order_id]
      );
    } else {
      // complaint: tạo return_request cho khiếu nại sau giao
      // logistics_action chỉ có 2 giá trị: 'loi_nha_may' | 'loi_van_tai'
      if (!logistics_action || !['loi_nha_may', 'loi_van_tai'].includes(logistics_action)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Khi yeu cau sau giao, can chon: loi_nha_may hoac loi_van_tai' });
      }

      await client.query(
        `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_action, logistics_note, status)
         VALUES ($1, 'khieu_nai_sau_giao', 'after_delivery', $2, $3, 'return_pending')
         ON CONFLICT (order_id) DO UPDATE SET
           complaint_source = 'after_delivery',
           logistics_action = EXCLUDED.logistics_action,
           logistics_note = EXCLUDED.logistics_note,
           status = 'return_pending',
           updated_at = CURRENT_TIMESTAMP`,
        [order_id, logistics_action, note || 'Khieu nai sau khi giao thanh cong']
      );

      await client.query(
        `UPDATE sales_orders SET status = 'return_pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );
      await client.query(
        `UPDATE shipping_orders SET status = 'return_pending' WHERE order_id = $1`,
        [order_id]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: action === 'confirm' ? 'Da xac nhan hoan thanh' : 'Da tao yeu cau khieu nai sau giao',
      complaint_source: action === 'complaint' ? 'after_delivery' : null,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ message: 'Loi xu ly', error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  processOrder,
  dispatchOrder,
  rejectOrder,
  triggerDeliverySimulation,
  simulateAllShipping,
  processCustomerRejection,
  processCompletedOrder,
  getShippingOrders,
  getReturnRequests,
  CARRIERS,
};

`

## === FILE: D:\Doan_5\backend\src\controllers\warehouse.controller.js ===
`javascript
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

`

## === FILE: D:\Doan_5\backend\src\controllers\report.controller.js ===
`javascript
const db = require('../config/database');
const { verifyToken } = require('../middlewares/auth.middleware');

const toNumber = (value) => Number(value || 0);

const buildDateFilter = (period) => {
    switch (period) {
        case 'day':
            return { label: 'Hôm nay', sql: "created_at >= CURRENT_DATE" };
        case 'week':
            return { label: 'Tuần này', sql: "created_at >= DATE_TRUNC('week', CURRENT_DATE)" };
        case 'month':
            return { label: 'Tháng này', sql: "created_at >= DATE_TRUNC('month', CURRENT_DATE)" };
        case 'quarter':
            return { label: 'Quý này', sql: "created_at >= DATE_TRUNC('quarter', CURRENT_DATE)" };
        default:
            return { label: 'Tất cả', sql: null };
    }
};

// ============================================================
// Admin Dashboard — tổng quan toàn hệ thống (Power BI style)
// ============================================================
const getAdminDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';
        const soDateSql = dateSql.replace('created_at', 'o.created_at');
        // Dùng actual_delivery_date cho chart (phân bố đều theo tháng), fallback về created_at
        const orderDateCol = 'COALESCE(o.actual_delivery_date, o.updated_at, o.created_at)';
        const orderDateSql = dateFilter.sql
            ? `AND ${dateFilter.sql.replace('created_at', orderDateCol)}`
            : '';
        // revenueByMonth: group by month for quarter/all, by day for day/week/month
        const revenueMonthGroup = period === 'quarter' || period === 'all'
            ? `TO_CHAR(${orderDateCol}, 'YYYY-MM')`
            : `TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')`;

        const [totalUsersRow, totalProductsRow, totalCustomersRow, totalWarehousesRow,
            totalOrdersRow, completedOrdersRow, pendingOrdersRow,
            totalRevenueRow, totalReceiptsRow, totalOutboundsRow,
            lowStockRow, returnPendingRow, outboundPendingRow,
            revenueByDay, ordersByDay, revenueByMonth, ordersByStatus,
            ordersByCategory, revenueByCarrier, topCustomersList
        ] = await Promise.all([
            db.getOne('SELECT COUNT(*) as total FROM users WHERE status = \'active\''),
            db.getOne('SELECT COUNT(*) as total FROM products'),
            db.getOne('SELECT COUNT(*) as total FROM customers'),
            db.getOne('SELECT COUNT(*) as total FROM warehouses'),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE 1=1 ${dateSql.replace('created_at', 'sales_orders.created_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status = 'completed' ${dateSql.replace('created_at', 'sales_orders.updated_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('pending', 'warehouse_processing', 'waiting_sales', 'shipping') ${dateSql.replace('created_at', 'sales_orders.created_at')}`),
            db.getOne(`
                SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
            `),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE 1=1 ${dateSql}`),
            db.getOne(`
                SELECT COUNT(*) as total FROM inventory_balances ib
                JOIN warehouses w ON ib.warehouse_id = w.id
                WHERE COALESCE(ib.on_hand_qty, 0) < COALESCE((SELECT min_stock FROM products WHERE id = ib.product_id), 50)
                AND (w.warehouse_type != 'defective' OR w.warehouse_type IS NULL)
            `),
            db.getOne(`SELECT COUNT(*) as total FROM return_requests WHERE status IN ('return_pending', 'pending')`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'pending'`),
            // Doanh thu theo ngày (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT TO_CHAR(${orderDateCol}, 'YYYY-MM-DD') as date,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${orderDateSql}
                GROUP BY TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            // Đơn hàng theo ngày (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT TO_CHAR(${orderDateCol}, 'YYYY-MM-DD') as date,
                       COUNT(*) as orders
                FROM sales_orders o
                WHERE 1=1 ${orderDateSql}
                GROUP BY TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            // Doanh thu theo tháng — nhóm theo tháng (quarter/all) hoặc ngày (day/week/month) + filter period
            db.getAll(`
                SELECT ${revenueMonthGroup} as period,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(DISTINCT o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
                  AND ${orderDateCol} >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
                  ${orderDateSql}
                GROUP BY ${revenueMonthGroup}
                ORDER BY period ASC
            `),
            // Đơn hàng theo trạng thái
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity * COALESCE(unit_price, 0)) FROM sales_order_items WHERE order_id = sales_orders.id)), 0) as revenue
                FROM sales_orders
                WHERE 1=1 ${dateSql}
                GROUP BY status
                ORDER BY count DESC
            `),
            // Đơn hàng theo danh mục sản phẩm (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT p.category as name,
                       COUNT(DISTINCT o.id) as orders,
                       COALESCE(SUM(oi.quantity), 0) as qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                JOIN products p ON p.id = oi.product_id
                WHERE 1=1 ${orderDateSql}
                GROUP BY p.category
                ORDER BY revenue DESC
            `),
            // Doanh thu theo đơn vị vận chuyển
            db.getAll(`
                SELECT sh.carrier_name as name, sh.carrier_code,
                       COUNT(DISTINCT sh.id) as shipments,
                       COALESCE(SUM((SELECT SUM(quantity * COALESCE(unit_price, 0)) FROM sales_order_items WHERE order_id = sh.order_id)), 0) as revenue
                FROM shipping_orders sh
                WHERE 1=1 ${dateSql.replace('created_at', 'sh.assigned_at')}
                GROUP BY sh.carrier_name, sh.carrier_code
                ORDER BY shipments DESC
            `),
            // Top khách hàng (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT c.company_name as name,
                       COUNT(DISTINCT o.id) as orders,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_spent
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${orderDateSql}
                GROUP BY c.id, c.company_name
                ORDER BY total_spent DESC LIMIT 8
            `),
        ]);

        const recentOrders = await db.getAll(`
            SELECT o.id, o.order_no, o.status, o.created_at,
                   c.company_name AS customer_name,
                   COUNT(oi.id) as item_count,
                   COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_amount
            FROM sales_orders o
            JOIN customers c ON c.id = o.customer_id
            LEFT JOIN sales_order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE 1=1 ${orderDateSql}
            GROUP BY o.id, c.company_name
            ORDER BY o.created_at DESC LIMIT 10
        `);

        const topProducts = await db.getAll(`
            SELECT p.name, p.sku, p.category, SUM(oi.quantity) as total_qty,
                   COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
            FROM sales_order_items oi
            JOIN sales_orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE o.status = 'completed' ${orderDateSql}
            GROUP BY p.id, p.name, p.sku, p.category
            ORDER BY total_qty DESC LIMIT 8
        `);

        const warehouseUtilization = await db.getAll(`
            SELECT w.name, w.warehouse_code,
                   COUNT(DISTINCT ib.product_id) as product_count,
                   COALESCE(SUM(ib.on_hand_qty), 0) as total_qty,
                   COALESCE(SUM(ib.on_hand_qty * COALESCE((SELECT sale_price FROM products WHERE id = ib.product_id), 0)), 0) as total_value
            FROM warehouses w
            LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
            GROUP BY w.id, w.name, w.warehouse_code
            ORDER BY total_qty DESC
        `);

        const returnStats = await db.getAll(`
            SELECT status, COUNT(*) as count
            FROM return_requests
            WHERE 1=1 ${dateSql.replace('created_at', 'return_requests.created_at')}
            GROUP BY status
        `);

        const returnReasons = await db.getAll(`
            SELECT customer_reject_reason as reason, COUNT(*) as count
            FROM return_requests
            WHERE customer_reject_reason IS NOT NULL
              ${dateSql.replace('created_at', 'created_at')}
            GROUP BY customer_reject_reason
            ORDER BY count DESC
        `);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_users: toNumber(totalUsersRow?.total),
                total_products: toNumber(totalProductsRow?.total),
                total_customers: toNumber(totalCustomersRow?.total),
                total_warehouses: toNumber(totalWarehousesRow?.total),
                total_orders: toNumber(totalOrdersRow?.total),
                completed_orders: toNumber(completedOrdersRow?.total),
                pending_orders: toNumber(pendingOrdersRow?.total),
                total_revenue: toNumber(totalRevenueRow?.total),
                total_receipts: toNumber(totalReceiptsRow?.total),
                total_outbounds: toNumber(totalOutboundsRow?.total),
                low_stock_count: toNumber(lowStockRow?.total),
                return_pending: toNumber(returnPendingRow?.total),
                outbound_pending: toNumber(outboundPendingRow?.total),
            },
            charts: {
                revenue_by_day: revenueByDay,
                orders_by_day: ordersByDay,
                revenue_by_month: revenueByMonth,
                orders_by_status: ordersByStatus,
                orders_by_category: ordersByCategory,
                revenue_by_carrier: revenueByCarrier,
                return_reasons: returnReasons,
            },
            tables: {
                recent_orders: recentOrders,
                top_products: topProducts,
                top_customers: topCustomersList,
                warehouse_utilization: warehouseUtilization,
                return_stats: returnStats,
            },
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Sales Dashboard — KPI cá nhân
// ============================================================
const getSalesDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'o.created_at')}` : '';

        const [totalMyOrdersRow, completedMyOrdersRow, revenueRow,
            pendingMyOrdersRow, myCustomersRow, avgOrderValueRow,
            myRevenueByDay, myTopProducts, recentMyOrders
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 ${dateSql}`, [userId]),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 AND o.status = 'completed' ${dateSql}`, [userId]),
            db.getOne(`
                SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
            `, [userId]),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 AND o.status IN ('pending', 'warehouse_processing', 'waiting_sales', 'shipping') ${dateSql}`, [userId]),
            db.getOne(`
                SELECT COUNT(DISTINCT c.id) as total
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.created_by = $1 ${dateSql}
            `, [userId]),
            db.getOne(`
                SELECT COALESCE(AVG(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as avg_val
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
            `, [userId]),
            db.getAll(`
                SELECT TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM-DD') as date,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM-DD')
                ORDER BY date ASC
            `, [userId]),
            db.getAll(`
                SELECT p.name, p.sku, SUM(oi.quantity) as total_qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
                GROUP BY p.id, p.name, p.sku
                ORDER BY total_qty DESC LIMIT 5
            `, [userId]),
            db.getAll(`
                SELECT o.id, o.order_no, o.status, o.created_at,
                       c.company_name AS customer_name,
                       COUNT(oi.id) as item_count
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                WHERE o.created_by = $1
                GROUP BY o.id, c.company_name
                ORDER BY o.created_at DESC LIMIT 8
            `, [userId]),
        ]);

        const statusBreakdown = await db.getAll(`
            SELECT status, COUNT(*) as count
            FROM sales_orders
            WHERE created_by = $1
            GROUP BY status
        `, [userId]);

        res.status(200).json({
            period: dateFilter.label,
            user_id: userId,
            summary: {
                total_orders: toNumber(totalMyOrdersRow?.total),
                completed_orders: toNumber(completedMyOrdersRow?.total),
                pending_orders: toNumber(pendingMyOrdersRow?.total),
                total_revenue: toNumber(revenueRow?.total),
                total_customers: toNumber(myCustomersRow?.total),
                avg_order_value: toNumber(avgOrderValueRow?.avg_val),
                completion_rate: toNumber(totalMyOrdersRow?.total) > 0
                    ? Math.round((toNumber(completedMyOrdersRow?.total) / toNumber(totalMyOrdersRow?.total)) * 100)
                    : 0,
            },
            charts: {
                revenue_by_day: myRevenueByDay,
            },
            tables: {
                recent_orders: recentMyOrders,
                top_products: myTopProducts,
                status_breakdown: statusBreakdown,
            },
        });
    } catch (err) {
        console.error('Sales dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Warehouse Dashboard — Tổng quan kho
// ============================================================
const getWarehouseDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalProductsRow, totalStockRow, lowStockRow,
            totalReceiptsRow, pendingReceiptsRow, completedReceiptsRow,
            totalOutboundsRow, pendingOutboundsRow, completedOutboundsRow,
            receiptsByDay, outboundsByDay, lowStockProducts,
            warehouseBreakdown, recentReceipts, recentOutbounds
        ] = await Promise.all([
            db.getOne('SELECT COUNT(DISTINCT product_id) as total FROM inventory_balances WHERE on_hand_qty > 0'),
            db.getOne('SELECT COALESCE(SUM(on_hand_qty), 0) as total FROM inventory_balances'),
            db.getOne(`
                SELECT COUNT(*) as total FROM inventory_balances ib
                JOIN products p ON p.id = ib.product_id
                WHERE COALESCE(ib.on_hand_qty, 0) < COALESCE(p.min_stock, 50)
            `),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'completed'`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE 1=1 ${dateSql.replace('created_at', 'stock_outbound_notes.created_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'completed'`),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts,
                       COALESCE(SUM((SELECT SUM(quantity) FROM production_receipt_items WHERE receipt_id = production_receipts.id)), 0) as total_qty
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT TO_CHAR(export_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as outbounds
                FROM stock_outbound_notes
                WHERE export_date IS NOT NULL
                GROUP BY TO_CHAR(export_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT p.sku, p.name, p.unit,
                       COALESCE(SUM(ib.on_hand_qty), 0) as on_hand,
                       COALESCE(p.min_stock, 50) as min_stock,
                       w.name as warehouse_name
                FROM products p
                LEFT JOIN inventory_balances ib ON ib.product_id = p.id
                LEFT JOIN warehouses w ON w.id = ib.warehouse_id
                GROUP BY p.id, p.sku, p.name, p.unit, p.min_stock, w.name
                HAVING COALESCE(SUM(ib.on_hand_qty), 0) < COALESCE(p.min_stock, 50)
                ORDER BY on_hand ASC LIMIT 10
            `),
            db.getAll(`
                SELECT w.name, w.warehouse_code,
                       COUNT(DISTINCT ib.product_id) as product_types,
                       COALESCE(SUM(ib.on_hand_qty), 0) as total_qty
                FROM warehouses w
                LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
                GROUP BY w.id, w.name, w.warehouse_code
                ORDER BY total_qty DESC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                ORDER BY r.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT s.id, s.outbound_no, s.status, s.export_date,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM stock_outbound_note_items WHERE outbound_note_id = s.id) as item_count
                FROM stock_outbound_notes s
                LEFT JOIN warehouses w ON w.id = s.warehouse_id
                ORDER BY s.created_at DESC LIMIT 6
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_product_types: toNumber(totalProductsRow?.total),
                total_stock: toNumber(totalStockRow?.total),
                low_stock_count: toNumber(lowStockRow?.total),
                total_receipts: toNumber(totalReceiptsRow?.total),
                pending_receipts: toNumber(pendingReceiptsRow?.total),
                completed_receipts: toNumber(completedReceiptsRow?.total),
                total_outbounds: toNumber(totalOutboundsRow?.total),
                pending_outbounds: toNumber(pendingOutboundsRow?.total),
                completed_outbounds: toNumber(completedOutboundsRow?.total),
            },
            charts: {
                receipts_by_day: receiptsByDay,
                outbounds_by_day: outboundsByDay,
            },
            tables: {
                low_stock_products: lowStockProducts,
                warehouse_breakdown: warehouseBreakdown,
                recent_receipts: recentReceipts,
                recent_outbounds: recentOutbounds,
            },
        });
    } catch (err) {
        console.error('Warehouse dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Logistics Dashboard — Theo dõi giao hàng
// ============================================================
const getLogisticsDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalDeliveriesRow, completedDeliveriesRow, pendingDeliveriesRow,
            returnCountRow, compensationPendingRow, onTimeRow,
            deliveriesByDay, recentDeliveries, returnList, compensationList
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales') ${dateSql.replace('created_at', 'sales_orders.updated_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status = 'completed' ${dateSql.replace('created_at', 'sales_orders.actual_delivery_date')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('warehouse_processing', 'waiting_sales', 'shipping')`),
            db.getOne(`SELECT COUNT(*) as total FROM return_requests WHERE status IN ('return_pending', 'pending')`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'pending'`),
            db.getOne(`
                SELECT COUNT(*) as total FROM sales_orders
                WHERE status = 'completed'
                AND actual_delivery_date IS NOT NULL
                AND actual_delivery_date <= expected_delivery_date
            `),
            db.getAll(`
                SELECT TO_CHAR(actual_delivery_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as deliveries
                FROM sales_orders
                WHERE status = 'completed' AND actual_delivery_date IS NOT NULL
                GROUP BY TO_CHAR(actual_delivery_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT o.id, o.order_no, o.status, o.expected_delivery_date, o.actual_delivery_date,
                       c.company_name AS customer_name,
                       (SELECT tracking_no FROM shipping_orders WHERE order_id = o.id ORDER BY id DESC LIMIT 1) as tracking_no
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales')
                ORDER BY o.updated_at DESC LIMIT 8
            `),
            db.getAll(`
                SELECT rr.id, rr.order_id, so.order_no, rr.status, rr.customer_reject_reason,
                       rr.logistics_action, rr.complaint_source, rr.created_at,
                       c.company_name AS customer_name
                FROM return_requests rr
                JOIN sales_orders so ON rr.order_id = so.id
                JOIN customers c ON c.id = so.customer_id
                WHERE rr.status IN ('return_pending', 'pending', 'logistics_handled')
                ORDER BY rr.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type,
                       so.order_no, c.company_name AS customer_name, cr.created_at
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
        ]);

        const totalCompleted = toNumber(completedDeliveriesRow?.total);
        const totalDelivered = toNumber(totalDeliveriesRow?.total);
        const onTimeCount = toNumber(onTimeRow?.total);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_deliveries: totalDelivered,
                completed_deliveries: totalCompleted,
                pending_deliveries: toNumber(pendingDeliveriesRow?.total),
                return_requests: toNumber(returnCountRow?.total),
                compensation_pending: toNumber(compensationPendingRow?.total),
                on_time_rate: totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0,
            },
            charts: {
                deliveries_by_day: deliveriesByDay,
            },
            tables: {
                recent_deliveries: recentDeliveries,
                return_list: returnList,
                compensation_list: compensationList,
            },
        });
    } catch (err) {
        console.error('Logistics dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Factory Dashboard — Quản lý sản xuất / bù hàng
// ============================================================
const getFactoryDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalReceiptsRow, pendingReceiptsRow, completedReceiptsRow,
            totalCompensationsRow, pendingCompensationsRow, approvedCompensationsRow,
            receiptsByDay, pendingReceiptList, compensationPendingList
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'completed'`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'approved'`),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date, r.note,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type, cr.created_at,
                       so.order_no, c.company_name AS customer_name,
                       (SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id) as item_count
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_receipts: toNumber(totalReceiptsRow?.total),
                pending_receipts: toNumber(pendingReceiptsRow?.total),
                completed_receipts: toNumber(completedReceiptsRow?.total),
                total_compensations: toNumber(totalCompensationsRow?.total),
                pending_compensations: toNumber(pendingCompensationsRow?.total),
                approved_compensations: toNumber(approvedCompensationsRow?.total),
            },
            charts: {
                receipts_by_day: receiptsByDay,
            },
            tables: {
                pending_receipts: pendingReceiptList,
                pending_compensations: compensationPendingList,
            },
        });
    } catch (err) {
        console.error('Factory dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Reports — Inventory (Admin + Warehouse)
// ============================================================
const getInventoryReport = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT
                p.sku, p.name as product_name, w.name as warehouse_name,
                ib.on_hand_qty, p.unit, p.sale_price,
                (ib.on_hand_qty * p.sale_price) as total_value
            FROM inventory_balances ib
            JOIN products p ON ib.product_id = p.id
            JOIN warehouses w ON ib.warehouse_id = w.id
            WHERE ib.on_hand_qty > 0
            ORDER BY w.name, p.name
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Sales (doanh thu theo thời gian)
// ============================================================
const getSalesReport = async (req, res) => {
    try {
        const { period = 'month', group_by = 'date' } = req.query;
        const userId = req.user?.id;
        const isAdmin = req.user?.role_id === 1;

        const dateFormat = group_by === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'o.created_at')}` : '';
        const userFilter = isAdmin ? '' : 'AND o.created_by = $1';

        const [revenueRows, orderStats, topProducts, customerStats] = await Promise.all([
            db.getAll(`
                SELECT TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), $1) as period,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(DISTINCT o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), $1)
                ORDER BY period ASC
            `, [dateFormat, ...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE 1=1 ${dateSql} ${userFilter}
                GROUP BY status
            `, [...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT p.name, p.sku, SUM(oi.quantity) as total_qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY p.id, p.name, p.sku
                ORDER BY revenue DESC LIMIT 10
            `, [...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT c.company_name, COUNT(o.id) as order_count,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_spent
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY c.id, c.company_name
                ORDER BY total_spent DESC LIMIT 10
            `, [...(isAdmin ? [] : [userId])]),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            group_by,
            charts: { revenue_by_period: revenueRows },
            summary: {
                total_orders: orderStats.reduce((s, r) => s + toNumber(r.count), 0),
                total_revenue: orderStats.reduce((s, r) => s + toNumber(r.revenue), 0),
            },
            tables: {
                order_stats: orderStats,
                top_products: topProducts,
                top_customers: customerStats,
            },
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Logistics (giao hàng & hoàn hàng)
// ============================================================
const getLogisticsReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'so.updated_at')}` : '';

        const [deliveryStats, returnStats, compensationStats
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count
                FROM sales_orders so
                WHERE status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales', 'canceled')
                ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT rr.customer_reject_reason, rr.complaint_source, COUNT(*) as count
                FROM return_requests rr
                JOIN sales_orders so ON rr.order_id = so.id
                WHERE 1=1 ${dateSql}
                GROUP BY rr.customer_reject_reason, rr.complaint_source
                ORDER BY count DESC
            `),
            db.getAll(`
                SELECT cr.defect_type, cr.status, COUNT(*) as count,
                       COALESCE(SUM((SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id)), 0) as total_items
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                GROUP BY cr.defect_type, cr.status
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            tables: {
                delivery_stats: deliveryStats,
                return_stats: returnStats,
                compensation_stats: compensationStats,
            },
        });
    } catch (err) {
        console.error('Logistics report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Warehouse (xuất/nhap kho)
// ============================================================
const getWarehouseReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [receiptStats, outboundStats, productMovement, warehouseSummary,
            receiptsByDay, outboundsByDay
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity) FROM production_receipt_items WHERE receipt_id = production_receipts.id)), 0) as total_qty
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity) FROM stock_outbound_note_items WHERE outbound_note_id = stock_outbound_notes.id)), 0) as total_qty
                FROM stock_outbound_notes
                WHERE 1=1 ${dateSql.replace('created_at', 'stock_outbound_notes.created_at')}
                GROUP BY status
            `),
            db.getAll(`
                SELECT * FROM (
                    SELECT p.sku, p.name, p.unit,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'IN' THEN it.quantity ELSE 0 END), 0) as total_in,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'OUT' THEN it.quantity ELSE 0 END), 0) as total_out,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'IN' THEN it.quantity ELSE -it.quantity END), 0) as net_change,
                           COALESCE(ib.on_hand_qty, 0) as current_stock
                    FROM products p
                    LEFT JOIN inventory_transactions it ON it.product_id = p.id
                    LEFT JOIN inventory_balances ib ON ib.product_id = p.id
                    WHERE 1=1 ${dateSql.replace('created_at', 'it.transaction_date')}
                    GROUP BY p.id, p.sku, p.name, p.unit, ib.on_hand_qty
                ) sub ORDER BY ABS(net_change) DESC LIMIT 15
            `),
            db.getAll(`
                SELECT w.name, w.warehouse_code,
                       COUNT(DISTINCT ib.product_id) as product_types,
                       COALESCE(SUM(ib.on_hand_qty), 0) as total_qty,
                       COUNT(DISTINCT pr.id) as receipt_count,
                       COUNT(DISTINCT so.id) as outbound_count
                FROM warehouses w
                LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
                LEFT JOIN production_receipts pr ON pr.warehouse_id = w.id
                LEFT JOIN stock_outbound_notes so ON so.warehouse_id = w.id
                GROUP BY w.id, w.name, w.warehouse_code
                ORDER BY total_qty DESC
            `),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT TO_CHAR(export_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as outbounds
                FROM stock_outbound_notes
                WHERE export_date IS NOT NULL
                GROUP BY TO_CHAR(export_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            charts: {
                receipts_by_day: receiptsByDay,
                outbounds_by_day: outboundsByDay,
            },
            tables: {
                receipt_stats: receiptStats,
                outbound_stats: outboundStats,
                product_movement: productMovement,
                warehouse_summary: warehouseSummary,
            },
        });
    } catch (err) {
        console.error('Warehouse report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Factory (phiếu nhập + phiếu bù)
// ============================================================
const getFactoryReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [receiptStats, compensationStats, receiptByDay,
            pendingReceipts, pendingCompensations, recentActivity
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT cr.defect_type, cr.status, COUNT(*) as count,
                       COALESCE(SUM((SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id)), 0) as total_items
                FROM compensation_requests cr
                WHERE 1=1 ${dateSql.replace('created_at', 'cr.created_at')}
                GROUP BY cr.defect_type, cr.status
            `),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date, r.note,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type, cr.created_at,
                       so.order_no, c.company_name AS customer_name
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
            db.getAll(`
                SELECT 'receipt' as type, r.receipt_no as code, r.status, r.created_at as date, w.name as ref_name
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                UNION ALL
                SELECT 'compensation' as type, cr.compensation_no as code, cr.status, cr.created_at as date, so.order_no as ref_name
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                ORDER BY date DESC LIMIT 10
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            charts: { receipts_by_day: receiptByDay },
            tables: {
                receipt_stats: receiptStats,
                compensation_stats: compensationStats,
                pending_receipts: pendingReceipts,
                pending_compensations: pendingCompensations,
                recent_activity: recentActivity,
            },
        });
    } catch (err) {
        console.error('Factory report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Role-aware dispatcher
// ============================================================
const getRoleReport = async (req, res) => {
    const roleId = req.user?.role_id;
    switch (roleId) {
        case 1: return getAdminDashboard(req, res);
        case 2: return getSalesDashboard(req, res);
        case 4: return getWarehouseDashboard(req, res);
        case 3: return getLogisticsDashboard(req, res);
        case 5: return getFactoryDashboard(req, res);
        default:
            res.status(403).json({ message: 'Khong co quyen truy cap dashboard nay' });
    }
};

module.exports = {
    getRoleReport,
    getAdminDashboard,
    getSalesDashboard,
    getWarehouseDashboard,
    getLogisticsDashboard,
    getFactoryDashboard,
    getInventoryReport,
    getSalesReport,
    getLogisticsReport,
    getWarehouseReport,
    getFactoryReport,
};

`


# 5. BACKEND - Routes

## === FILE: D:\Doan_5\backend\src\routes\auth.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.get('/users', authController.getAllUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\customer.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/next-code', customerController.getNextCustomerCode);
router.get('/', verifyToken, customerController.getAllCustomers);
router.post('/', verifyToken, customerController.createCustomer);
router.delete('/:id', verifyToken, customerController.deleteCustomer);

module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\order.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các route cơ bản cho Sales
router.get('/', verifyToken, orderController.getAllOrders);
router.get('/next-code', verifyToken, orderController.getNextOrderNo);
router.get('/:id/items', verifyToken, orderController.getOrderItems);
router.post('/', verifyToken, orderController.createOrder);
router.put('/:id', verifyToken, orderController.updateOrder);
router.delete('/:id', verifyToken, orderController.deleteOrder);

// Các route chuyên biệt cho Logistics và Kho
router.post('/process-logistics', verifyToken, orderController.processLogistics);
router.put('/:id/issue', verifyToken, orderController.reportWarehouseIssue);
router.put('/:id/export', verifyToken, orderController.exportOrder);
router.put('/:id/return-inventory', verifyToken, orderController.returnInventory);
router.put('/:id/confirm-delivery', verifyToken, orderController.confirmDelivery);
router.put('/:id/process-customer-rejection', verifyToken, orderController.processCustomerRejection);
router.put('/:id/return-to-sales', verifyToken, orderController.returnToSales);
// QUAN TRỌNG: Export trực tiếp biến router
module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\product.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các đường dẫn API cho sản phẩm
router.get('/', verifyToken, productController.getAllProducts);
router.get('/next-code', verifyToken, productController.getNextSku);
router.post('/', verifyToken, productController.createProduct);

router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);
module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\receipt.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', receiptController.getAllReceipts);
router.post('/', verifyToken, receiptController.createRequest);
router.put('/:id/respond', receiptController.factoryRespond);
router.put('/:id/confirm', receiptController.confirmReceipt);

module.exports = router;

`

## === FILE: D:\Doan_5\backend\src\routes\outbound.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const outboundController = require('../controllers/outbound.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, outboundController.getAllOutbounds);
router.get('/pending', verifyToken, outboundController.getPendingOutboundRequests);
router.get('/warehouse/:warehouse_id/stock', verifyToken, outboundController.getWarehouseStock);
router.post('/', verifyToken, outboundController.createOutboundFromPending);
router.put('/:order_id/respond', verifyToken, outboundController.respondOutbound);

module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\return.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const returnCtrl = require('../controllers/return.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/',                       verifyToken, returnCtrl.getAllReturns);
router.get('/compensations',          verifyToken, returnCtrl.getCompensations);
router.get('/:order_id',              verifyToken, returnCtrl.getReturnByOrder);
router.post('/process',               verifyToken, returnCtrl.processReturn);
router.get('/compensations',          verifyToken, returnCtrl.getCompensations);
router.put('/compensations/:id',      verifyToken, returnCtrl.processCompensation);
router.get('/notifications',          verifyToken, returnCtrl.getNotifications);
router.put('/notifications/:id/read', verifyToken, returnCtrl.markNotificationRead);
router.put('/notifications/read-all', verifyToken, returnCtrl.markAllNotificationsRead);

// Legacy endpoints — redirect
router.post('/init',     verifyToken, returnCtrl.processReturnInit);
router.post('/complete', verifyToken, returnCtrl.processReturnComplete);

module.exports = router;

`

## === FILE: D:\Doan_5\backend\src\routes\logistics.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const logisticsCtrl = require('../controllers/logistics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/process',          verifyToken, logisticsCtrl.processOrder);
router.post('/dispatch',         verifyToken, logisticsCtrl.dispatchOrder);
router.post('/reject',          verifyToken, logisticsCtrl.rejectOrder);
router.post('/simulate',         verifyToken, logisticsCtrl.triggerDeliverySimulation);
router.post('/simulate-all',     verifyToken, logisticsCtrl.simulateAllShipping);
router.post('/customer-rejection', verifyToken, logisticsCtrl.processCustomerRejection);
router.post('/process-completed',   verifyToken, logisticsCtrl.processCompletedOrder);
router.get('/shipping',         verifyToken, logisticsCtrl.getShippingOrders);
router.get('/returns',           verifyToken, logisticsCtrl.getReturnRequests);

module.exports = router;

`

## === FILE: D:\Doan_5\backend\src\routes\warehouse.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, warehouseController.getAllWarehouses);
router.get('/for-outbound', verifyToken, warehouseController.getWarehousesForOutbound);
router.get('/defective-orders', verifyToken, warehouseController.getDefectiveOrders);
router.post('/', verifyToken, warehouseController.createWarehouse);
router.delete('/:id', verifyToken, warehouseController.deleteWarehouse);

module.exports = router;
`

## === FILE: D:\Doan_5\backend\src\routes\report.routes.js ===
`javascript
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Dashboard theo role (Admin/Sales/Warehouse/Logistics/Factory)
router.get('/dashboard', verifyToken, reportController.getRoleReport);

// Báo cáo chi tiết theo role
router.get('/sales',        verifyToken, reportController.getSalesReport);
router.get('/logistics',    verifyToken, reportController.getLogisticsReport);
router.get('/warehouse',    verifyToken, reportController.getWarehouseReport);
router.get('/factory',      verifyToken, reportController.getFactoryReport);

// Báo cáo tồn kho (Admin + Warehouse)
router.get('/inventory',    verifyToken, reportController.getInventoryReport);

module.exports = router;

`

## === FILE: D:\Doan_5\backend\src\routes\upload.routes.js ===
`javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/image', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    message: 'Upload ảnh thành công',
    url: fileUrl,
  });
});

module.exports = router;

`



# 6. FRONTEND - Services

## === FILE: D:\Doan_5\frontend\src\services\api.js ===
`javascript
import axios from 'axios';

// Su dung relative URL - Vercel se proxy /api/* den backend Render qua vercel.json rewrites
const api = axios.create({
  baseURL: '/api',
});

// Tu dong gan Token vao moi lan goi API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tu dong vet ra trang Login neu Token het han (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

`

## === FILE: D:\Doan_5\frontend\src\services\orderService.js ===
`javascript
import api from './api';

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderItems = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/items`);
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return response.data;
};

export const updateOrder = async (orderId, payload) => {
  const response = await api.put(`/orders/${orderId}`, payload);
  return response.data;
};

`

## === FILE: D:\Doan_5\frontend\src\services\productService.js ===
`javascript
import api from './api';

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await api.post('/products', payload);
  return response.data;
};

export const updateProduct = async (productId, payload) => {
  const response = await api.put(`/products/${productId}`, payload);
  return response.data;
};

`

## === FILE: D:\Doan_5\frontend\src\services\receiptService.js ===
`javascript
import api from './api';

export const getImports = async () => {
  const response = await api.get('/receipts');
  return response.data;
};

export const createImportRequest = async (payload) => {
  const response = await api.post('/receipts', payload);
  return response.data;
};

export const respondReceipt = async (receiptId, payload) => {
  const response = await api.put(`/receipts/${receiptId}/respond`, payload);
  return response.data;
};

`

## === FILE: D:\Doan_5\frontend\src\services\outboundService.js ===
`javascript
import api from './api';

export const getExports = async () => {
  const response = await api.get('/outbounds');
  return response.data;
};

export const createOutbound = async (payload) => {
  const response = await api.post('/outbounds', payload);
  return response.data;
};

export const respondOutbound = async (orderId, payload) => {
  const response = await api.put(`/outbounds/${orderId}/respond`, payload);
  return response.data;
};

`

## === FILE: D:\Doan_5\frontend\src\services\reportService.js ===
`javascript
import api from './api';

export const getDashboardStats = async (period) => {
  const response = await api.get(`/reports/dashboard${period ? `?period=${period}` : ''}`);
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};

export const getSalesReport = async (period, groupBy = 'date') => {
  const qs = new URLSearchParams({ period, group_by: groupBy }).toString();
  const response = await api.get(`/reports/sales?${qs}`);
  return response.data;
};

export const getLogisticsReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/logistics?${qs}`);
  return response.data;
};

export const getWarehouseReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/warehouse?${qs}`);
  return response.data;
};

export const getFactoryReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/factory?${qs}`);
  return response.data;
};

`

## === FILE: D:\Doan_5\frontend\src\services\warehouseService.js ===
`javascript
import api from './api';

export const getWarehouses = async () => {
  const response = await api.get('/warehouses');
  return response.data;
};

export const createWarehouse = async (payload) => {
  const response = await api.post('/warehouses', payload);
  return response.data;
};

export const deleteWarehouse = async (warehouseId) => {
  const response = await api.delete(`/warehouses/${warehouseId}`);
  return response.data;
};

`



# 7. FRONTEND - Pages

## === FILE: D:\Doan_5\frontend\src\pages\LoginPage.jsx ===
`jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';

const demoAccounts = [
  { email: 'admin@congty.com',     password: '123456', role: 'Admin',     accent: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', icon: 'ri-shield-user-line'  },
  { email: 'sale@congty.com',      password: '123456', role: 'Sales',     accent: '#fee2e2', border: '#fca5a5', text: '#b91c1c', icon: 'ri-shopping-cart-line' },
  { email: 'kho@congty.com',       password: '123456', role: 'Kho',       accent: '#fef3c7', border: '#fcd34d', text: '#b45309', icon: 'ri-archive-line'       },
  { email: 'logistics@congty.com', password: '123456', role: 'Logistics', accent: '#dcfce7', border: '#86efac', text: '#15803d', icon: 'ri-truck-line'         },
  { email: 'nhamay@congty.com',    password: '123456', role: 'Nhà máy',   accent: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', icon: 'ri-building-line'      },
];

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [logoError, setLogoError]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .login-root { font-family: 'Inter', system-ui, sans-serif; }

        .login-input:focus { border-color: #1e40af !important; box-shadow: 0 0 0 4px rgba(30,64,175,0.12); }
        .login-submit:hover { transform: translateY(-1px); box-shadow: 0 14px 32px rgba(30,64,175,0.45) !important; }
        .login-demo:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(15,23,42,0.08); }
        .login-eye:hover { color: #1e40af; background: #eff6ff; }
        .login-left-deco { position: absolute; border-radius: 50%; pointer-events: none; }

        @media (max-width: 1280px) {
          .login-left  { padding: 32px 36px !important; }
          .login-right { padding: 32px 28px !important; }
          .login-hero-title { font-size: 42px !important; }
          .login-hero { margin-top: 56px !important; }
          .login-stats-grid { margin-top: 32px !important; }
        }
        @media (max-width: 1100px) {
          .login-hero-title { font-size: 38px !important; }
          .login-stat-val   { font-size: 20px !important; }
          .login-stat-card  { padding: 14px 14px !important; }
        }
        @media (max-width: 980px) {
          .login-left  { padding: 28px 28px !important; }
          .login-hero  { display: none !important; }
          .login-testimonial { display: none !important; }
          .login-stats-grid { margin-top: auto !important; }
        }
        @media (max-width: 768px) {
          .login-left  { display: none !important; }
          .login-right { flex: 1 1 100% !important; padding: 28px 22px !important; }
        }
        @media (max-width: 480px) {
          .login-right        { padding: 22px 18px !important; }
          .login-form-wrap    { max-width: 100% !important; }
          .login-form-title   { font-size: 26px !important; }
          .login-form-sub     { font-size: 14px !important; }
          .login-input        { height: 46px !important; font-size: 13.5px !important; }
          .login-submit       { height: 48px !important; font-size: 14.5px !important; }
          .login-demo-email   { font-size: 11px !important; }
        }
        @media (max-width: 360px) {
          .login-right        { padding: 18px 14px !important; }
          .login-form-title   { font-size: 23px !important; }
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .login-left-deco:nth-of-type(1),
          .login-left-deco:nth-of-type(3) { display: none !important; }
        }
      `}</style>

      <div className="login-root" style={S.root}>
        {/* ───────── LEFT PANEL ───────── */}
        <aside className="login-left" style={S.left}>
          <div className="login-left-deco" style={S.deco1} />
          <div className="login-left-deco" style={S.deco2} />
          <div className="login-left-deco" style={S.deco3} />

          {/* Logo */}
          <div style={S.logoRow}>
            <div style={S.logoBox}>
              {!logoError && logoSrc ? (
                <img src={logoSrc} alt="logo" style={S.logoImg} onError={() => setLogoError(true)} />
              ) : (
                <span style={S.logoFallback}>CĐ</span>
              )}
            </div>
            <div>
              <div style={S.logoTitle}>Đồ Án Tốt Nghiệp</div>
              <div style={S.logoSub}>Trường Cao đẳng Công nghiệp Cao Đồng An</div>
            </div>
          </div>

          {/* Hero */}
          <div className="login-hero" style={S.hero}>
            <h1 className="login-hero-title" style={S.heroTitle}>
              Quản Lý<br />
              <span style={S.heroAccent}>Xuất — Nhập — Tồn</span>
            </h1>
            <p style={S.heroDesc}>
              Hệ thống quản lý kho hàng thông minh, theo dõi xuất nhập tồn theo
              thời gian thực với phân quyền linh hoạt cho doanh nghiệp.
            </p>
          </div>

          {/* Stats */}
          <div className="login-stats-grid" style={S.statsGrid}>
            {[
              { icon: 'ri-shield-check-line',  val: '99.9%',   lbl: 'Độ ổn định' },
              { icon: 'ri-user-settings-line', val: '5 cấp',   lbl: 'Phân quyền' },
              { icon: 'ri-database-2-line',    val: 'Realtime', lbl: 'Cập nhật'  },
            ].map(s => (
              <div key={s.val} className="login-stat-card" style={S.statCard}>
                <div style={S.statIcon}><i className={s.icon} /></div>
                <div className="login-stat-val" style={S.statVal}>{s.val}</div>
                <div style={S.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="login-testimonial" style={S.testi}>
            <div style={S.testiAvatar}><i className="ri-user-smile-line" style={{ fontSize: 22 }} /></div>
            <div style={S.testiBody}>
              <div style={S.testiHead}>
                <div>
                  <div style={S.testiName}>Nguyễn Văn An</div>
                  <div style={S.testiRole}>Admin · Ban Giám Đốc</div>
                </div>
                <div style={S.testiStars}>
                  {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill" />)}
                </div>
              </div>
              <div style={S.testiQuote}>
                "Hệ thống giúp chúng tôi kiểm soát kho hàng chính xác hơn 90%, tiết kiệm nhiều giờ làm việc mỗi ngày."
              </div>
            </div>
          </div>
        </aside>

        {/* ───────── RIGHT PANEL ───────── */}
        <main className="login-right" style={S.right}>
          <div className="login-form-wrap" style={S.formWrap}>

            <div style={S.formHead}>
              <h2 className="login-form-title" style={S.formTitle}>Chào mừng trở lại! 👋</h2>
              <p className="login-form-sub" style={S.formSub}>Đăng nhập để tiếp tục quản lý kho hàng</p>
            </div>

            <form onSubmit={handleLogin} style={S.form}>
              {/* Email */}
              <div>
                <label style={S.label}>Email</label>
                <div style={S.inputWrap}>
                  <i className="ri-mail-line" style={S.inputIcon} />
                  <input
                    className="login-input login-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@company.vn"
                    required
                    style={S.input}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={S.label}>Mật khẩu</label>
                <div style={S.inputWrap}>
                  <i className="ri-lock-line" style={S.inputIcon} />
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    style={S.input}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPass(p => !p)}
                    style={S.eyeBtn}
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" style={S.submit}>
                Đăng nhập
                <i className="ri-arrow-right-line" style={{ marginLeft: 8, fontSize: 18 }} />
              </button>
            </form>

            <div style={S.divider}>
              <span style={S.dividerText}>Hoặc chọn nhanh tài khoản demo</span>
            </div>

            <div style={S.demoList}>
              {demoAccounts.map(a => (
                <button
                  key={a.email}
                  type="button"
                  className="login-demo"
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  style={{ ...S.demoBtn, background: a.accent, borderColor: a.border }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <i className={a.icon} style={{ color: a.text, fontSize: 16 }} />
                    <span style={{ color: a.text, fontWeight: 700, fontSize: 14 }}>{a.role}</span>
                  </span>
                  <span className="login-demo-email" style={S.demoEmail}>{a.email}</span>
                </button>
              ))}
            </div>

            <div style={S.footer}>
              © 2026 Đồ Án Tốt Nghiệp — Khoa CNTT
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
  },

  // ── LEFT ──
  left: {
    position: 'relative',
    overflow: 'hidden',
    flex: '1 1 50%',
    background: 'linear-gradient(160deg, #0c1e3e 0%, #1e3a8a 45%, #1e40af 80%, #0ea5e9 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 48px',
  },

  // Decorative circles
  deco1: {
    width: 420, height: 420,
    top: -140, right: -120,
    background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
  },
  deco2: {
    width: 280, height: 280,
    bottom: -80, left: -60,
    background: 'radial-gradient(circle, rgba(14,165,233,0.30) 0%, transparent 70%)',
  },
  deco3: {
    width: 200, height: 200,
    top: '40%', right: '15%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.20) 0%, transparent 70%)',
  },

  // Logo
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    position: 'relative', zIndex: 2,
  },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    background: '#fff',
    boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
    display: 'grid', placeItems: 'center',
    overflow: 'hidden', flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)',
  },
  logoImg: { width: '88%', height: '88%', objectFit: 'contain', display: 'block' },
  logoFallback: {
    fontSize: 16, fontWeight: 900, color: '#1e3a8a',
    letterSpacing: 0.5,
  },
  logoTitle: { fontSize: 18, fontWeight: 800, letterSpacing: 0.3, color: '#fff' },
  logoSub:   { fontSize: 13, opacity: 0.75, marginTop: 3, color: '#dbeafe' },

  // Hero
  hero: { marginTop: 72, maxWidth: 520, position: 'relative', zIndex: 2 },
  heroTitle: {
    margin: 0, fontSize: 48, lineHeight: 1.1, fontWeight: 900,
    color: '#fff', letterSpacing: -0.5,
  },
  heroAccent: {
    color: '#7dd3fc',
    textShadow: '0 0 32px rgba(125,211,252,0.4)',
  },
  heroDesc: {
    margin: '20px 0 0', fontSize: 16, lineHeight: 1.65,
    color: 'rgba(219,234,254,0.85)', maxWidth: 460,
  },

  // Stats
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14, marginTop: 40, position: 'relative', zIndex: 2,
  },
  statCard: {
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16, padding: '16px 18px',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 9,
    background: 'rgba(125,211,252,0.25)',
    display: 'grid', placeItems: 'center',
    color: '#7dd3fc', fontSize: 17, marginBottom: 12,
  },
  statVal: { fontSize: 22, fontWeight: 800, color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(219,234,254,0.7)', marginTop: 3 },

  // Testimonial
  testi: {
    marginTop: 'auto', position: 'relative', zIndex: 2,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 18, padding: 18,
    display: 'flex', gap: 14, alignItems: 'flex-start',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  testiAvatar: {
    width: 46, height: 46, borderRadius: '50%',
    background: 'rgba(125,211,252,0.30)',
    display: 'grid', placeItems: 'center',
    color: '#7dd3fc', flexShrink: 0,
  },
  testiBody: { flex: 1 },
  testiHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  testiName: { fontWeight: 700, fontSize: 14, color: '#fff' },
  testiRole: { fontSize: 12, color: 'rgba(219,234,254,0.7)', marginTop: 2 },
  testiStars: { display: 'flex', gap: 2, color: '#fbbf24', fontSize: 13 },
  testiQuote: { marginTop: 10, fontSize: 13, lineHeight: 1.65, color: 'rgba(219,234,254,0.85)', fontStyle: 'italic' },

  // ── RIGHT ──
  right: {
    flex: '1 1 50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 32px',
    background: '#f8fafc',
    overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 440 },

  formHead: { marginBottom: 32 },
  formTitle: { margin: 0, fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: -0.4 },
  formSub:   { margin: '8px 0 0', color: '#64748b', fontSize: 15 },

  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' },

  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: '#94a3b8', fontSize: 17, pointerEvents: 'none',
  },
  input: {
    width: '100%', height: 48, padding: '0 46px 0 42px',
    borderRadius: 11, border: '1.5px solid #e2e8f0',
    outline: 'none', background: '#fff', color: '#0f172a',
    fontSize: 14, boxSizing: 'border-box',
    transition: 'border-color 200ms, box-shadow 200ms',
  },
  eyeBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    border: 'none', background: 'transparent', color: '#64748b',
    width: 34, height: 34, borderRadius: 8,
    display: 'grid', placeItems: 'center', cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },

  submit: {
    height: 50, marginTop: 6, border: 'none', borderRadius: 12,
    background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', letterSpacing: 0.3,
    boxShadow: '0 10px 28px rgba(30,58,138,0.35)',
    transition: 'transform 150ms, box-shadow 150ms',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  divider: {
    display: 'flex', alignItems: 'center', margin: '28px 0 14px', gap: 12,
  },
  dividerText: {
    fontSize: 12, color: '#94a3b8', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  demoList: { display: 'flex', flexDirection: 'column', gap: 9 },
  demoBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', borderRadius: 12,
    border: '1px solid', padding: '12px 14px',
    fontSize: 13, cursor: 'pointer', textAlign: 'left',
    transition: 'transform 150ms, box-shadow 150ms',
  },
  demoEmail: { color: '#475569', fontWeight: 600, fontSize: 12 },

  footer: { marginTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 },
};

`

## === FILE: D:\Doan_5\frontend\src\layouts\MainLayout.jsx ===
`jsx
import { useState, useMemo, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../config/menuConfig';
import 'remixicon/fonts/remixicon.css';

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

const roleNames = { 1: 'Admin', 2: 'Sales', 3: 'Logistics', 4: 'Kho', 5: 'Nhà máy' };
function getRoleLabel(user) {
  return user?.role_name || roleNames[user?.role_id] || 'Người dùng';
}

function safeParseUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getMode(width) {
  if (width <= 768) return 'mobile';
  if (width <= 1100) return 'tablet';
  return 'desktop';
}

const SIDEBAR_FULL = 210;
const SIDEBAR_ICON = 56;

// Dashboard paths theo role — chỉ hiện 1 cái phù hợp
const DASHBOARD_ITEMS = [
  { path: '/admin-dashboard',     title: 'Dashboard',       icon: 'ri-dashboard-line',       roles: [1] },
  { path: '/sales-dashboard',     title: 'Dashboard Sales', icon: 'ri-line-chart-line',      roles: [2] },
  { path: '/logistics',           title: 'Dashboard GT',    icon: 'ri-truck-line',           roles: [3] },
  { path: '/warehouse-dashboard', title: 'Dashboard Kho',   icon: 'ri-archive-line',         roles: [4] },
  { path: '/factory-dashboard',   title: 'Dashboard NM',    icon: 'ri-building-4-line',      roles: [5] },
];


export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Normalize role_id to number so role checks work regardless of how it was stored
      if (parsed && typeof parsed.role_id === 'string') {
        parsed.role_id = Number(parsed.role_id);
      }
      return parsed;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mode = getMode(width);
  const isMobile = mode === 'mobile';
  const isTablet = mode === 'tablet';
  const isDesktop = mode === 'desktop';

  const sidebarWidth = isMobile ? SIDEBAR_FULL : isTablet ? SIDEBAR_ICON : collapsed ? SIDEBAR_ICON : SIDEBAR_FULL;
  const paddingLeft = isMobile ? 0 : sidebarWidth;
  const sidebarTranslateX = isMobile && !mobileOpen ? '-100%' : '0';

  const hasPermission = (item) => !item.roles || item.roles.includes(user?.role_id);
  const visibleMenus = MENU_ITEMS.filter(hasPermission);

  // Phân loại menu: dashboard / top-level / kho-group
  const myDashboardItem = DASHBOARD_ITEMS.find(item => item.roles.includes(user?.role_id));
  const activePath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  // groupParent = null → top-level; groupParent = path → thuộc Kho group
  const khoGroupPaths = new Set(
    MENU_ITEMS.filter(m => m.groupParent === '/receipts').map(m => m.path)
  );

  const topLevelItems = visibleMenus.filter(m => !m.groupParent);
  const khoGroupItems = visibleMenus.filter(m => m.groupParent === '/receipts');
  const showKhoGroup = khoGroupItems.length > 0;

  const closeMobile = () => setMobileOpen(false);
  const showLabels = !(isTablet || (isDesktop && collapsed));

  const renderNavLink = (item) => {
    const isActive = activePath === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobile}
        title={showLabels ? undefined : item.name}
        className="ml-nav-item"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
          gap: showLabels ? 8 : 0, padding: showLabels ? '8px 10px' : '8px 0',
          borderRadius: 7, textDecoration: 'none', color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
          background: isActive ? '#1d4ed8' : 'transparent', transition: 'all 150ms ease',
          fontSize: 12.5, fontWeight: 500,
        }}
        onMouseEnter={(e) => { if (isActive) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { if (isActive) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <i className={item.icon} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
        {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
      </Link>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100dvh', width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .ml-nav-scroll::-webkit-scrollbar { display: none; }
        .ml-nav-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .ml-sidebar {
          position: fixed; top: 0; left: 0; height: 100dvh;
          background: #0f1e3d; color: #fff;
          display: flex; flex-direction: column;
          box-shadow: 2px 0 16px rgba(0,0,0,0.25);
          z-index: 50; transition: width 280ms ease, transform 280ms ease;
          overflow: hidden;
        }
        .ml-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.5);
          z-index: 40; opacity: 0; pointer-events: none; transition: opacity 280ms ease;
        }
        .ml-overlay.open { opacity: 1; pointer-events: auto; }
      `}</style>

      <div className={`ml-overlay${mobileOpen ? ' open' : ''}`} onClick={closeMobile} />

      <aside className="ml-sidebar" style={{ width: sidebarWidth, transform: `translateX(${sidebarTranslateX})` }}>
        {/* Logo */}
        <div style={{ padding: '12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7, minHeight: 50 }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {showLabels && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>STEEL STOCK</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quản lý kho</div>
            </div>
          )}
        </div>

        {/* User info */}
          {showLabels && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(37,99,235,0.25)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=1d4ed8&color=fff&bold=true&size=28`}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{user?.full_name || 'Người dùng'}</div>
                <div style={{ fontSize: 10, color: '#60a5fa' }}>{getRoleLabel(user)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="ml-nav-scroll" style={{ flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', overflow: 'hidden', minWidth: 0 }}>

          {/* Dashboard */}
          {myDashboardItem && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {showLabels && (
                <div style={{ width: '100%', padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', overflow: 'hidden' }}>
                  Dashboard
                </div>
              )}
              <Link
                key={myDashboardItem.path}
                to={myDashboardItem.path}
                onClick={closeMobile}
                title={myDashboardItem.title}
                className="ml-nav-item"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
                  gap: 8, padding: showLabels ? '7px 10px' : '10px 0',
                  borderRadius: 7, textDecoration: 'none', width: '100%',
                  color: activePath === myDashboardItem.path ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: activePath === myDashboardItem.path ? '#1d4ed8' : 'transparent',
                  transition: 'all 150ms ease', fontSize: 12.5, fontWeight: activePath === myDashboardItem.path ? 600 : 500,
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => { if (activePath === myDashboardItem.path) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { if (activePath === myDashboardItem.path) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <i className={myDashboardItem.icon} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
                {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myDashboardItem.title}</span>}
              </Link>
            </div>
          )}

          {/* Quản lý Tài khoản */}
          {topLevelItems.filter(m => m.path === '/accounts').map(renderNavLink)}

          {/* Quản lý Khách hàng */}
          {topLevelItems.filter(m => m.path === '/customers').map(renderNavLink)}

          {/* Quản lý Kho */}
          {topLevelItems.filter(m => m.path === '/products').map(renderNavLink)}

          {/* Kho group */}
          {showKhoGroup && (
            <>
              {showLabels && (
                <div style={{ marginTop: 4, padding: '8px 10px 2px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, textTransform: 'uppercase', overflow: 'hidden' }}>
                  Kho
                </div>
              )}
              {/* indent items */}
              {khoGroupItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  title={showLabels ? undefined : item.name}
                  className="ml-nav-item"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
                    gap: showLabels ? 8 : 0, padding: showLabels ? '7px 10px 7px 28px' : '8px 0',
                    borderRadius: 7, textDecoration: 'none',
                    color: activePath === item.path ? '#fff' : 'rgba(255,255,255,0.5)',
                    background: activePath === item.path ? 'rgba(37,99,235,0.3)' : 'transparent',
                    transition: 'all 150ms ease', fontSize: 12, fontWeight: activePath === item.path ? 600 : 400,
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { if (activePath === item.path) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { if (activePath === item.path) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }} />
                  {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          {/* Quản lý Đơn hàng */}
          {topLevelItems.filter(m => m.path === '/sales-orders').map(renderNavLink)}

          {/* Báo cáo */}
          {topLevelItems.filter(m => m.path === '/reports').map(renderNavLink)}
        </nav>

        {/* Bottom: logout + collapse */}
        <div style={{ padding: '6px 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={handleLogout}
            title={showLabels ? undefined : 'Đăng xuất'}
            style={{
              width: '100%', height: 34, border: 'none', borderRadius: 7,
              cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center',
              justifyContent: showLabels ? 'flex-start' : 'center',
              gap: 8, paddingLeft: showLabels ? 10 : 0,
              transition: 'background 150ms, color 150ms',
              fontSize: 11, fontWeight: 500, overflow: 'hidden',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgba(239,68,68,0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <i className="ri-logout-box-r-line" style={{ fontSize: 15, flexShrink: 0 }} />
            {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Đăng xuất</span>}
          </button>

          {isDesktop && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
              style={{
                width: '100%', height: 34, border: 'none', borderRadius: 7,
                cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center',
                justifyContent: showLabels ? 'flex-start' : 'center',
                gap: 8, paddingLeft: showLabels ? 10 : 0, marginTop: 2,
                transition: 'background 150ms, color 150ms',
                fontSize: 11, fontWeight: 500, overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <i className={collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} style={{ fontSize: 15, flexShrink: 0 }} />
              {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{collapsed ? 'Mở rộng' : 'Thu gọn'}</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: paddingLeft, minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'margin-left 280ms ease' }}>
        <header
          style={{
            height: 64, flexShrink: 0, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            boxShadow: '0 2px 18px rgba(37,99,235,0.06)',
            borderBottom: '1.5px solid #e0e7ff', position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  border: 'none', background: '#eff6ff', color: '#1d4ed8',
                  width: 36, height: 36, borderRadius: 10,
                  display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <i className="ri-menu-line" style={{ fontSize: 18 }} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, minWidth: 0 }}>
              {myDashboardItem && (
                <Link to={myDashboardItem.path} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>
                  <i className="ri-dashboard-line" style={{ marginRight: 4 }} />{myDashboardItem.title}
                </Link>
              )}
              {activePath !== '/' && activePath !== (myDashboardItem?.path?.replace(/^\//, '') || '') && (
                <>
                  <i className="ri-arrow-right-s-line" style={{ color: '#cbd5e1' }} />
                  <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {MENU_ITEMS.find(m => m.path === activePath)?.name || MENU_ITEMS.find(m => m.path === `/${location.pathname.split('/')[1]}`)?.name || 'Trang'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowUserMenu((p) => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderWidth: '1px', borderStyle: 'solid', borderColor: '#e0e7ff', background: '#fff', borderRadius: 999,
              padding: isMobile ? '3px 7px 3px 3px' : '6px 10px 6px 6px', cursor: 'pointer',
            }}>
              <div style={{
                width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
                fontSize: isMobile ? 10 : 12,
              }}>
                {user?.full_name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>
              {!isMobile && <span style={{ fontWeight: 600, color: '#0f172a' }}>{user?.full_name || 'Người dùng'}</span>}
              <i className="ri-arrow-down-s-line" style={{ color: '#94a3b8', fontSize: isMobile ? 15 : 16 }} />
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', right: 0, top: isMobile ? 48 : 50,
                width: 180, background: '#fff', borderRadius: 14,
                boxShadow: '0 18px 32px rgba(37,99,235,0.12)',
                border: '1px solid #e0e7ff', padding: 8, zIndex: 60,
              }}>
                <div style={{ padding: '8px 12px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                  {getRoleLabel(user)}
                </div>
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#f1f5fb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\AdminDashboardPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from 'recharts';
import api from '../services/api';
import { exportAdminDashboard } from '../utils/excelExport';

const BLUE   = '#2563eb';
const GREEN  = '#10b981';
const PURPLE = '#7c3aed';
const ORANGE = '#f59e0b';
const RED    = '#ef4444';
const CYAN   = '#06b6d4';
const PINK   = '#ec4899';

const PIE_COLORS = [BLUE, GREEN, PURPLE, ORANGE, RED, CYAN, PINK, '#0ea5e9', '#8b5cf6', '#22c55e'];

const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };
const fmtMonth = (v) => {
  if (!v) return '--';
  const m = String(v).slice(0, 7);
  const d = new Date(`${m}-01`);
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
};

const STATUS_LABELS = {
  pending: 'Chờ duyệt',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  returned: 'Hoàn trả',
  canceled: 'Đã hủy',
  return_pending: 'Chờ hoàn',
  return_to_sales: 'Hoàn về Sales',
  logistics_review: 'Kho báo lỗi',
  customer_rejected: 'Khách từ chối',
  warehouse_processing: 'Kho đang xuất',
  waiting_sales: 'Chờ Sales xử lý',
  return_completed: 'Hoàn xong',
};
const STATUS_COLORS = {
  pending: '#f59e0b',
  shipping: '#7c3aed',
  completed: '#10b981',
  returned: '#f97316',
  canceled: '#ef4444',
  return_pending: '#dc2626',
  return_to_sales: '#a16207',
  logistics_review: '#9333ea',
  customer_rejected: '#be123c',
  warehouse_processing: '#0ea5e9',
  waiting_sales: '#facc15',
  return_completed: '#059669',
};

const PERIODS = [
  { value: 'day',     label: 'Hôm nay' },
  { value: 'month',   label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'all',     label: 'Tất cả' },
];

function cardStyle(hovered, accent = BLUE) {
  return {
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}22` : '0 8px 22px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
  };
}

function KPI({ label, value, sub, accent, icon, onMouseEnter, onMouseLeave, hovered }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...cardStyle(hovered, accent),
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: `${accent}15`, opacity: 0.7 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 17, boxShadow: `0 4px 12px ${accent}33` }}>
            <i className={icon} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, accent, children, action }) {
  return (
    <div style={cardStyle(false, accent)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Không thể tải dữ liệu dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const s = data?.summary || {};
  const recentOrders  = Array.isArray(data?.tables?.recent_orders)  ? data.tables.recent_orders  : [];
  const topProducts   = Array.isArray(data?.tables?.top_products)   ? data.tables.top_products   : [];
  const topCustomers  = Array.isArray(data?.tables?.top_customers)  ? data.tables.top_customers  : [];
  const whUtil        = Array.isArray(data?.tables?.warehouse_utilization) ? data.tables.warehouse_utilization : [];
  const returnStats   = Array.isArray(data?.tables?.return_stats)   ? data.tables.return_stats   : [];

  const revDayData     = (data?.charts?.revenue_by_day     || []).map(r => ({ name: fmtDate(r.date), value: Number(r.revenue || 0) }));
  const ordDayData     = (data?.charts?.orders_by_day      || []).map(r => ({ name: fmtDate(r.date), value: Number(r.orders || 0) }));
  const revMonthData   = (data?.charts?.revenue_by_month   || []).map(r => ({ name: fmtMonth(r.period), value: Number(r.revenue || 0), orders: Number(r.orders || 0) }));
  const ordersByStatus = (data?.charts?.orders_by_status   || []).map(r => ({ name: STATUS_LABELS[r.status] || r.status, value: Number(r.count || 0), revenue: Number(r.revenue || 0), status: r.status }));
  const ordersByCategory = (data?.charts?.orders_by_category || []).map(r => ({ name: r.name || 'Khác', value: Number(r.revenue || 0), qty: Number(r.qty || 0), orders: Number(r.orders || 0) }));
  const revByCarrier   = (data?.charts?.revenue_by_carrier || []).map(r => ({ name: r.name, value: Number(r.shipments || 0), revenue: Number(r.revenue || 0) }));
  const returnReasons  = (data?.charts?.return_reasons     || []).map(r => ({ name: r.reason || 'Khác', value: Number(r.count || 0) }));

  // Tính % hoàn thành
  const completionRate = s.total_orders > 0 ? Math.round((s.completed_orders / s.total_orders) * 100) : 0;

  // Combine day data thành 1 chart (revenue + orders)
  const dayLabels = useMemo(() => {
    const map = new Map();
    revDayData.forEach(r => map.set(r.name, { name: r.name, revenue: r.value, orders: 0 }));
    ordDayData.forEach(r => {
      if (!map.has(r.name)) map.set(r.name, { name: r.name, revenue: 0, orders: r.value });
      else map.get(r.name).orders = r.value;
    });
    return Array.from(map.values()).sort((a, b) => {
      const da = a.name.split('/').reverse().join('-');
      const db = b.name.split('/').reverse().join('-');
      return da.localeCompare(db);
    });
  }, [revDayData, ordDayData]);

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải dữ liệu...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff, #f0f4ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .db-tab { transition: all 180ms ease; }
        .db-tab:hover { transform: translateY(-1px); }
        .db-row:hover { background: #f8fafc; }
        @media (max-width: 1100px) {
          .db-grid-kpi { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 900px) {
          .db-grid-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .db-grid-2   { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .db-grid-kpi { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            <i className="ri-dashboard-3-line" style={{ marginRight: 10, color: BLUE }} />Dashboard Tổng quan
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Chu kỳ: <strong style={{ color: BLUE }}>{data?.period || 'Tất cả'}</strong> • Cập nhật theo thời gian thực
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              className="db-tab"
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${period === p.value ? BLUE : '#dbe3ee'}`,
                background: period === p.value ? BLUE : '#fff',
                color: period === p.value ? '#fff' : '#475569',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
                boxShadow: period === p.value ? `0 6px 14px ${BLUE}33` : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            className="db-tab"
            onClick={() => data && exportAdminDashboard(data)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid #dbe3ee',
              background: '#fff', color: GREEN, fontWeight: 700, cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 10px rgba(16,185,129,0.15)',
            }}
          >
            <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />Xuất Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, marginBottom: 14 }}>
          <i className="ri-error-warning-line" style={{ marginRight: 8 }} />{error}
        </div>
      )}

      {/* KPI Grid - 8 cards */}
      <div
        className="db-grid-kpi"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14, marginBottom: 18,
        }}
      >
        <KPI label="Tổng doanh thu"  value={`${fmtCurrency(s.total_revenue)} đ`}  sub={`${s.completed_orders || 0} đơn hoàn thành`} accent={BLUE}   icon="ri-money-cny-circle-line" hovered={hover === 'r'} onMouseEnter={() => setHover('r')} onMouseLeave={() => setHover(null)} />
        <KPI label="Đơn hàng"         value={`${s.total_orders || 0}`}            sub={`${completionRate}% hoàn thành`}               accent={GREEN}  icon="ri-shopping-bag-3-line"   hovered={hover === 'o'} onMouseEnter={() => setHover('o')} onMouseLeave={() => setHover(null)} />
        <KPI label="Đơn chờ xử lý"    value={`${s.pending_orders || 0}`}          sub="Cần theo dõi"                                  accent={ORANGE} icon="ri-time-line"            hovered={hover === 'p'} onMouseEnter={() => setHover('p')} onMouseLeave={() => setHover(null)} />
        <KPI label="Tồn kho thấp"     value={`${s.low_stock_count || 0}`}         sub="SP dưới định mức"                              accent={RED}    icon="ri-alert-line"           hovered={hover === 'l'} onMouseEnter={() => setHover('l')} onMouseLeave={() => setHover(null)} />
        <KPI label="Phiếu nhập"        value={`${s.total_receipts || 0}`}         sub="Từ nhà máy"                                    accent={CYAN}   icon="ri-inbox-archive-line"   hovered={hover === 'rc'} onMouseEnter={() => setHover('rc')} onMouseLeave={() => setHover(null)} />
        <KPI label="Phiếu xuất"        value={`${s.total_outbounds || 0}`}        sub={`${s.outbound_pending || 0} chờ xử lý`}        accent={PURPLE} icon="ri-send-plane-line"      hovered={hover === 'ob'} onMouseEnter={() => setHover('ob')} onMouseLeave={() => setHover(null)} />
        <KPI label="Yêu cầu hoàn"     value={`${s.return_pending || 0}`}         sub="Đang chờ xử lý"                                accent={PINK}   icon="ri-arrow-go-back-line"   hovered={hover === 'rt'} onMouseEnter={() => setHover('rt')} onMouseLeave={() => setHover(null)} />
        <KPI label="Khách hàng"        value={`${s.total_customers || 0}`}        sub={`${s.total_users || 0} người dùng`}            accent="#0d9488" icon="ri-team-line"           hovered={hover === 'c'} onMouseEnter={() => setHover('c')} onMouseLeave={() => setHover(null)} />
      </div>

      {/* Row 1: Doanh thu & đơn hàng theo ngày (Area+Line combo) */}
      <ChartCard
        title="Xu hướng doanh thu & đơn hàng theo ngày"
        subtitle="Kết hợp doanh thu (vùng) + số đơn (đường)"
        accent={BLUE}
        action={<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{dayLabels.length} ngày</span>}
      >
        {dayLabels.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dayLabels}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${(v/1000000).toFixed(1)}tr`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(v, n) => n === 'Doanh thu' ? [`${fmtCurrency(v)} đ`, n] : [v, n]}
                labelStyle={{ fontWeight: 700 }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left"  type="monotone" dataKey="revenue" name="Doanh thu" stroke={BLUE} strokeWidth={2.5} fill="url(#gradRev)" />
              <Line yAxisId="right" type="monotone" dataKey="orders"   name="Số đơn"   stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
      </ChartCard>

      {/* Row 2: 12-month trend (full width) */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <ChartCard
          title="Doanh thu 12 tháng gần nhất"
          subtitle="Tổng quan tăng trưởng dài hạn"
          accent={PURPLE}
        >
          {revMonthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revMonthData} barCategoryGap={20}>
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${(v/1000000).toFixed(0)}tr`} />
                <Tooltip formatter={v => [`${fmtCurrency(v)} đ`, 'Doanh thu']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill="url(#gradBar)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 3: 2 columns - Trạng thái đơn (donut) + Doanh thu theo danh mục (pie) */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Phân bổ đơn hàng theo trạng thái" subtitle="Tỷ lệ các trạng thái đơn" accent={GREEN}>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                  {ordersByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v} đơn`, p.payload.name]} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>

        <ChartCard title="Doanh thu theo danh mục sản phẩm" subtitle="Phân bổ doanh thu" accent={ORANGE}>
          {ordersByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ordersByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                  {ordersByCategory.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${fmtCurrency(v)} đ`, n]} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 4: 2 columns - Phân bổ tồn kho (bar ngang) + Đơn vị vận chuyển (bar) */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Phân bổ tồn kho theo kho" subtitle="Số lượng sản phẩm" accent={CYAN}>
          {whUtil.length > 0 ? (() => {
            const maxQty = Math.max(...whUtil.map(w => Number(w.total_qty) || 0), 1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whUtil.map((w, i) => {
                  const qty = Number(w.total_qty) || 0;
                  const pct = Math.round((qty / maxQty) * 100);
                  return (
                    <div key={w.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{w.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{Number(w.product_count).toLocaleString()} SKU</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: CYAN }}>{qty.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{ background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}aa)`, height: '100%', width: `${pct}%`, transition: 'width 800ms ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>

        <ChartCard title="Đơn vị vận chuyển" subtitle="Số chuyến đã giao" accent={PINK}>
          {revByCarrier.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revByCarrier} layout="vertical" barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e7ff" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                <Tooltip formatter={(v) => [`${v} chuyến`, 'Số lượng']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill={PINK} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 5: 2 columns - Đơn hàng gần nhất + Top sản phẩm */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Đơn hàng gần nhất" subtitle={`${recentOrders.length} đơn mới nhất`} accent={BLUE}>
          {recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #e0e7ff' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left' }}>Mã đơn</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Khách hàng</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>SP</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="db-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 0', fontWeight: 700, color: BLUE, fontSize: 13 }}>{o.order_no}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, color: '#334155' }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, textAlign: 'center', fontWeight: 700 }}>{o.item_count || 0}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: GREEN }}>{fmtCurrency(o.total_amount)} đ</td>
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: `${STATUS_COLORS[o.status] || '#64748b'}22`,
                          color: STATUS_COLORS[o.status] || '#334155',
                        }}>{STATUS_LABELS[o.status] || o.status}</span>
                      </td>
                      <td style={{ padding: '9px 0', fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top sản phẩm bán chạy" subtitle="Theo số lượng bán" accent={PURPLE}>
          {topProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={p.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}88)`, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.sku} • {p.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: BLUE, fontSize: 13 }}>{fmtCurrency(p.total_revenue)} đ</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{Number(p.total_qty || 0).toLocaleString()} SP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 6: Top khách hàng + Lý do hoàn trả */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ChartCard title="Top khách hàng" subtitle="Theo tổng chi tiêu" accent={GREEN}>
          {topCustomers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {topCustomers.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: i % 2 === 0 ? '#f8fafc' : '#fff', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: GREEN, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{fmtCurrency(c.total_spent)} đ</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.orders} đơn</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Lý do hoàn trả" subtitle="Phân tích nguyên nhân" accent={RED}>
          {returnReasons.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={returnReasons} layout="vertical" barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e7ff" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                <Tooltip formatter={(v) => [`${v} phiếu`, 'Số lượng']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill={RED} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\MyDashboardPage.jsx ===
`jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const BLUE = '#2563eb';
const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };

function cardStyle(hovered, accent = BLUE) {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function SalesDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const recentOrders = Array.isArray(data?.tables?.recent_orders) ? data.tables.recent_orders : [];
  const topProducts = Array.isArray(data?.tables?.top_products) ? data.tables.top_products : [];
  const revData = (data?.charts?.revenue_by_day || []).map(r => ({ ...r, revenue: Number(r.revenue || 0), name: r.date }));

  const completionRate = s.total_orders > 0 ? Math.round((s.completed_orders / s.total_orders) * 100) : 0;

  const stats = [
    { key: 'revenue',    label: 'Doanh thu',        value: `${fmtCurrency(s.total_revenue)} đ`,   accent: '#2563eb', icon: 'ri-line-chart-line' },
    { key: 'orders',     label: 'Tổng đơn',          value: s.total_orders || 0,                   accent: '#0ea5e9', icon: 'ri-shopping-bag-3-line' },
    { key: 'completed',  label: 'Đơn hoàn tất',      value: `${s.completed_orders || 0} (${completionRate}%)`, accent: '#10b981', icon: 'ri-checkbox-circle-line' },
    { key: 'pending',    label: 'Đơn đang chờ',      value: s.pending_orders || 0,                 accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'customers',  label: 'Khách hàng',        value: s.total_customers || 0,                accent: '#7c3aed', icon: 'ri-team-line' },
    { key: 'avgValue',   label: 'Giá TB/đơn',       value: `${fmtCurrency(s.avg_order_value)} đ`, accent: '#059669', icon: 'ri-calculator-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff, #f0f4ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Sales — {user.full_name || 'Tôi'}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? BLUE : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map(st => (
          <div key={st.key} onMouseEnter={() => setHover(st.key)} onMouseLeave={() => setHover(null)} style={cardStyle(hover === st.key, st.accent)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: st.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                <i className={st.icon} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, BLUE)}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Doanh thu theo ngày</h3>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revData} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v/1000000}tr`} />
                <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#10b981')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{fmtCurrency(p.total_revenue)} đ</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.total_qty || 0} SL</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      <div style={cardStyle(false, '#7c3aed')}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Đơn hàng gần đây</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Mã đơn</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Khách hàng</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Trạng thái</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Ngày tạo</th>
          </tr></thead>
          <tbody>
            {recentOrders.length === 0 ? <tr><td colSpan="4" style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn hàng</td></tr> :
              recentOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 0', fontWeight: 700, color: BLUE }}>{o.order_no}</td>
                  <td style={{ fontSize: 13 }}>{o.customer_name || '—'}</td>
                  <td style={{ fontSize: 12, padding: '9px 0' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: o.status === 'completed' ? '#d1fae5' : '#fef3c7', color: o.status === 'completed' ? '#047857' : '#92400e', fontWeight: 700 }}>{o.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(o.created_at)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\FactoryDashboardPage.jsx ===
`jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];

function cardStyle(hovered, accent = '#2563eb') {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function FactoryDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reports/dashboard?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        const json = await res.json();
        setData(json);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const pendingReceipts = Array.isArray(data?.tables?.pending_receipts) ? data.tables.pending_receipts : [];
  const pendingComps = Array.isArray(data?.tables?.pending_compensations) ? data.tables.pending_compensations : [];
  const recData = (data?.charts?.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));
  const receiptStats = Array.isArray(data?.tables?.receipt_stats) ? data.tables.receipt_stats : [];
  const compStats = Array.isArray(data?.tables?.compensation_stats) ? data.tables.compensation_stats : [];

  const stats = [
    { key: 'receipts',       label: 'Phiếu nhập',        value: s.total_receipts || 0,                accent: '#2563eb', icon: 'ri-inbox-archive-line' },
    { key: 'pendingRec',     label: 'Chờ duyệt nhập',    value: s.pending_receipts || 0,              accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'completedRec',   label: 'Đã nhập',          value: s.completed_receipts || 0,            accent: '#10b981', icon: 'ri-check-line' },
    { key: 'compensations',  label: 'Phiếu bù',         value: s.total_compensations || 0,           accent: '#7c3aed', icon: 'ri-file-list-3-line' },
    { key: 'pendingComp',    label: 'Chờ xử lý bù',     value: s.pending_compensations || 0,         accent: '#ef4444', icon: 'ri-alert-line' },
    { key: 'approvedComp',   label: 'Đã duyệt bù',      value: s.approved_compensations || 0,        accent: '#059669', icon: 'ri-checkbox-circle-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #fefce8, #f0f9ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Nhà máy</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'} — Quản lý sản xuất &amp; bù hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? '#2563eb' : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map(st => (
          <div key={st.key} onMouseEnter={() => setHover(st.key)} onMouseLeave={() => setHover(null)} style={cardStyle(hover === st.key, st.accent)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: st.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                <i className={st.icon} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, '#2563eb')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phiếu nhập theo ngày</h3>
          {recData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="receipts" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Trạng thái phiếu bù</h3>
          {compStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={compStats} dataKey="count" nameKey="defect_type" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {compStats.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, '#f59e0b')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu nhập chờ duyệt</h3>
          {pendingReceipts.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có phiếu chờ duyệt</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {pendingReceipts.slice(0, 6).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.receipt_no}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.warehouse_name || '—'} • {r.item_count || 0} SP</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#92400e' }}>{r.note?.slice(0, 30) || '—'}</span>
                </div>
              ))}
            </div>
          }
        </div>

        <div style={cardStyle(false, '#ef4444')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù chờ duyệt</h3>
          {pendingComps.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có phiếu bù chờ</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {pendingComps.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ef4444' }}>{c.compensation_no}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.order_no} • {c.customer_name || '—'} • {c.item_count || 0} SP</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 11 }}>{c.defect_type}</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\LogisticsDashboardPage.jsx ===
`jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];

function cardStyle(hovered, accent = '#2563eb') {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function LogisticsDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reports/dashboard?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        const json = await res.json();
        setData(json);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const recentDeliveries = Array.isArray(data?.tables?.recent_deliveries) ? data.tables.recent_deliveries : [];
  const returnList = Array.isArray(data?.tables?.return_list) ? data.tables.return_list : [];
  const compList = Array.isArray(data?.tables?.compensation_list) ? data.tables.compensation_list : [];
  const delData = (data?.charts?.deliveries_by_day || []).map(r => ({ ...r, deliveries: Number(r.deliveries || 0), name: r.date }));
  const returnReasons = Array.isArray(data?.charts?.return_reasons) ? data.charts.return_reasons : [];
  const carrierStats = Array.isArray(data?.tables?.carrier_stats) ? data.tables.carrier_stats : [];

  const stats = [
    { key: 'delivered',     label: 'Đơn đã giao',    value: s.completed_deliveries || 0,         accent: '#10b981', icon: 'ri-checkbox-circle-line' },
    { key: 'totalDel',      label: 'Tổng vận chuyển', value: s.total_deliveries || 0,              accent: '#2563eb', icon: 'ri-truck-line' },
    { key: 'pendingDel',    label: 'Đang vận chuyển', value: s.pending_deliveries || 0,            accent: '#f59e0b', icon: 'ri-navigation-line' },
    { key: 'returns',       label: 'Yêu cầu hoàn',   value: s.return_requests || 0,              accent: '#f97316', icon: 'ri-arrow-go-back-line' },
    { key: 'compPending',   label: 'Phiếu bù chờ',   value: s.compensation_pending || 0,          accent: '#ef4444', icon: 'ri-file-list-3-line' },
    { key: 'onTime',        label: 'Đúng hạn',       value: `${s.on_time_rate || 0}%`,            accent: '#059669', icon: 'ri-time-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #fff7ed, #eff6ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Logistics</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? '#2563eb' : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map(st => (
          <div key={st.key} onMouseEnter={() => setHover(st.key)} onMouseLeave={() => setHover(null)} style={cardStyle(hover === st.key, st.accent)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: st.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                <i className={st.icon} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, '#2563eb')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Giao hàng theo ngày</h3>
          {delData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={delData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="deliveries" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#f97316')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Lý do hoàn hàng</h3>
          {returnReasons.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={returnReasons} dataKey="count" nameKey="customer_reject_reason" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {returnReasons.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, '#ef4444')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Yêu cầu hoàn hàng</h3>
          {returnList.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có yêu cầu hoàn</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {returnList.slice(0, 6).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700 }}>{r.order_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{r.customer_name || '—'}</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 11 }}>{r.status}</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{r.logistics_action || r.customer_reject_reason || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù chờ xử lý</h3>
          {compList.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có phiếu bù chờ</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {compList.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#7c3aed' }}>{c.compensation_no}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.order_no} • {c.customer_name || '—'}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: 11 }}>{c.defect_type}</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\WarehouseDashboardPage.jsx ===
`jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];

function cardStyle(hovered, accent = '#2563eb') {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function WarehouseDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reports/dashboard?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        const json = await res.json();
        setData(json);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const whBreakdown = Array.isArray(data?.tables?.warehouse_breakdown) ? data.tables.warehouse_breakdown : [];
  const lowStock = Array.isArray(data?.tables?.low_stock_products) ? data.tables.low_stock_products : [];
  const recentReceipts = Array.isArray(data?.tables?.recent_receipts) ? data.tables.recent_receipts : [];
  const recentOutbounds = Array.isArray(data?.tables?.recent_outbounds) ? data.tables.recent_outbounds : [];
  const recData = (data?.charts?.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));
  const outData = (data?.charts?.outbounds_by_day || []).map(r => ({ ...r, outbounds: Number(r.outbounds || 0), name: r.date }));

  const stats = [
    { key: 'stock',    label: 'Loại SP có tồn',  value: s.total_product_types || 0,        accent: '#2563eb', icon: 'ri-box-3-line' },
    { key: 'totalQty', label: 'Tổng tồn kho',    value: fmtNum(s.total_stock),              accent: '#0ea5e9', icon: 'ri-stack-line' },
    { key: 'lowStock', label: 'Cảnh báo tồn thấp', value: s.low_stock_count || 0,            accent: '#ef4444', icon: 'ri-alert-line' },
    { key: 'receipts', label: 'Phiếu nhập',       value: s.total_receipts || 0,              accent: '#10b981', icon: 'ri-inbox-archive-line' },
    { key: 'outbounds',label: 'Phiếu xuất',       value: s.total_outbounds || 0,             accent: '#7c3aed', icon: 'ri-send-plane-line' },
    { key: 'pendingRec',label:'Chờ nhập',          value: s.pending_receipts || 0,            accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'pendingOut',label:'Chờ xuất',          value: s.pending_outbounds || 0,           accent: '#f97316', icon: 'ri-truck-line' },
    { key: 'completed',label: 'Hoàn tất',         value: s.completed_receipts || 0,          accent: '#059669', icon: 'ri-check-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdf4, #f0f9ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Kho</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? '#2563eb' : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map(st => (
          <div key={st.key} onMouseEnter={() => setHover(st.key)} onMouseLeave={() => setHover(null)} style={cardStyle(hover === st.key, st.accent)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: st.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                <i className={st.icon} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, '#10b981')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Nhập kho theo ngày</h3>
          {recData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="receipts" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Xuất kho theo ngày</h3>
          {outData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={outData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="outbounds" fill="#7c3aed" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, '#ef4444')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Tồn kho thấp</h3>
          {lowStock.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Kho đủ hàng</div> :
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>SKU</th><th style={{ padding: '6px 0' }}>Tồn</th><th style={{ padding: '6px 0' }}>Min</th><th style={{ padding: '6px 0', textAlign: 'left' }}>Kho</th>
              </tr></thead>
              <tbody>{lowStock.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontWeight: 700, fontSize: 13 }}>{p.sku}</td>
                  <td style={{ padding: '7px 0', color: '#ef4444', fontWeight: 800, textAlign: 'center' }}>{p.on_hand || 0}</td>
                  <td style={{ padding: '7px 0', color: '#94a3b8', textAlign: 'center' }}>{p.min_stock}</td>
                  <td style={{ padding: '7px 0', fontSize: 12, color: '#64748b' }}>{p.warehouse_name || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          }
        </div>

        <div style={cardStyle(false, '#2563eb')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Hoạt động gần đây</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {recentReceipts.length === 0 && recentOutbounds.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có hoạt động</div>
            ) : [...recentReceipts.map(r => ({ ...r, type: 'Nhập' })), ...recentOutbounds.map(r => ({ ...r, type: 'Xuất' }))].slice(0, 8).map((act, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 700, color: act.type === 'Nhập' ? '#10b981' : '#7c3aed', marginRight: 8 }}>{act.type}</span>
                  <span>{act.receipt_no || act.outbound_no || '—'}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{fmtDate(act.receipt_date || act.export_date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\SalesOrdersPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';
import { formatOrderItems, normalizeOrderItems } from '../utils/orderItems';
import { exportListToExcel } from '../utils/exportList';

const statusConfig = {
    pending:              { label: 'Đang chờ duyệt',        tone: 'warning' },
    returned:            { label: 'Bị từ chối',             tone: 'danger' },
    warehouse_processing: { label: 'Kho đang xuất',          tone: 'info' },
    waiting_sales:       { label: 'Đợi Sales xử lý',       tone: 'amber' },
    return_to_sales:     { label: 'Hoàn về Sales',          tone: 'amber' },
    shipping:            { label: 'Đang giao',               tone: 'purple' },
    completed:           { label: 'Đã hoàn tất',            tone: 'success' },
    logistics_review:     { label: 'Kho báo lỗi',            tone: 'purple' },
    canceled:            { label: 'Hủy đơn',                tone: 'danger' },
    customer_rejected:   { label: 'Khách từ chối',          tone: 'danger' },
    return_pending:      { label: 'Đang xử lý hoàn',        tone: 'orange' },
    return_completed:   { label: 'Hoàn xong',               tone: 'success' },
};

const toneStyles = {
    warning: { background: '#fef3c7', color: '#92400e' },
    danger: { background: '#fee2e2', color: '#991b1b' },
    info: { background: '#dbeafe', color: '#1d4ed8' },
    success: { background: '#dcfce7', color: '#166534' },
    purple: { background: '#ede9fe', color: '#6b21a8' },
    amber:  { background: '#fef9c3', color: '#854d0e' },
    orange: { background: '#ffedd5', color: '#9a3412' },
};

const fmt = new Intl.NumberFormat('vi-VN').format;
const fmtDate = (d) => {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString('vi-VN');
    } catch { return ''; }
};

const calcTotal = (order) => {
    const items = Array.isArray(order?.items) ? order.items : normalizeOrderItems(order);
    return items.reduce((sum, item) => {
        const price = Number(
            item.unit_price ?? item.sale_price ?? item.price ??
            item.product?.sale_price ?? item.product?.price ?? item.product?.unit_price ??
            item.product_price ?? item.product?.product_price ?? 0
        );
        return sum + price * Number(item.quantity ?? item.qty ?? item.product_quantity ?? 0);
    }, 0);
};

const enrichItems = (items, products) =>
    items.map((item) => {
        const match = products.find(
            (p) => Number(p.id) === Number(item.product_id) ||
                   String(p.sku || '') === String(item.product_sku || item.sku || '')
        );
        return {
            ...item,
            product_name: item.product_name ?? item.name ?? item.product?.name ?? match?.name ?? match?.product_name ?? 'Sản phẩm không tên',
            product_sku: item.product_sku ?? item.sku ?? item.product?.sku ?? match?.sku ?? '',
            unit_price: Number(
                item.unit_price ?? item.sale_price ?? item.price ??
                item.product?.sale_price ?? item.product?.price ?? item.product?.unit_price ??
                match?.sale_price ?? match?.price ?? 0
            ),
        };
    });

export default function SalesOrdersPage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuthorized = [1, 2].includes(user?.role_id);

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [orderNo, setOrderNo] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [note, setNote] = useState('');
    const [warehouseNote, setWarehouseNote] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [errorOrder, setErrorOrder] = useState(null);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [rejectOrder, setRejectOrder] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectAction, setRejectAction] = useState('return_to_warehouse'); // 'return_to_warehouse' | 'return_pending'
    const [rejectNote, setRejectNote] = useState('');
    const [cancelOrder, setCancelOrder] = useState(null);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState(null);

    // ── Responsive ────────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const [isTablet, setIsTablet] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Data ──────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            const [c, p, o] = await Promise.all([
                api.get('/customers'),
                api.get('/products'),
                api.get('/orders'),
            ]);
            setCustomers(c.data);
            setProducts(p.data);
            setOrders(o.data);
        } catch {
            alert('Lỗi tải dữ liệu hệ thống');
        }
    };

    useEffect(() => {
        fetchAll();
        setPageLoaded(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true)));

        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeForm();
                setIsViewOpen(false);
                setViewOrder(null);
                setIsErrorModalOpen(false);
                setErrorOrder(null);
                setCancelOrder(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Computed ──────────────────────────────────────────────────────────────
    const filteredOrders = useMemo(() => {
        const kw = searchTerm.trim().toLowerCase();
        return orders.filter((o) => {
            const status = statusConfig[o.status] ? o.status : 'pending';
            const text = [
                o.order_no, o.customer_name, o.expected_delivery_date, o.note,
                ...(o.items || []).flatMap((i) => [i.product_name, i.product_sku]),
            ].filter(Boolean).join(' ').toLowerCase();
            return (!kw || text.includes(kw)) && (statusFilter === 'all' || status === statusFilter);
        });
    }, [orders, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter((o) => (statusConfig[o.status] ? o.status : 'pending') === 'pending').length,
        completed: orders.filter((o) => o.status === 'completed').length,
        issues: orders.filter((o) => ['returned', 'logistics_review', 'waiting_sales'].includes(o.status)).length,
    }), [orders]);

    // ── Item helpers ─────────────────────────────────────────────────────────
    const addItem = (productId) => {
        if (productId) {
            const prod = products.find((p) => String(p.id) === String(productId));
            if (prod) {
                setSelectedItems((prev) => [
                    ...prev,
                    { product_id: String(prod.id), quantity: 1, unit_price: Number(prod.sale_price || 0) }
                ]);
                return;
            }
        }
        setSelectedItems((p) => [...p, { product_id: '', quantity: 1, unit_price: 0 }]);
    };

    const updateItem = (idx, field, val) => {
        setSelectedItems((prev) => {
            const next = [...prev];
            if (field === 'quantity') next[idx].quantity = Math.max(1, Number(val) || 1);
            else if (field === 'product_id') {
                next[idx].product_id = val;
                const prod = products.find((p) => p.id === parseInt(val, 10));
                if (prod) next[idx].unit_price = Number(prod.sale_price || 0);
            } else {
                next[idx][field] = val;
            }
            return next;
        });
    };

    const removeItem = (idx) => setSelectedItems((p) => p.filter((_, i) => i !== idx));

    // ── Open/close form ───────────────────────────────────────────────────────
    const openForm = () => {
        setIsFormOpen(true);
        requestAnimationFrame(() => setIsFormVisible(true));
    };

    const openAdd = () => {
        setEditingId(null);
        setOrderNo('');
        setCustomerId('');
        setExpectedDate('');
        setNote('');
        setWarehouseNote('');
        setSelectedItems([]);
        openForm();
    };

    const closeForm = () => {
        setIsFormVisible(false);
        window.setTimeout(() => {
            setIsFormOpen(false);
            setEditingId(null);
            setCustomerId('');
            setExpectedDate('');
            setNote('');
            setWarehouseNote('');
            setSelectedItems([]);
        }, 220);
    };

    const openEdit = async (order) => {
        if (['warehouse_processing', 'shipping', 'completed', 'canceled', 'customer_rejected', 'return_pending', 'return_completed'].includes(order?.status)) {
            return alert('Đơn hàng đang ở giai đoạn này nên không thể chỉnh sửa.');
        }
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setOrderNo(order.order_no);
            setCustomerId(order.customer_id);
            setExpectedDate(order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '');
            setNote(order.note || '');
            setWarehouseNote(order.warehouse_note || '');
            setSelectedItems(res.data);
            setEditingId(order.id);
            openForm();
        } catch {
            alert('Lỗi tải chi tiết đơn');
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm');

        try {
            // Backend tự sinh mã trong transaction — không gọi next-code ở đây
            const payload = {
                customer_id: customerId,
                order_date: new Date().toISOString(),
                expected_delivery_date: expectedDate,
                note,
                items: selectedItems,
            };

            if (editingId) {
                await api.put(`/orders/${editingId}`, payload);
                alert('Cập nhật thành công!');
            } else {
                const res = await api.post('/orders', payload);
                alert(`Tạo đơn hàng thành công! Mã đơn: ${res.data.order_no}`);
            }
            closeForm();
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xử lý đơn');
        }
    };

    // ── Delete / Cancel ──────────────────────────────────────────────────────
    const handleDelete = async (order) => {
        if (['warehouse_processing', 'shipping', 'completed', 'canceled', 'customer_rejected', 'return_pending', 'return_completed'].includes(order?.status)) {
            return alert('Đơn hàng đang ở giai đoạn này nên không thể xóa.');
        }
        if (!window.confirm('Xác nhận xóa vĩnh viễn đơn hàng này?')) return;
        try {
            await api.delete(`/orders/${order.id}`);
            setIsErrorModalOpen(false);
            setErrorOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa đơn');
        }
    };

    const handleCancel = async (order) => {
        const isBom = order.note?.includes('[KHÁCH BOM HÀNG');
        const msg = isBom
            ? 'Xác nhận: Khách bom hàng. Hệ thống sẽ tự động CỘNG TRẢ số lượng vào kho và HỦY đơn này?'
            : 'Xác nhận: Bạn muốn HỦY đơn hàng này? (Đơn chưa xuất kho nên sẽ không ảnh hưởng kho)';
        if (!window.confirm(msg)) return;
        try {
            await api.put(`/orders/${order.id}/return-inventory`);
            alert(isBom ? 'Đã hoàn kho và hủy đơn thành công!' : 'Đã hủy đơn thành công!');
            setIsErrorModalOpen(false);
            setErrorOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xử lý hủy đơn');
        }
    };

    // Hoàn đơn lại vào kho (đơn khách không nhận đã quay về Sales)
    const handleReturnToWarehouse = async (order) => {
        if (!window.confirm(`Xác nhận hoàn đơn "${order.order_no}" lại vào kho đã xuất? Hệ thống sẽ cộng trả số lượng vào kho và hủy đơn.`)) return;
        try {
            await api.put(`/orders/${order.id}/return-inventory`);
            alert('Đã hoàn đơn lại vào kho thành công!');
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi hoàn đơn vào kho');
        }
    };

    // ── View ─────────────────────────────────────────────────────────────────
    const openView = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setViewOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setViewOrder(order);
        }
        setIsViewOpen(true);
    };

    const openErrorModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setErrorOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setErrorOrder(order);
        }
        setIsErrorModalOpen(true);
    };

    const openCancelModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setCancelOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setCancelOrder(order);
        }
    };

    // Mở modal xử lý khách từ chối
    const openRejectModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setRejectOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setRejectOrder(order);
        }
        setRejectAction('return_to_warehouse');
        setRejectNote('');
        setIsRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectOrder) return;
        try {
            await api.put(`/orders/${rejectOrder.id}/process-customer-rejection`, {
                action: rejectAction,
                note: rejectNote,
            });
            alert(rejectAction === 'return_to_warehouse'
                ? 'Đã hoàn đơn lại vào kho thành công!'
                : 'Đã chuyển sang xử lý hoàn thành công!');
            setIsRejectModalOpen(false);
            setRejectOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xử lý yêu cầu');
        }
    };

    // ── Layout helpers ──────────────────────────────────────────────────────
    const pad = isMobile ? 14 : isTablet ? 18 : 20;
    const statCols = isMobile ? 1 : isTablet ? 2 : 4;
    const cardR = isMobile ? 16 : 20;

    // ── Render ────────────────────────────────────────────────────────────────
    if (!isAuthorized) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
                <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
                <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
                <p style={{ margin: 0, fontSize: 14 }}>Trang Quản lý đơn hàng chỉ dành cho Admin và Sales.</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100dvh', padding: `${pad}px`,
            background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 35%, #f3f4f6 100%)',
            color: '#0f172a', boxSizing: 'border-box',
            opacity: pageLoaded ? 1 : 0,
            transition: 'opacity 320ms ease',
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
                    marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap',
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 420ms ease 80ms'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                            Quản lý đơn hàng
                        </h2>
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 12 : 14, lineHeight: 1.7 }}>
                            Theo dõi, chỉnh sửa và xử lý đơn hàng trong một giao diện gọn gàng.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" onClick={async () => {
                            const rows = filteredOrders.map(o => {
                                const total = calcTotal(o);
                                return [
                                    o.order_no || '',
                                    o.customer_name || '',
                                    fmtDate(o.order_date),
                                    fmtDate(o.expected_delivery_date),
                                    fmtDate(o.actual_delivery_date),
                                    statusConfig[o.status]?.label || o.status || '',
                                    (o.items?.length ?? normalizeOrderItems(o).length),
                                    total,
                                ];
                            });
                            await exportListToExcel({
                                filename: 'DanhSachDonHang',
                                sheetName: 'DonHang',
                                title: 'DANH SÁCH ĐƠN HÀNG',
                                headers: ['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Ngày giao dự kiến', 'Ngày giao thực tế', 'Trạng thái', 'Số SP', 'Tổng tiền (VND)'],
                                rows,
                                colWidths: [18, 28, 14, 16, 16, 18, 8, 18],
                                numberCols: [{ col: 8, format: '#,##0 "đ"' }],
                            });
                        }} style={{
                            padding: isMobile ? '11px 16px' : '12px 18px',
                            borderRadius: 14, border: '1px solid #d1fae5',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? 13 : 14,
                            boxShadow: '0 14px 28px rgba(16,185,129,0.22)',
                            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                        }}>
                            <i className="ri-file-excel-2-line" style={{ fontSize: 16 }} />
                            Xuất Excel
                        </button>
                        <button type="button" onClick={openAdd} style={{
                            padding: isMobile ? '11px 16px' : '12px 18px',
                            borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
                            color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? 13 : 14,
                            boxShadow: '0 14px 28px rgba(37,99,235,0.22)',
                            transition: 'transform 160ms ease, box-shadow 160ms ease',
                            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                        }}>
                            <i className="ri-add-line" style={{ fontSize: 16 }} />
                            Tạo đơn hàng
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`,
                    gap: isMobile ? 10 : 14,
                    marginBottom: isMobile ? 14 : 22,
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 420ms ease 120ms'
                }}>
                    {[
                        { key: 'total', label: 'Tổng đơn', value: stats.total, bg: '#eff6ff', color: '#2563eb', icon: 'ri-file-list-3-line' },
                        { key: 'pending', label: 'Chờ duyệt', value: stats.pending, bg: '#fffbeb', color: '#d97706', icon: 'ri-time-line' },
                        { key: 'completed', label: 'Đã hoàn tất', value: stats.completed, bg: '#ecfdf5', color: '#16a34a', icon: 'ri-checkbox-circle-line' },
                        { key: 'issues', label: 'Đơn lỗi', value: stats.issues, bg: '#fef2f2', color: '#dc2626', icon: 'ri-error-warning-line' },
                    ].map((s) => (
                        <div key={s.key} style={{
                            borderRadius: cardR, padding: isMobile ? '14px' : '18px',
                            background: '#fff', boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                            border: '1px solid rgba(148,163,184,0.18)',
                            minHeight: isMobile ? 86 : 104,
                        }}>
                            <div style={{
                                width: isMobile ? 38 : 40, height: isMobile ? 38 : 40, borderRadius: 12,
                                background: s.bg, color: s.color, display: 'grid', placeItems: 'center',
                                marginBottom: isMobile ? 10 : 12, fontSize: 20, boxShadow: `0 8px 18px ${s.bg}`
                            }}>
                                <i className={s.icon} />
                            </div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: isMobile ? 10 : 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {s.label}
                            </p>
                            <div style={{ margin: '8px 0 0', fontSize: isMobile ? 22 : 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Section ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148,163,184,0.18)', borderRadius: cardR,
                    boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
                    marginBottom: 22, overflow: 'hidden',
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 460ms ease 180ms'
                }}>
                    {/* Section Header */}
                    <div style={{ padding: isMobile ? '14px' : '20px 20px 0' }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Danh sách đơn hàng
                        </h3>
                        <p style={{ margin: '6px 0 12px', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.6 }}>
                            Theo dõi tiến độ và xử lý nhanh các đơn đang chờ hoặc bị trả về.
                        </p>
                    </div>

                    {/* Filters */}
                    <div style={{ padding: isMobile ? '0 14px 14px' : '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 14,
                                border: '1px solid #cbd5e1', background: '#fff',
                                minWidth: 0, flex: isMobile ? '1 1 100%' : isTablet ? '1 1 220px' : '1 1 280px',
                                boxShadow: '0 8px 18px rgba(15,23,42,0.04)'
                            }}>
                                <i className="ri-search-line" style={{ color: '#94a3b8', fontSize: 16, flexShrink: 0 }} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm mã đơn, khách hàng..."
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#0f172a' }}
                                />
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '10px 14px', borderRadius: 14,
                                    border: '1px solid #cbd5e1', background: '#fff',
                                    fontSize: 13, color: '#0f172a', cursor: 'pointer',
                                    fontWeight: 600, flex: isMobile ? '1 1 100%' : '0 0 auto',
                                    minWidth: isMobile ? '100%' : 160
                                }}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Đang chờ duyệt</option>
                                <option value="returned">Bị từ chối</option>
                                <option value="warehouse_processing">Kho đang xuất</option>
                                <option value="completed">Đã hoàn tất</option>
                                <option value="waiting_sales">Đang đợi Sales</option>
                                <option value="return_to_sales">Hoàn về Sales</option>
                                <option value="customer_rejected">Khách từ chối</option>
                            </select>
                            <div style={{
                                padding: '10px 14px', borderRadius: 14,
                                border: '1px solid #e2e8f0', background: '#f8fafc',
                                color: '#475569', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
                            }}>
                                {filteredOrders.length} / {orders.length} đơn
                            </div>
                            {(searchTerm || statusFilter !== 'all') && (
                                <button
                                    type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                    style={{
                                        padding: '10px 14px', borderRadius: 14,
                                        border: '1px solid #dbe3ee', background: '#fff',
                                        color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                                    }}
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table / List */}
                    <div style={{ padding: isMobile ? '0 0 12px' : '0 20px 20px' }}>
                        {orders.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Chưa có đơn hàng nào.</div>
                        ) : filteredOrders.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy đơn hàng phù hợp.</div>
                        ) : isMobile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                                {filteredOrders.map((o, index) => {
                                    const status = statusConfig[o.status] ? o.status : 'pending';
                                    const cfg = statusConfig[status];
                                    const tone = toneStyles[cfg.tone];
                                    return (
                                        <div
                                            key={o.id}
                                            style={{
                                                borderRadius: 16, padding: '14px',
                                                border: '1px solid #e2e8f0',
                                                background: hoveredRowId === o.id ? '#f8fbff' : '#fff',
                                                boxShadow: hoveredRowId === o.id ? '0 8px 20px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.03)',
                                                opacity: pageLoaded ? 1 : 0,
                                                transition: `opacity 360ms ease ${120 + index * 50}ms, background 180ms ease, box-shadow 180ms ease`
                                            }}
                                            onMouseEnter={() => setHoveredRowId(o.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 900, color: '#2563eb', fontSize: 14 }}>{o.order_no}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', marginTop: 2 }}>
                                                        <i className="ri-user-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                        {o.customer_name || '—'}
                                                    </div>
                                                </div>
                                                <span style={{ ...tone, display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>
                                                {formatOrderItems(o)}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {status === 'completed' && (
                                                    <button onClick={() => openView(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-eye-line" style={{ marginRight: 4, fontSize: 13 }} />Xem
                                                    </button>
                                                )}
                                                {status === 'canceled' && (
                                                    <button onClick={() => openCancelModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-eye-line" style={{ marginRight: 4, fontSize: 13 }} />Lý do hủy
                                                    </button>
                                                )}
                                                {status === 'returned' && (
                                                    <button onClick={() => openErrorModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        Xem lỗi & xử lý
                                                    </button>
                                                )}
                                                {status === 'customer_rejected' && (
                                                    <button onClick={() => openRejectModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-settings-line" style={{ marginRight: 4, fontSize: 13 }} />Xử lý
                                                    </button>
                                                )}
                                                {status === 'pending' && (
                                                    <>
                                                        <button onClick={() => openEdit(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-edit-line" style={{ marginRight: 4, fontSize: 13 }} />Sửa
                                                        </button>
                                                        <button onClick={() => handleDelete(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-delete-bin-line" style={{ marginRight: 4, fontSize: 13 }} />Xóa
                                                        </button>
                                                    </>
                                                )}
                                                {(status === 'waiting_sales' || status === 'return_to_sales') && (
                                                    <>
                                                        <button onClick={() => openEdit(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fbbf24', background: '#fffbeb', color: '#b45309', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-edit-line" style={{ marginRight: 4, fontSize: 13 }} />Sửa đơn
                                                        </button>
                                                        {status === 'return_to_sales' && (
                                                            <button onClick={() => handleReturnToWarehouse(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                                <i className="ri-arrow-go-back-line" style={{ marginRight: 4, fontSize: 13 }} />Hoàn đơn lại vào kho
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-delete-bin-line" style={{ marginRight: 4, fontSize: 13 }} />Xóa đơn
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', borderRadius: isMobile ? 12 : 18, border: '1px solid #e2e8f0' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: isTablet ? 700 : 900 }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Ngày giao dự kiến', 'Trạng thái', 'Hành động'].map((h) => (
                                                <th key={h} style={{
                                                    textAlign: 'left', padding: '12px 16px',
                                                    fontSize: 12, textTransform: 'uppercase',
                                                    letterSpacing: '0.06em', color: '#64748b',
                                                    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((o, index) => {
                                            const status = statusConfig[o.status] ? o.status : 'pending';
                                            const cfg = statusConfig[status];
                                            const tone = toneStyles[cfg.tone];
                                            const isHovered = hoveredRowId === o.id;
                                            return (
                                                <tr key={o.id}
                                                    onMouseEnter={() => setHoveredRowId(o.id)}
                                                    onMouseLeave={() => setHoveredRowId(null)}
                                                    style={{
                                                        background: isHovered ? 'linear-gradient(90deg, rgba(37,99,235,0.04), #fff)' : '#fff',
                                                        opacity: pageLoaded ? 1 : 0,
                                                        transition: `opacity 360ms ease ${120 + index * 50}ms, background 180ms ease`,
                                                    }}
                                                >
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>{o.order_no}</td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', verticalAlign: 'top' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <i className="ri-user-line" style={{ color: '#94a3b8', fontSize: 14, flexShrink: 0 }} />
                                                            <span>{o.customer_name || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13, lineHeight: 1.6, maxWidth: isTablet ? 160 : 340 }}>{formatOrderItems(o)}</td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'nowrap' }}>
                                                        {o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                                        <span style={{ ...tone, display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                                                            {cfg.label}
                                                        </span>
                                                        {status === 'waiting_sales' && o.warehouse_note && (
                                                            <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', fontWeight: 600, lineHeight: 1.4, maxWidth: 200 }}>
                                                                <i className="ri-error-warning-line" style={{ marginRight: 4, fontSize: 11 }} />
                                                                Kho: {o.warehouse_note}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                                        {status === 'completed' && (
                                                            <button onClick={() => openView(o)} title="Xem chi tiết" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                        {status === 'canceled' && (
                                                            <button onClick={() => openCancelModal(o)} title="Xem lý do hủy" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                        {status === 'returned' && (
                                                            <button onClick={() => openErrorModal(o)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                                Xem lỗi
                                                            </button>
                                                        )}
                                                        {status === 'customer_rejected' && (
                                                            <button onClick={() => openRejectModal(o)} title="Xử lý đơn khách từ chối" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fb923c', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-settings-line" style={{ fontSize: 15 }} />
                                                            </button>
                                                        )}
                                                        {status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <button onClick={() => openEdit(o)} title="Sửa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-edit-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                                <button onClick={() => handleDelete(o)} title="Xóa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-delete-bin-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(status === 'waiting_sales' || status === 'return_to_sales') && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <button onClick={() => openEdit(o)} title="Sửa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fbbf24', background: '#fffbeb', color: '#b45309', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-edit-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                                {status === 'return_to_sales' && (
                                                                    <button onClick={() => handleReturnToWarehouse(o)} title="Hoàn đơn lại vào kho" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                        <i className="ri-arrow-go-back-line" style={{ fontSize: 15 }} />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDelete(o)} title="Xóa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-delete-bin-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {['warehouse_processing', 'shipping', 'logistics_review'].includes(status) && (
                                                            <button onClick={() => openView(o)} title="Xem chi tiết" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Create/Edit Modal ── */}
            {isFormOpen && createPortal(
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: isFormVisible ? 'rgba(15,23,42,0.6)' : 'rgba(15,23,42,0)',
                        backdropFilter: isFormVisible ? 'blur(8px)' : 'none',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: pad, transition: 'background 220ms ease, backdrop-filter 220ms ease',
                    }}
                    onClick={closeForm}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: 1100,
                            maxHeight: '92dvh', overflowY: 'auto',
                            background: '#fff', borderRadius: cardR,
                            boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
                            border: '1px solid #e5eef8',
                            transform: isFormVisible ? 'scale(1)' : 'scale(0.97)',
                            opacity: isFormVisible ? 1 : 0,
                            transition: 'transform 220ms ease, opacity 220ms ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: isMobile ? '16px' : '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    {editingId ? 'Chỉnh sửa đơn' : 'Tạo đơn hàng'}
                                </div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    {editingId ? `Đơn ${orderNo}` : 'Tạo đơn hàng mới'}
                                </h3>
                            </div>
                            <button type="button" onClick={closeForm} style={{
                                width: 36, height: 36, borderRadius: 10,
                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#dbe3ee',
                                background: '#fff', color: '#0f172a', cursor: 'pointer',
                                fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center'
                            }}>
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: isMobile ? '16px' : '24px' }}>
                            <form onSubmit={handleSubmit}>
                                {/* Row 1: Mã đơn - Khách hàng - Ngày giao dự kiến */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile
                                        ? '1fr'
                                        : isTablet
                                        ? 'repeat(2, minmax(0, 1fr))'
                                        : '1fr 1.5fr 1fr',
                                    gap: 14, marginBottom: 14
                                }}>
                                    {/* Mã đơn hàng */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Mã đơn hàng
                                        </label>
                                        <div style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 14,
                                            border: '1px solid #bfdbfe', background: '#eff6ff',
                                            fontSize: 16, fontWeight: 900, color: '#1d4ed8',
                                            fontFamily: 'monospace', letterSpacing: '0.06em',
                                            boxSizing: 'border-box'
                                        }}>
                                            {editingId ? orderNo : 'Sẽ được sinh khi gửi'}
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                                            {editingId ? 'Mã đơn gốc' : 'Mã được sinh tự động khi bạn nhấn Gửi đơn'}
                                        </div>
                                    </div>

                                    {/* Khách hàng */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Khách hàng <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            required value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', outline: 'none', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                                        >
                                            <option value="">-- Chọn khách hàng --</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Ngày giao dự kiến */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Ngày giao dự kiến <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            required type="date" value={expectedDate}
                                            onChange={(e) => setExpectedDate(e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', outline: 'none', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                {/* Lý do Kho từ chối (chỉ đọc) */}
                                {warehouseNote && (
                                    <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>
                                            <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
                                            Lý do Kho từ chối xuất hàng
                                        </div>
                                        <div style={{ color: '#9a3412', fontSize: 14, fontWeight: 600 }}>{warehouseNote}</div>
                                    </div>
                                )}

                                {/* Row 2: Note */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                        Địa chỉ giao hàng / Ghi chú
                                    </label>
                                    <textarea
                                        value={note} onChange={(e) => setNote(e.target.value)}
                                        placeholder="Nhập địa chỉ giao hàng hoặc ghi chú..."
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 14,
                                            border: '1px solid #cbd5e1', background: '#fff', outline: 'none',
                                            fontSize: 14, color: '#0f172a', boxSizing: 'border-box',
                                            minHeight: 88, resize: 'vertical', fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                {/* Items */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: '#0f172a' }}>Danh sách sản phẩm</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Chọn sản phẩm, số lượng và xem thành tiền.</div>
                                        </div>
                                        <button type="button" onClick={() => addItem()} style={{
                                            padding: '10px 16px', borderRadius: 12, border: 'none',
                                            background: 'linear-gradient(135deg, #0f766e, #2563eb)',
                                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            boxShadow: '0 14px 30px rgba(37,99,235,0.18)',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <i className="ri-add-line" style={{ fontSize: 15 }} />
                                            Thêm sản phẩm
                                        </button>
                                    </div>

                                    {selectedItems.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', borderRadius: 14, border: '2px dashed #e2e8f0', fontSize: 14 }}>
                                            Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để thêm.
                                        </div>
                                    ) : isMobile ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {selectedItems.map((item, idx) => {
                                                const qty = Math.max(1, Number(item.quantity) || 1);
                                                const price = Number(item.unit_price || 0);
                                                const total = qty * price;
                                                const prod = products.find((p) => String(p.id) === String(item.product_id));
                                                return (
                                                    <div key={item.id || idx} style={{ padding: '12px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}>
                                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>
                                                                {prod?.sku || '—'}
                                                            </span>
                                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{prod?.name || '—'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Số lượng</label>
                                                                <input type="number" min="1" value={qty}
                                                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Đơn giá</label>
                                                                <div style={{ padding: '9px 12px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: 13 }}>{fmt(price)} đ</div>
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Thành tiền</label>
                                                                <div style={{ padding: '9px 12px', borderRadius: 10, background: '#ecfdf5', color: '#166534', fontWeight: 900, fontSize: 13 }}>{fmt(total)} đ</div>
                                                            </div>
                                                            <button type="button" onClick={() => removeItem(idx)} style={{
                                                                width: 36, height: 36, marginTop: 18, borderRadius: 10,
                                                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca',
                                                                background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                                                                display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700
                                                            }}>×</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 130 }}>Mã SKU</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13 }}>Sản phẩm</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 110 }}>Số lượng</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 150 }}>Đơn giá</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 150 }}>Thành tiền</th>
                                                        <th style={{ width: 60 }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedItems.map((item, idx) => {
                                                        const qty = Math.max(1, Number(item.quantity) || 1);
                                                        const price = Number(item.unit_price || 0);
                                                        const total = qty * price;
                                                        const prod = products.find((p) => String(p.id) === String(item.product_id));
                                                        return (
                                                            <tr key={item.id || idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                                                                        {prod?.sku || '—'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <select
                                                                        value={item.product_id}
                                                                        onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, color: '#0f172a', boxSizing: 'border-box' }}
                                                                    >
                                                                        <option value="">-- Chọn sản phẩm --</option>
                                                                        {products.map((p) => (
                                                                            <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <input type="number" min="1" value={qty}
                                                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{fmt(price)} đ</td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, background: '#ecfdf5', color: '#166534', fontWeight: 800, fontSize: 13 }}>{fmt(total)} đ</div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                    <button type="button" onClick={() => removeItem(idx)} style={{
                                                                        width: 36, height: 36, borderRadius: 10,
                                                                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca',
                                                                        background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 18, fontWeight: 700
                                                                    }}>×</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={closeForm} style={{
                                        padding: '12px 18px', borderRadius: 12,
                                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1',
                                        background: '#fff', color: '#334155', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                    }}>
                                        Hủy
                                    </button>
                                    <button type="submit" style={{
                                        padding: '12px 20px', borderRadius: 12, border: 'none',
                                        background: editingId ? 'linear-gradient(135deg, #ea580c, #f97316)' : 'linear-gradient(135deg, #0f766e, #22c55e)',
                                        color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                                        boxShadow: '0 14px 30px rgba(15,118,110,0.18)',
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        {editingId ? 'Lưu & Gửi lại' : 'Gửi đơn cho Logistics'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Modal ── */}
            {isViewOpen && viewOrder && createPortal(
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsViewOpen(false); setViewOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 700, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 90px rgba(15,23,42,0.3)', border: '1px solid rgba(59,130,246,0.16)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '16px' : 22, background: 'linear-gradient(180deg, #fff, #f8fafc)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: 11, marginBottom: 10 }}>ĐƠN HÀNG ĐÃ HOÀN TẤT</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Chi tiết đơn {viewOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsViewOpen(false); setViewOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 22 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Khách hàng</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewOrder.customer_name || '—'}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Ngày giao dự kiến</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewOrder.expected_delivery_date ? new Date(viewOrder.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
                                </div>
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, gridColumn: isMobile ? 'unset' : '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Tổng tiền</div>
                                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#1d4ed8' }}>{fmt(calcTotal(viewOrder))} đ</div>
                                </div>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Danh sách sản phẩm</div>
                                <div style={{ color: '#0f172a', lineHeight: 1.8 }}>{formatOrderItems(viewOrder)}</div>
                            </div>
                            {viewOrder.note && (
                                <div style={{ background: 'linear-gradient(180deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Ghi chú</div>
                                    <div style={{ color: '#1e3a8a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewOrder.note}</div>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsViewOpen(false); setViewOrder(null); }} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 14px 28px rgba(37,99,235,0.18)' }}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Error Modal (returned) ── */}
            {isErrorModalOpen && errorOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 80px rgba(15,23,42,0.3)', border: '1px solid rgba(248,113,113,0.25)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff1f2, #fff)', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>ĐƠN BỊ TỪ CHỐI</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#0f172a' }}>Chi tiết lỗi đơn {errorOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            <div style={{ background: '#fff1f2', padding: '14px', borderRadius: 14, marginBottom: 16, border: '1px solid #fecdd3', maxHeight: 200, overflowY: 'auto' }}>
                                <div style={{ fontSize: 11, color: '#be123c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do trả đơn</div>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#9f1239', lineHeight: 1.7, fontSize: 14 }}>{errorOrder.note || 'Không có ghi chú lỗi.'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Đóng</button>
                                {errorOrder.status === 'returned' && errorOrder.note?.includes('[KHÁCH BOM HÀNG') && (
                                    <button onClick={() => handleCancel(errorOrder)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(22,163,74,0.18)' }}>Hoàn Kho & Hủy Đơn</button>
                                )}
                                {!(errorOrder.status === 'returned' && errorOrder.note?.includes('[KHÁCH BOM HÀNG')) && (
                                    <>
                                        <button onClick={() => handleDelete(errorOrder)} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca', background: '#fff1f2', color: '#dc2626', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Xóa vĩnh viễn</button>
                                        <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); openEdit(errorOrder); }} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Sửa & Gửi lại</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Cancel Modal ── */}
            {cancelOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => setCancelOrder(null)}
                >
                    <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 90px rgba(15,23,42,0.3)', border: '1px solid rgba(244,63,94,0.16)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff1f2, #fff)', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>ĐƠN ĐÃ HỦY</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Lý do hủy đơn {cancelOrder.order_no}</h3>
                            </div>
                            <button onClick={() => setCancelOrder(null)} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Khách hàng</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{cancelOrder.customer_name || '—'}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Ngày hủy</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                                        {cancelOrder.updated_at ? new Date(cancelOrder.updated_at).toLocaleDateString('vi-VN') :
                                         cancelOrder.created_at ? new Date(cancelOrder.created_at).toLocaleDateString('vi-VN') : '—'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#be123c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do hủy</div>
                                    <div style={{ color: '#9f1239', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>{cancelOrder.note || 'Không có ghi chú hủy.'}</div>
                                </div>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Sản phẩm</div>
                                <div style={{ color: '#0f172a', lineHeight: 1.8 }}>{formatOrderItems(cancelOrder)}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setCancelOrder(null)} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #be123c, #f43f5e)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 14px 28px rgba(244,63,94,0.18)' }}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Customer Rejection Modal ── */}
            {isRejectModalOpen && rejectOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 80px rgba(15,23,42,0.3)', border: '1px solid rgba(249,115,22,0.2)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff7ed, #fff)', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#ffedd5', color: '#c2410c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>KHÁCH TỪ CHỐI NHẬN</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#0f172a' }}>Xử lý đơn {rejectOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            {rejectOrder.note && (
                                <div style={{ background: '#fff7ed', padding: '14px', borderRadius: 14, marginBottom: 16, border: '1px solid #fed7aa', maxHeight: 160, overflowY: 'auto' }}>
                                    <div style={{ fontSize: 11, color: '#c2410c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do khách từ chối</div>
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#9a3412', lineHeight: 1.7, fontSize: 14 }}>{rejectOrder.note}</p>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <button onClick={() => setRejectAction('return_to_warehouse')} style={{
                                    padding: '16px 14px', borderRadius: 14, border: `2px solid ${rejectAction === 'return_to_warehouse' ? '#16a34a' : '#e2e8f0'}`,
                                    background: rejectAction === 'return_to_warehouse' ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                }}>
                                    <i className="ri-arrow-go-back-line" style={{ fontSize: 24, color: rejectAction === 'return_to_warehouse' ? '#15803d' : '#94a3b8', display: 'block', margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 900, color: rejectAction === 'return_to_warehouse' ? '#15803d' : '#64748b', fontSize: 13 }}>Hoàn đơn lại vào kho</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Cộng tồn kho đã xuất, hủy đơn</div>
                                </button>
                                <button onClick={() => setRejectAction('return_pending')} style={{
                                    padding: '16px 14px', borderRadius: 14, border: `2px solid ${rejectAction === 'return_pending' ? '#ea580c' : '#e2e8f0'}`,
                                    background: rejectAction === 'return_pending' ? '#fff7ed' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                }}>
                                    <i className="ri-truck-line" style={{ fontSize: 24, color: rejectAction === 'return_pending' ? '#c2410c' : '#94a3b8', display: 'block', margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 900, color: rejectAction === 'return_pending' ? '#c2410c' : '#64748b', fontSize: 13 }}>Chuyển xử lý hoàn</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Đòi bồi thường vận chuyển</div>
                                </button>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 8 }}>Ghi chú (tùy chọn)</label>
                                <textarea rows="3" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                                    placeholder="Nhập ghi chú thêm..."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#e2e8f0', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Đóng</button>
                                <button onClick={handleReject} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(234,88,12,0.18)' }}>
                                    {rejectAction === 'return_to_warehouse' ? 'Hoàn đơn lại vào kho' : 'Chuyển xử lý hoàn'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\CustomersPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';
import { exportListToExcel } from '../utils/exportList';

const initialFormData = {
    company_name: '',
    phone: '',
    address: '',
    contact_person: ''
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const BASE_INPUT = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};

const BASE_BTN = {
    border: 'none',
    borderRadius: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease'
};

export default function CustomersPage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = user?.role_id || 0;
    // Admin (1) + Sales (2): full quyền; Logistics (3): chỉ xem
    const canEdit = [1, 2].includes(roleId);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [visibleTick, setVisibleTick] = useState(0);
    const [hoveredAddButton, setHoveredAddButton] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [nextCode, setNextCode] = useState('');
    const [portalReady, setPortalReady] = useState(false);

    // ── Responsive ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const [isTablet, setIsTablet] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Data fetching ───────────────────────────────────────────────────────
    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch {
            alert('Lỗi tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const runEnterAnimation = () => {
            setPageLoaded(false);
            setVisibleTick((v) => v + 1);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setPageLoaded(true));
            });
        };
        fetchCustomers();
        runEnterAnimation();
        setPortalReady(true);
        const handleVisible = () => {
            if (document.visibilityState === 'visible') runEnterAnimation();
        };
        window.addEventListener('pageshow', runEnterAnimation);
        document.addEventListener('visibilitychange', handleVisible);
        return () => {
            window.removeEventListener('pageshow', runEnterAnimation);
            document.removeEventListener('visibilitychange', handleVisible);
        };
    }, []);

    // ── Computed ────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: customers.length,
        withContact: customers.filter((item) => item.contact_person).length,
        recentlyAdded: customers.slice(0, 5).length
    }), [customers]);

    const filteredCustomers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return customers;
        return customers.filter((item) =>
            [item.customer_code, item.company_name, item.contact_person, item.phone, item.address, item.creator_name]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(keyword))
        );
    }, [customers, searchTerm]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/customers', {
                company_name: formData.company_name,
                phone: formData.phone,
                address: formData.address,
                contact_person: formData.contact_person
            });
            alert('Thêm khách hàng thành công!');
            closeForm();
            fetchCustomers();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi thêm khách hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const openForm = async () => {
        setIsFormOpen(true);
        requestAnimationFrame(() => setIsFormVisible(true));
        try {
            const res = await api.get('/customers/next-code');
            setNextCode(res.data.next_code);
        } catch {
            setNextCode('');
        }
    };

    const closeForm = () => {
        setIsFormVisible(false);
        window.setTimeout(() => {
            setIsFormOpen(false);
            setNextCode('');
            setFormData(initialFormData);
        }, 220);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchCustomers();
            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi khi xóa');
            }
        }
    };

    // ── Layout helpers ──────────────────────────────────────────────────────
    const pagePad = isMobile ? 14 : isTablet ? 18 : 20;
    const statCols = isMobile ? 1 : isTablet ? 2 : 3;

    // ── Modal ───────────────────────────────────────────────────────────────
    const renderFormModal = () => {
        if (!isFormOpen || !portalReady || typeof document === 'undefined') return null;
        return createPortal(
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: isFormVisible ? 'rgba(15,23,42,0.55)' : 'rgba(15,23,42,0)',
                    zIndex: 9999,
                    transition: 'background 220ms ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: pagePad
                }}
                onClick={closeForm}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 760,
                        maxHeight: 'calc(100dvh - 40px)',
                        overflowY: 'auto',
                        background: '#fff',
                        borderRadius: 24,
                        boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
                        transform: isFormVisible ? 'scale(1)' : 'scale(0.97)',
                        opacity: isFormVisible ? 1 : 0,
                        transition: 'transform 220ms ease, opacity 220ms ease'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div style={{
                        padding: isMobile ? '16px 16px 0' : '20px 20px 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        gap: 12
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: isMobile ? 17 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Thêm khách hàng mới
                            </h3>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                                Nhập đầy đủ thông tin để đội sales, kho và vận hành phối hợp liền mạch.
                            </p>
                        </div>
                        <button
                            type="button" onClick={closeForm}
                            style={{ ...BASE_BTN, padding: '10px 14px', background: '#f1f5f9', color: '#334155', flexShrink: 0 }}
                        >
                            Đóng
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: isMobile ? '16px' : 20 }}>
                        <form onSubmit={handleSubmit}>
                            {/* Mã KH — readonly */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                    Mã khách hàng
                                </label>
                                <div style={{
                                    ...BASE_INPUT,
                                    background: '#f0f9ff',
                                    borderColor: '#bae6fd',
                                    color: nextCode ? '#2563eb' : '#94a3b8',
                                    fontWeight: nextCode ? 800 : 400,
                                    cursor: 'default'
                                }}>
                                    {nextCode ? `Tiếp theo: ${nextCode}` : 'Đang sinh mã...'}
                                </div>
                            </div>

                            {/* 2-col grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                gap: 14, marginBottom: 14
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Tên công ty
                                    </label>
                                    <input
                                        required name="company_name" value={formData.company_name}
                                        onChange={handleInputChange}
                                        placeholder="Tên doanh nghiệp..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Số điện thoại
                                    </label>
                                    <input
                                        required name="phone" value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="090..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Người liên hệ
                                    </label>
                                    <input
                                        required name="contact_person" value={formData.contact_person}
                                        onChange={handleInputChange}
                                        placeholder="Người phụ trách mua hàng..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Địa chỉ
                                    </label>
                                    <input
                                        required name="address" value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Địa chỉ trụ sở hoặc chi nhánh..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" onClick={closeForm}
                                    style={{ ...BASE_BTN, padding: '12px 18px', background: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', color: '#0f172a' }}>
                                    Hủy
                                </button>
                                <button type="submit" disabled={submitting}
                                    style={{ ...BASE_BTN, padding: '12px 20px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff', boxShadow: '0 14px 24px rgba(37,99,235,0.22)' }}>
                                    {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100dvh',
            padding: `${pagePad}px`,
            background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 38%, #f1f5f9 100%)',
            color: '#0f172a',
            boxSizing: 'border-box',
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 320ms ease, transform 320ms ease'
        }}>
            {/* ── Hero ── */}
            <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    gap: 16, marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap',
                    opacity: pageLoaded ? 1 : 0,
                    transform: pageLoaded ? 'translateY(0)' : 'translateY(14px)',
                    transition: 'opacity 420ms ease 80ms, transform 420ms ease 80ms'
                }}>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 30, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15 }}>
                            Quản lý khách hàng
                        </h2>
                        <p style={{ margin: '8px 0 0', maxWidth: 780, color: '#64748b', lineHeight: 1.7, fontSize: isMobile ? 12 : 14 }}>
                            Tập trung toàn bộ danh sách khách hàng trong một không gian làm việc trực quan, dễ theo dõi và sẵn sàng mở rộng.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={async () => {
                                const rows = filteredCustomers.map(c => [
                                    c.customer_code || '',
                                    c.company_name || '',
                                    c.contact_person || '',
                                    c.phone || '',
                                    c.address || '',
                                    c.creator_name || '',
                                    c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '',
                                ]);
                                await exportListToExcel({
                                    filename: 'DanhSachKhachHang',
                                    sheetName: 'KhachHang',
                                    title: 'DANH SÁCH KHÁCH HÀNG',
                                    headers: ['Mã KH', 'Công ty', 'Người liên hệ', 'Điện thoại', 'Địa chỉ', 'Người tạo', 'Ngày tạo'],
                                    rows,
                                    colWidths: [12, 28, 22, 14, 36, 16, 12],
                                });
                            }}
                            style={{
                                ...BASE_BTN,
                                padding: isMobile ? '11px 16px' : '13px 18px',
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                color: '#fff',
                                fontSize: isMobile ? 13 : 14,
                                boxShadow: '0 14px 24px rgba(16,185,129,0.22)',
                            }}
                        >
                            <i className="ri-file-excel-2-line" style={{ marginRight: 6, fontSize: 16 }} />
                            Xuất Excel
                        </button>
                        {canEdit && (
                            <button
                                type="button" onClick={openForm}
                                onMouseEnter={() => setHoveredAddButton(true)}
                                onMouseLeave={() => setHoveredAddButton(false)}
                                style={{
                                    ...BASE_BTN,
                                    padding: isMobile ? '11px 16px' : '13px 18px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                                    color: '#fff',
                                    fontSize: isMobile ? 13 : 14,
                                    boxShadow: hoveredAddButton
                                        ? '0 18px 30px rgba(37,99,235,0.28)'
                                        : '0 14px 24px rgba(37,99,235,0.22)',
                                    transform: hoveredAddButton ? 'translateY(-2px)' : 'translateY(0)',
                                    filter: hoveredAddButton ? 'brightness(1.03)' : 'none',
                                }}
                            >
                                <i className="ri-add-line" style={{ marginRight: 6, fontSize: 16 }} />
                                Thêm Khách Hàng
                            </button>
                        )}
                        {!canEdit && (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chế độ chỉ xem</span>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`,
                    gap: isMobile ? 10 : 14,
                    marginBottom: isMobile ? 14 : 22,
                    opacity: pageLoaded ? 1 : 0,
                    transition: 'opacity 420ms ease 120ms'
                }}>
                    {[
                        { key: 'total', icon: 'ri-team-line', label: 'Tổng khách hàng', value: stats.total, desc: 'Danh mục khách hàng trong hệ thống.', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)', shadow: 'rgba(37,99,235,0.14)' },
                        { key: 'contact', icon: 'ri-customer-service-2-line', label: 'Có Người Liên Hệ', value: stats.withContact, desc: 'Đủ thông tin để chăm sóc và xử lý đơn.', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.16)' },
                        { key: 'recent', icon: 'ri-time-line', label: 'Mới hiển thị', value: stats.recentlyAdded, desc: '5 bản ghi đầu tiên trong danh sách.', bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.16)' }
                    ].map((item) => (
                        <div key={item.key} style={{
                            borderRadius: 22, padding: isMobile ? '14px' : 18,
                            background: '#fff',
                            boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                            border: '1px solid rgba(148,163,184,0.14)',
                            minHeight: isMobile ? 90 : 108,
                            opacity: pageLoaded ? 1 : 0,
                            transition: `opacity 420ms ease ${120 + (item.key === 'total' ? 0 : item.key === 'contact' ? 100 : 200)}ms`
                        }}>
                            <div style={{
                                width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 14,
                                background: item.bg, display: 'grid', placeItems: 'center',
                                marginBottom: isMobile ? 10 : 12, color: '#fff', fontSize: 18,
                                boxShadow: `0 12px 24px ${item.shadow}`
                            }}>
                                <i className={item.icon} />
                            </div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: isMobile ? 11 : 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {item.label}
                            </p>
                            <div style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
                                {item.value}
                            </div>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.5 }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Card ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: isMobile ? 16 : 24,
                    border: '1px solid rgba(148,163,184,0.18)',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                    opacity: pageLoaded ? 1 : 0,
                    transform: pageLoaded ? 'translateY(0)' : 'translateY(18px)',
                    transition: 'opacity 460ms ease 180ms, transform 460ms ease 180ms',
                    overflow: 'hidden'
                }}>
                    {/* Card Header */}
                    <div style={{
                        padding: isMobile ? '14px' : '20px 20px 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        gap: 12, flexWrap: 'wrap'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Danh sách khách hàng
                            </h3>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.6 }}>
                                Giao diện rõ ràng, dễ quét thông tin và tối ưu cho thao tác quản trị hàng ngày.
                            </p>
                        </div>
                        {/* Search */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 14,
                            border: '1px solid #cbd5e1', background: '#fff',
                            boxShadow: '0 8px 18px rgba(15,23,42,0.04)',
                            minWidth: 0, flex: isMobile ? '1 1 100%' : isTablet ? '1 1 260px' : '1 1 300px'
                        }}>
                            <i className="ri-search-line" style={{ color: '#64748b', fontSize: 16, flexShrink: 0 }} />
                            <input
                                type="text" value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm mã, tên, SĐT..."
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#0f172a' }}
                            />
                        </label>
                    </div>

                    {/* Table / List */}
                    <div style={{ padding: isMobile ? '0 0 12px' : '0 24px 24px' }}>
                        {loading ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
                        ) : customers.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên.</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy khách hàng phù hợp.</div>
                        ) : (
                            isMobile ? (
                                /* Mobile: card list */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                                    {filteredCustomers.map((item, index) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                padding: '14px',
                                                borderRadius: 16,
                                                border: '1px solid #e2e8f0',
                                                background: hoveredRowId === item.id ? '#f8fbff' : '#fff',
                                                boxShadow: hoveredRowId === item.id ? '0 8px 20px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.03)',
                                                transition: 'background 180ms ease, box-shadow 180ms ease',
                                                opacity: pageLoaded ? 1 : 0,
                                                transition: `opacity 360ms ease ${120 + index * 70}ms, background 180ms ease, box-shadow 180ms ease`
                                            }}
                                            onMouseEnter={() => setHoveredRowId(item.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>{item.company_name}</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                                                        {item.contact_person && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-user-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                {item.contact_person}
                                                            </div>
                                                        )}
                                                        {item.phone && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-phone-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                {item.phone}
                                                            </div>
                                                        )}
                                                        {item.address && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-map-pin-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                <span style={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden'
                                                                }}>{item.address}</span>
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: 4 }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '3px 8px', borderRadius: 999,
                                                                background: '#e0f2fe', color: '#0369a1',
                                                                fontSize: 11, fontWeight: 800
                                                            }}>
                                                                {item.customer_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            style={{
                                                                width: 36, height: 36, flexShrink: 0,
                                                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#fee2e2',
                                                                background: '#fff5f5', color: '#ef4444',
                                                                borderRadius: 10, cursor: 'pointer',
                                                                display: 'grid', placeItems: 'center',
                                                                fontSize: 15, boxShadow: '0 4px 10px rgba(239,68,68,0.06)'
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Desktop/Tablet: table */
                                <div style={{ overflowX: 'auto', paddingTop: 14, minWidth: 0 }}>
                                    <table style={{
                                        width: '100%', borderCollapse: 'separate', borderSpacing: 0,
                                        minWidth: isTablet ? 700 : 900
                                    }}>
                                        <thead>
                                            <tr>
                                                {['Mã KH', 'Tên công ty', 'Người liên hệ', 'SĐT', 'Địa chỉ', 'Hành động'].map((h) => (
                                                    <th key={h} style={{
                                                        textAlign: 'left', padding: '12px 16px',
                                                        fontSize: 12, textTransform: 'uppercase',
                                                        letterSpacing: '0.06em', color: '#64748b',
                                                        background: '#f8fafc',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        whiteSpace: 'nowrap'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCustomers.map((item, index) => {
                                                const isHovered = hoveredRowId === item.id;
                                                return (
                                                    <tr key={item.id}
                                                        onMouseEnter={() => setHoveredRowId(item.id)}
                                                        onMouseLeave={() => setHoveredRowId(null)}
                                                        style={{
                                                            background: isHovered ? '#f8fbff' : 'transparent',
                                                            boxShadow: isHovered ? '0 10px 24px rgba(15,23,42,0.06)' : 'none',
                                                            opacity: pageLoaded ? 1 : 0,
                                                            transition: `opacity 360ms ease ${120 + index * 70}ms, background 180ms ease, box-shadow 180ms ease`
                                                        }}
                                                    >
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                padding: '5px 10px', borderRadius: 999,
                                                                background: '#e0f2fe', color: '#0369a1',
                                                                fontSize: 12, fontWeight: 800
                                                            }}>{item.customer_code}</span>
                                                        </td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a', fontWeight: 800 }}>{item.company_name}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.contact_person || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.phone || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.address || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                style={{
                                                                    width: 38, height: 38,
                                                                    borderWidth: '1px', borderStyle: 'solid', borderColor: '#fee2e2',
                                                                    background: '#fff5f5', color: '#ef4444',
                                                                    borderRadius: 12, cursor: 'pointer',
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 16, boxShadow: '0 6px 14px rgba(239,68,68,0.06)'
                                                                }}
                                                            >
                                                                <i className="ri-delete-bin-line" />
                                                            </button>
                                                        )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {renderFormModal()}
        </div>
    );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\ProductsPage.jsx ===
`jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { colors, spacing, radius, shadows, card, btn, input, badge, pageWrap } from '../styles/theme';
import { exportListToExcel } from '../utils/exportList';

// ---- SVG Icons ----
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconPackage = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
  </svg>
);
const IconWarehouse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
  </svg>
);

// ---- Formatted number ----
const fmtVND = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));

// ---- Status badge ----
const StockBadge = ({ status }) => {
  const map = {
    'in-stock':   { label: 'Còn hàng', bg: colors.successSoft, color: colors.success, border: colors.successBorder },
    'low-stock':  { label: 'Sắp hết',  bg: colors.warningSoft, color: colors.warning, border: colors.warningBorder },
    'out-stock':  { label: 'Hết hàng',  bg: colors.dangerSoft, color: colors.danger,  border: colors.dangerBorder },
  };
  const s = map[status] || map['in-stock'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: radius.full,
      fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {status === 'in-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.success, display: 'inline-block' }} />}
      {status === 'low-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.warning, display: 'inline-block' }} />}
      {status === 'out-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.danger, display: 'inline-block' }} />}
      {s.label}
    </span>
  );
};

// ---- Modal overlay ----
const Modal = ({ children, onClose, maxW = 560 }) => {
  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: spacing.md,
    animation: 'fadeIn 200ms ease',
  };
  const panelStyle = {
    background: colors.white, borderRadius: radius.xl,
    boxShadow: shadows.xl, width: '100%', maxWidth: maxW,
    maxHeight: '90vh', overflowY: 'auto',
    animation: 'slideUp 250ms ease',
  };
  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>{children}</div>
    </div>
  );
};

// ---- Modal Header ----
const ModalHeader = ({ title, subtitle, icon, onClose, color = colors.primary }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `1.5px solid ${colors.border}`,
  }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: radius.lg,
          background: color + '18', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.text }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textMuted }}>{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} style={{
      width: 36, height: 36, borderRadius: radius.md,
      background: colors.backgroundAlt, color: colors.textSecondary,
      border: 'none', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      transition: 'all 200ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.dangerSoft; e.currentTarget.style.color = colors.danger; }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.backgroundAlt; e.currentTarget.style.color = colors.textSecondary; }}
    >
      <IconClose />
    </button>
  </div>
);

// ---- Form Field ----
const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: colors.textSecondary }}>
      {label} {required && <span style={{ color: colors.danger }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>{hint}</p>}
  </div>
);

// ---- Form Input ----
const FormInput = ({ style: extraStyle, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`; }}
    onBlur={e => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }}
  />
);

const FormSelect = ({ style: extraStyle, children, ...props }) => (
  <select
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      cursor: 'pointer',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; }}
    onBlur={e => { e.target.style.borderColor = colors.border; }}
  >
    {children}
  </select>
);

// ============================================================

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWHModalOpen, setIsWHModalOpen] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const skuInputRef = useRef(null);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [newSku, setNewSku] = useState('');
  const [nextSku, setNextSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Cái');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newMinStock, setNewMinStock] = useState('50');
  const [searchText, setSearchText] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [initialStock, setInitialStock] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // Category management
  const [categories, setCategories] = useState(['Ống thép', 'Phụ kiện', 'Vật tư', 'Thiết bị']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Warehouse form
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user?.role_id === 1 || user?.role_id === 4;

  // ---- Fetch data ----
  const fetchData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([api.get('/products'), api.get('/warehouses/for-outbound')]);
      setProducts(pRes.data);
      setWarehouses(wRes.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isModalOpen && !isWHModalOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { setIsModalOpen(false); setIsWHModalOpen(false); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, isWHModalOpen]);

  useEffect(() => {
    if (location.state?.filter === 'low-stock') setFilterMode('low-stock');
    if (location.state?.filter === 'all-stock') setFilterMode('all');
  }, [location.state]);

  // ---- Helpers ----
  const parseStockBreakdown = (breakdown = '') =>
    String(breakdown).split(' | ').map(e => e.trim()).filter(Boolean).map(entry => {
      const [warehouseName, qtyText] = entry.split(': ');
      return { warehouseName: warehouseName?.trim() || '', quantity: Number.parseInt(qtyText, 10) || 0 };
    }).filter(e => e.warehouseName);

  const selectedWarehouse = warehouses.find(w => String(w.id) === String(viewFilter));

  const getWarehouseStockRows = (item) => {
    const rows = parseStockBreakdown(item.stock_breakdown);
    if (viewFilter === 'all') return rows;
    return rows.filter(r => r.warehouseName === selectedWarehouse?.name);
  };

  const getDisplayQty = (item) => {
    const totalQty = Number(item.total_stock || item.stock || 0);
    if (viewFilter === 'all') return totalQty;
    return getWarehouseStockRows(item)[0]?.quantity || 0;
  };

  const getStockStatus = (qty, minStock) => {
    if (qty <= 0) return 'out-stock';
    if (qty < minStock) return 'low-stock';
    return 'in-stock';
  };

  const getWarehouseAlerts = (item) => {
    const minStock = Number(item.min_stock) || 50;
    return parseStockBreakdown(item.stock_breakdown)
      .map(r => ({ ...r, status: getStockStatus(r.quantity, minStock), minStock }))
      .filter(r => r.status !== 'in-stock');
  };

  const filteredProducts = products.filter(item => {
    const minStock = Number(item.min_stock) || 50;
    const totalQty = Number(item.total_stock || item.stock || 0);
    const warehouseRows = getWarehouseStockRows(item);
    const viewQty = viewFilter === 'all' ? totalQty : (warehouseRows[0]?.quantity || 0);
    const viewStatus = getStockStatus(viewQty, minStock);
    const warehouseAlerts = getWarehouseAlerts(item);
    const hasLow = warehouseAlerts.some(r => r.status === 'low-stock');
    const hasOut = warehouseAlerts.some(r => r.status === 'out-stock');

    const matchesStatus =
      filterMode === 'all' ||
      (filterMode === 'low-stock' && (viewFilter === 'all' ? hasLow : viewStatus === 'low-stock')) ||
      (filterMode === 'out-stock' && (viewFilter === 'all' ? hasOut : viewStatus === 'out-stock'));

    const search = searchText.trim().toLowerCase();
    const matchesSearch = !search ||
      [item.name, item.sku, item.category].some(v => String(v || '').toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  // ---- Actions ----
  const openAddModal = async () => {
    setEditingId(null);
    setNewSku('');
    setNewName(''); setNewPrice(''); setNewUnit('Cái');
    setNewCategory(''); setNewImageUrl(''); setNewMinStock('50');
    setInitialStock(0); setTargetWarehouse('all');
    try {
      const res = await api.get('/products/next-code');
      setNextSku(res.data.sku || '');
    } catch {
      setNextSku('');
    }
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewSku(product.sku || '');
    setNewName(product.name);
    setNewPrice(product.sale_price);
    setNewUnit(product.unit || 'Cái');
    setNewCategory(product.category || '');
    setNewImageUrl(product.image_url || '');
    setNewMinStock(String(product.min_stock ?? 50));
    setInitialStock('');
    setTargetWarehouse(warehouses[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', { name: whName, location: whLocation });
      setIsWHModalOpen(false); setWhName(''); setWhLocation('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    setCategories(prev => [...prev, name]);
    setNewCategory(name);
    setIsCategoryModalOpen(false);
    setNewCategoryInput('');
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          sku: newSku, name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          adjust_stock: initialStock, target_warehouse: targetWarehouse,
        });
      } else {
        await api.post('/products', {
          sku: nextSku,
          name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          initial_stock: initialStock, warehouse_id: targetWarehouse,
        });
      }
      setIsModalOpen(false); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await api.delete(`/products/${deleteConfirmProduct.id}`);
      setDeleteConfirmProduct(null); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const isFiltered = viewFilter !== 'all' || filterMode !== 'all' || searchText.trim();

  return (
    <div style={pageWrap}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .product-card:hover .card-actions { opacity: 1 !important; }
        @media (max-width: 640px) {
          .prod-wrap { padding: 8px !important; }
          .prod-header { flex-direction: column !important; align-items: flex-start !important; }
          .prod-header-btns { width: 100% !important; }
          .prod-header-btns > * { flex: 1 !important; }
          .prod-filter-row { grid-template-columns: 1fr !important; }
          .prod-filter-row > * { min-width: 0; }
          .prod-status-pills { flex-wrap: wrap !important; }
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 10px !important; }
          .prod-card-img { height: 100px !important; }
          .prod-card-body { padding: 8px !important; }
          .prod-card-title { font-size: 12px !important; line-height: 1.2 !important; }
          .prod-card-price { font-size: 11px !important; }
          .prod-card-qty { font-size: 16px !important; }
          .prod-page-title { font-size: 20px !important; }
          .prod-filter-bar { padding: 12px !important; }
          .prod-header-btns > button { font-size: 12px !important; padding: 8px 12px !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important; gap: 12px !important; }
          .prod-card-img { height: 150px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }} className="prod-wrap">

        {/* ---- PAGE HEADER ---- */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            flexWrap: 'wrap', gap: 16, marginBottom: 24,
            animation: 'fadeUp 400ms ease both',
          }} className="prod-header">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: radius.full,
              background: colors.primarySoft, color: colors.primary,
              fontSize: 12, fontWeight: 700, marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary }} />
              Quản lý
            </div>
            <h1 className="prod-page-title" style={{ margin: 0, fontSize: 30, fontWeight: 900, color: colors.text, letterSpacing: '-0.03em' }}>
              Sản phẩm
            </h1>
            <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 14 }}>
              {loading ? 'Đang tải...' : `${filteredProducts.length} / ${products.length} sản phẩm`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="prod-header-btns">
            <button
              onClick={async () => {
                const rows = filteredProducts.map(p => [
                  p.sku || '',
                  p.name || '',
                  p.category || '',
                  p.unit || '',
                  Number(p.sale_price || 0),
                  Number(p.total_stock || 0),
                  Number(p.min_stock || 0),
                  p.stock_status || '',
                ]);
                await exportListToExcel({
                  filename: 'DanhSachSanPham',
                  sheetName: 'SanPham',
                  title: 'DANH SÁCH SẢN PHẨM',
                  headers: ['SKU', 'Tên sản phẩm', 'Danh mục', 'Đơn vị', 'Đơn giá (VND)', 'Tồn kho', 'Tồn tối thiểu', 'Trạng thái'],
                  rows,
                  colWidths: [16, 36, 14, 10, 16, 12, 14, 14],
                  numberCols: [
                    { col: 5, format: '#,##0 "đ"' },
                    { col: 6, format: '#,##0' },
                    { col: 7, format: '#,##0' },
                  ],
                });
              }}
              style={{
                ...btn('secondary', 'md'),
                borderColor: '#86efac', color: '#15803d',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              }}
            >
              <i className="ri-file-excel-2-line" style={{ fontSize: 16 }} />
              Xuất Excel
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => setIsWHModalOpen(true)}
                  style={{
                    ...btn('secondary', 'md'),
                    borderColor: colors.purpleBorder,
                    color: colors.purple,
                  }}
                >
                  <IconWarehouse /> Kho
                </button>
                <button onClick={openAddModal} style={btn('primary', 'md')}>
                  <IconPlus /> Thêm sản phẩm
                </button>
              </>
            )}
          </div>
        </div>

        {/* ---- FILTER BAR ---- */}
        <div style={{
          ...card({ marginBottom: 20, padding: '16px 20px' }),
          animation: 'fadeUp 400ms ease 80ms both',
        }}>
          {/* Search + Filter Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1fr)',
            gap: 12, alignItems: 'center',
          }} className="prod-filter-row">
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 14px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: radius.md, background: colors.backgroundAlt,
              height: 44, transition: 'border-color 200ms',
            }}
              onFocus={e => e.currentTarget.style.borderColor = colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            >
              <span style={{ color: colors.textMuted, flexShrink: 0 }}><IconSearch /></span>
              <input
                placeholder="Tìm tên, mã SKU, danh mục..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  outline: 'none', color: colors.text, fontSize: 14,
                }}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: colors.textMuted, padding: 0, display: 'flex',
                }}>
                  <IconClose size={14} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 6 }} className="prod-status-pills">
              {[
                { key: 'all', label: 'Tất cả', color: colors.textSecondary },
                { key: 'low-stock', label: 'Sắp hết', color: colors.warning },
                { key: 'out-stock', label: 'Hết hàng', color: colors.danger },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterMode(f.key)} style={{
                  padding: '8px 14px', borderRadius: radius.md,
                  border: `1.5px solid ${filterMode === f.key ? f.color : 'transparent'}`,
                  background: filterMode === f.key ? f.color + '15' : colors.backgroundAlt,
                  color: filterMode === f.key ? f.color : colors.textMuted,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Warehouse filter */}
            <FormSelect
              value={viewFilter}
              onChange={e => setViewFilter(e.target.value)}
              style={{ height: 44 }}
            >
              <option value="all">Tất cả kho</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </FormSelect>
          </div>

          {/* Filter status bar */}
          {isFiltered && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: `1px solid ${colors.borderLight}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                Đang lọc {filteredProducts.length} kết quả
              </span>
              <button
                onClick={() => { setViewFilter('all'); setFilterMode('all'); setSearchText(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: radius.md,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.white, color: colors.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <IconClose size={12} /> Xóa lọc
              </button>
            </div>
          )}
        </div>

        {/* ---- PRODUCT GRID ---- */}
        {loading ? (
          <div style={{ ...card(), textAlign: 'center', padding: 60, color: colors.textMuted }}>
            <div style={{ marginBottom: 12, opacity: 0.5 }}><IconPackage /></div>
            <p>Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            ...card(), textAlign: 'center', padding: 60,
            animation: 'fadeUp 400ms ease 120ms both',
          }}>
            <div style={{ color: colors.textMuted, marginBottom: 12, opacity: 0.4 }}><IconPackage /></div>
            <p style={{ fontWeight: 700, color: colors.text }}>Chưa có sản phẩm nào</p>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {isFiltered ? 'Thử thay đổi bộ lọc để xem thêm sản phẩm.' : 'Bấm "Thêm sản phẩm" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16, marginBottom: 32,
          }} className="prod-grid">
            {filteredProducts.map((item, i) => {
              const minStock = Number(item.min_stock) || 50;
              const displayQty = getDisplayQty(item);
              const status = getStockStatus(displayQty, minStock);
              const warehouseAlerts = getWarehouseAlerts(item);
              const activeWarehouseName = viewFilter === 'all' ? null : selectedWarehouse?.name;
              const activeAlert = activeWarehouseName
                ? warehouseAlerts.find(r => r.warehouseName === activeWarehouseName)
                : null;
              const warehouseSummary = activeAlert
                ? `${activeAlert.warehouseName}: ${activeAlert.status === 'out-stock' ? 'hết' : 'sắp hết'} (${activeAlert.quantity}/${minStock})`
                : null;

              return (
                <div
                  key={item.id}
                  className="product-card"
                  style={{
                    ...card({ padding: 0, overflow: 'hidden' }),
                    animation: `fadeUp 400ms ease ${80 + i * 40}ms both`,
                    transition: 'transform 220ms ease, box-shadow 220ms ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = shadows.lg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.md;
                  }}
                >
                  {/* Image */}
                  <div style={{
                    height: 220, position: 'relative', overflow: 'hidden',
                    background: item.image_url
                      ? `url(${item.image_url}) center/cover no-repeat`
                      : `linear-gradient(160deg, ${colors.primarySoft} 0%, #e8edf8 60%, ${colors.primarySoft}88 100%)`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }} className="prod-card-img">
                    {!item.image_url && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: colors.primary, gap: 6,
                      }}>
                        <IconPackage />
                        <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary, opacity: 0.6 }}>Chưa có ảnh</span>
                      </div>
                    )}
                    {/* SKU chip */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      padding: '3px 8px', borderRadius: radius.full,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      fontSize: 11, fontWeight: 700, color: colors.text,
                      fontFamily: 'monospace',
                    }}>
                      {item.sku}
                    </div>
                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StockBadge status={status} />
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '18px 18px 18px' }} className="prod-card-body">
                    <h3 className="prod-card-title" style={{
                      margin: '0 0 8px', fontSize: 15, fontWeight: 800,
                      color: colors.text, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.name}
                    </h3>

                    {/* Category */}
                    {item.category && (
                      <span style={{
                        display: 'inline-block', marginBottom: 10,
                        padding: '3px 8px', borderRadius: radius.full,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {item.category}
                      </span>
                    )}

                    {/* Warehouse alert */}
                    {warehouseSummary && (
                      <div style={{
                        marginBottom: 10, padding: '7px 10px', borderRadius: radius.md,
                        background: colors.warningSoft, border: `1px solid ${colors.warningBorder}`,
                        fontSize: 11, color: colors.warning, fontWeight: 600,
                      }}>
                        ⚠ {warehouseSummary}
                      </div>
                    )}

                    {/* Price + Stock row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                      paddingTop: 10, borderTop: `1px solid ${colors.borderLight}`,
                      marginTop: 4,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Đơn giá</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: colors.success }} className="prod-card-price">{fmtVND(item.sale_price)} đ</div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>/{item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 22, fontWeight: 900,
                          color: status === 'out-stock' ? colors.danger : status === 'low-stock' ? colors.warning : colors.text,
                        }} className="prod-card-qty">
                          {displayQty}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Tồn kho</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {canEdit && (
                      <div
                        className="card-actions"
                        style={{
                          display: 'flex', gap: 8, marginTop: 12,
                          opacity: hoveredProductId === item.id ? 1 : 0,
                          transition: 'opacity 200ms ease',
                        }}
                      >
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            flex: 1, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.primaryBorder}`,
                            background: colors.primarySoft, color: colors.primary,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          }}
                        >
                          <IconEdit /> Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(item)}
                          style={{
                            width: 38, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.dangerBorder}`,
                            background: colors.dangerSoft, color: colors.danger,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- MODAL: ADD / EDIT PRODUCT ---- */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} maxW={560}>
            <ModalHeader
              title={editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              subtitle={editingId ? 'Cập nhật thông tin và tồn kho' : 'Nhập thông tin sản phẩm mới'}
              icon={editingId ? <IconEdit /> : <IconPackage />}
              color={editingId ? colors.warning : colors.success}
              onClose={() => setIsModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleSubmitProduct}>

                {/* SKU + Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                  <Field label="Mã SKU" required>
                    <FormInput
                      readOnly
                      value={editingId !== null ? newSku : nextSku}
                      placeholder="VD: SP-0001"
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: colors.primarySoft,
                        borderColor: colors.primaryBorder,
                        cursor: 'default',
                      }}
                    />
                  </Field>
                  <Field label="Đơn vị" required>
                    <FormSelect value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                      {['Cái', 'Bộ', 'Hộp', 'Kg', 'Lít', 'Mét', 'Chiếc', 'Bó'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <Field label="Tên sản phẩm" required>
                  <FormInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="VD: Bàn phím cơ Logitech MX" />
                </Field>

                <Field label="Danh mục">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <FormSelect
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </FormSelect>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{
                        height: 42, padding: '0 14px',
                        borderRadius: radius.md,
                        border: `1.5px solid ${colors.primaryBorder}`,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <IconPlus /> Thêm
                    </button>
                  </div>
                </Field>

                <Field label="Ảnh sản phẩm" hint="Dán URL ảnh sản phẩm">
                  <FormInput
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>

                {/* Price + Stock + MinStock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Field label="Đơn giá (đ)" required>
                    <FormInput
                      type="number" min="0"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="320000"
                    />
                  </Field>
                  <Field label={editingId ? 'Tồn mới' : 'Tồn ban đầu'} hint={editingId ? 'Đặt lại tồn kho' : 'Nhập số lượng ban đầu'}>
                    <FormInput
                      type="number" min="0"
                      value={initialStock}
                      onChange={e => setInitialStock(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Tồn tối thiểu" hint="Cảnh báo khi dưới mức">
                    <FormInput
                      type="number" min="0"
                      value={newMinStock}
                      onChange={e => setNewMinStock(e.target.value)}
                      placeholder="50"
                    />
                  </Field>
                </div>

                {/* Warehouse selector */}
                <Field label={editingId ? 'Kho điều chỉnh tồn' : 'Nhập kho ban đầu'}>
                  <FormSelect value={targetWarehouse} onChange={e => setTargetWarehouse(e.target.value)}>
                    {!editingId && <option value="all">Rải đều tất cả kho</option>}
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {editingId ? 'Kho: ' : 'Nhập vào: '}{w.name}
                      </option>
                    ))}
                  </FormSelect>
                </Field>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy bỏ
                  </button>
                  <button type="submit" style={{ ...btn(editingId ? 'primary' : 'success', 'md'), flex: 1 }}>
                    <IconCheck /> {editingId ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD WAREHOUSE ---- */}
        {isWHModalOpen && (
          <Modal onClose={() => setIsWHModalOpen(false)} maxW={420}>
            <ModalHeader
              title="Mở kho hàng mới"
              subtitle="Thêm một kho để phân bổ tồn kho"
              icon={<IconWarehouse />}
              color={colors.purple}
              onClose={() => setIsWHModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleAddWarehouse}>
                <Field label="Tên kho" required>
                  <FormInput
                    value={whName}
                    onChange={e => setWhName(e.target.value)}
                    placeholder="VD: Kho Bình Dương 2"
                    autoFocus
                  />
                </Field>
                <Field label="Vị trí / Địa chỉ">
                  <FormInput
                    value={whLocation}
                    onChange={e => setWhLocation(e.target.value)}
                    placeholder="VD: Số 5, KCN Sóng Thần, Bình Dương"
                  />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setIsWHModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy
                  </button>
                  <button type="submit" style={{ ...btn('primary', 'md'), flex: 1, background: colors.purple }}>
                    <IconPlus /> Lưu kho
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD CATEGORY ---- */}
        {isCategoryModalOpen && (
          <Modal onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }} maxW={380}>
            <ModalHeader
              title="Thêm danh mục mới"
              subtitle="Nhập tên danh mục sản phẩm"
              icon={<IconPlus />}
              color={colors.primary}
              onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
            />
            <div style={{ padding: spacing.lg }}>
              <Field label="Tên danh mục" required>
                <FormInput
                  value={newCategoryInput}
                  onChange={e => setNewCategoryInput(e.target.value)}
                  placeholder="VD: Thiết bị điện"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                />
              </Field>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(c => (
                  <span key={c} style={{
                    padding: '4px 10px', borderRadius: radius.full,
                    background: colors.backgroundAlt, color: colors.textSecondary,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
                  style={btn('secondary', 'md')}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  style={{ ...btn('primary', 'md'), flex: 1 }}
                >
                  <IconPlus /> Thêm danh mục
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: DELETE CONFIRM ---- */}
        {deleteConfirmProduct && (
          <Modal onClose={() => setDeleteConfirmProduct(null)} maxW={440}>
            <div style={{ padding: spacing.lg }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: colors.dangerSoft,
                  color: colors.danger,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <IconAlertTriangle />
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.text }}>Xóa sản phẩm?</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>
                  Bạn có chắc muốn xóa <strong style={{ color: colors.text }}>{deleteConfirmProduct.name}</strong>?<br />
                  Chỉ xóa được khi chưa phát sinh tồn kho.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteConfirmProduct(null)}
                  style={btn('secondary', 'md')}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  style={{ ...btn('danger', 'md'), flex: 1 }}
                >
                  <IconTrash /> Xóa sản phẩm
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\ReceiptsPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import api from '../services/api';

export default function ReceiptsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id || 0;
  const isAdmin = roleId === 1;
  const isWarehouse = roleId === 4;
  const isFactory = roleId === 5;
  const isAuthorized = [1, 4, 5].includes(roleId);
  // Admin: full quyền (tạo, xem, duyệt)
  // Warehouse: chỉ tạo phiếu
  // Factory: chỉ xem + duyệt
  const canCreate = isAdmin || isWarehouse;
  const canApprove = isAdmin || isFactory;

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Phiếu Nhập Kho chỉ dành cho Admin, Kho và Nhà máy.</p>
      </div>
    );
  }

  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [hoveredReceiptId, setHoveredReceiptId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableReady, setTableReady] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [respondTargetId, setRespondTargetId] = useState(null);
  const [respondAction, setRespondAction] = useState('accept');
  const [respondDate, setRespondDate] = useState(new Date().toISOString().split('T')[0]);
  const [respondReason, setRespondReason] = useState('');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCreateOpen(false);
        setIsRespondOpen(false);
        setIsDetailOpen(false);
        setDetailReceipt(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const fetchData = async ({ showTableLoading = false } = {}) => {
    if (showTableLoading) setTableLoading(true);

    try {
      const [recRes, prodRes, whRes] = await Promise.all([api.get('/receipts'), api.get('/products'), api.get('/warehouses/for-outbound')]);
      setReceipts(recRes.data || []);
      setProducts(prodRes.data || []);
      setWarehouses(whRes.data || []);
      if ((whRes.data || []).length > 0) setWarehouseId(String(whRes.data[0].id));
    } catch (error) {
      console.error('Lỗi tải dữ liệu', error);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsContentVisible(true);
    }
  };

  useEffect(() => { fetchData({ showTableLoading: true }); }, []);

  useEffect(() => {
    if (loading) {
      setIsContentVisible(false);
      setTableReady(false);
      return undefined;
    }

    const contentTimer = window.setTimeout(() => setIsContentVisible(true), 60);
    const tableTimer = window.setTimeout(() => setTableReady(true), 180);

    return () => {
      window.clearTimeout(contentTimer);
      window.clearTimeout(tableTimer);
    };
  }, [loading, receipts.length]);

  const statusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Chờ NM duyệt' },
      processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'NM đang giao' },
      completed: { bg: '#d1fae5', color: '#047857', label: 'Đã nhập kho' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'Bị từ chối' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'N/A' };
  };

  const getProductSummary = (receipt) => {
    const items = receipt.items || [];
    if (!items.length) return 'Chưa có sản phẩm';
    return items.map((item) => `${item.product_name || item.product_id} x${item.quantity}`).join(', ');
  };

  const getWarehouseName = (receipt) => receipt.warehouse_name || warehouses.find((w) => String(w.id) === String(receipt.warehouse_id))?.name || '—';

  const filteredReceipts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const receiptStatus = receipt.status || 'unknown';
      const receiptWarehouseId = String(receipt.warehouse_id || '');
      const searchableText = [receipt.receipt_no, receipt.note, receipt.warehouse_name, ...(receipt.items || []).flatMap((item) => [item.product_name, item.product_id])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!keyword || searchableText.includes(keyword)) && (statusFilter === 'all' || receiptStatus === statusFilter) && (warehouseFilter === 'all' || receiptWarehouseId === warehouseFilter);
    });
  }, [receipts, searchTerm, statusFilter, warehouseFilter]);

  const addItem = () => setSelectedItems([...selectedItems, { product_id: '', quantity: 1 }]);
  const updateItem = (index, field, value) => { const newItems = [...selectedItems]; newItems[index][field] = value; setSelectedItems(newItems); };
  const removeItem = (index) => setSelectedItems(selectedItems.filter((_, i) => i !== index));

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsContentVisible(false);
    await fetchData({ showTableLoading: true });
    setRefreshing(false);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert('Chưa chọn sản phẩm!');
    try {
      const res = await api.post('/receipts', { warehouse_id: warehouseId, receipt_date: receiptDate, note, items: selectedItems });
      alert(`Đã gửi yêu cầu nhập hàng! Mã phiếu: ${res.data.receipt_no}`);
      setIsCreateOpen(false);
      setSelectedItems([]);
      setNote('');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      alert('Lỗi tạo phiếu: ' + msg);
    }
  };

  const openRespondModal = (id, action) => { setRespondTargetId(id); setRespondAction(action); setRespondReason(''); setIsRespondOpen(true); };

  const openDetailModal = async (receipt) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailReceipt(receipt);

    try {
      const response = await api.get(`/receipts/${receipt.id}`);
      setDetailReceipt(response.data || receipt);
    } catch (error) {
      console.error('Lỗi tải chi tiết phiếu', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/receipts/${respondTargetId}/respond`, { action: respondAction, expected_date: respondDate, reason: respondReason });
      alert(respondAction === 'accept' ? 'Đã báo lịch giao hàng cho Kho!' : 'Đã từ chối phiếu!');
      setIsRespondOpen(false);
      fetchData();
    } catch (error) {
      const backendMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi hệ thống';
      alert(`Không thể xử lý phiếu: ${backendMessage}`);
    }
  };

  const handleConfirm = async (id) => {
    if (window.confirm('Xác nhận đã nhận đủ hàng? Tồn kho sẽ tự động cộng!')) {
      try {
        await api.put(`/receipts/${id}/confirm`);
        alert('Cộng tồn kho thành công!');
        fetchData();
      } catch {
        alert('Lỗi xác nhận');
      }
    }
  };

  const statIcons = {
    total: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    pending: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
    processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 8h16l-1.2 6.5A2 2 0 0 1 16.83 16H7.17a2 2 0 0 1-1.97-1.5L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
    completed: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
  };

  const stats = [
    { id: 'total', label: 'Tổng phiếu', value: receipts.length, color: '#2563eb', icon: statIcons.total },
    { id: 'pending', label: 'Chờ duyệt', value: receipts.filter((r) => r.status === 'pending').length, color: '#f59e0b', icon: statIcons.pending },
    { id: 'completed', label: 'Đã nhập', value: receipts.filter((r) => r.status === 'completed').length, color: '#10b981', icon: statIcons.completed },
    { id: 'issues', label: 'Đang giao', value: receipts.filter((r) => r.status === 'processing').length, color: '#ef4444', icon: statIcons.processing },
  ];

  const tableWrapStyle = {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e8eef5',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    opacity: isContentVisible ? 1 : 0,
    transform: isContentVisible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 320ms ease, transform 320ms ease',
  };

  const cellStyle = { padding: '16px 18px', verticalAlign: 'top', color: '#334155', fontSize: '14px' };
  const rowBaseStyle = { borderTop: '1px solid #eef2f7', opacity: isContentVisible ? 1 : 0 };
  const rowHoverStyle = { background: 'linear-gradient(90deg, rgba(37,99,235,0.04), rgba(59,130,246,0.02))' };
  const iconButtonStyle = { width: '38px', height: '38px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', color: '#0f172a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' };

  const formatDateForReport = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('vi-VN');
  };

  const exportReceiptsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = 'Báo cáo nhập kho';
    workbook.title = 'Báo cáo nhập kho';
    workbook.company = 'Inventory Management';

    const worksheet = workbook.addWorksheet('Bao cao nhap kho', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', ySplit: 5 }],
    });

    const visibleReceipts = filteredReceipts;

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'BÁO CÁO NHẬP KHO';
    worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Xuất lúc: ${new Date().toLocaleString('vi-VN')}  |  Tổng phiếu: ${visibleReceipts.length}`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF475569' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = `Từ khóa: ${searchTerm || 'Tất cả'}  |  Trạng thái: ${statusFilter === 'all' ? 'Tất cả' : statusStyle(statusFilter).label}  |  Kho: ${warehouseFilter === 'all' ? 'Tất cả' : (warehouses.find((w) => String(w.id) === String(warehouseFilter))?.name || 'Tất cả')}`;
    worksheet.getCell('A3').font = { size: 11, color: { argb: 'FF64748B' } };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    const columns = [
      { header: 'Số phiếu', key: 'receipt_no', width: 18 },
      { header: 'Ngày', key: 'date', width: 14 },
      { header: 'Kho nhập', key: 'warehouse', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Sản phẩm nhập', key: 'items', width: 42 },
      { header: 'Lý do nhập', key: 'note', width: 36 },
      { header: 'Người tạo', key: 'creator', width: 18 },
    ];

    worksheet.columns = columns;
    worksheet.addRow(columns.map((column) => column.header));
    const headerRow = worksheet.getRow(4);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    visibleReceipts.forEach((receipt) => {
      const itemsText = (receipt.items || []).map((item) => `${item.product_name || item.product_id} x${item.quantity}`).join('\n');
      const row = worksheet.addRow({
        receipt_no: receipt.receipt_no || '-',
        date: formatDateForReport(receipt.receipt_date),
        warehouse: getWarehouseName(receipt),
        status: statusStyle(receipt.status).label,
        items: itemsText || 'Không có sản phẩm',
        note: receipt.note || '—',
        creator: receipt.creator_name || '—',
      });

      row.height = Math.max(24, Math.ceil(Math.max(itemsText.length, (receipt.note || '—').length) / 36) * 18);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    worksheet.autoFilter = { from: 'A4', to: 'G4' };
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-nhap-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%)', padding: '20px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rowFadeScaleIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a', letterSpacing: '-0.02em' }}>Nhập kho</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleRefresh} disabled={refreshing} style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: '12px', padding: '10px 16px', fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: refreshing ? 0.85 : 1, fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, filter 160ms ease' }}
              onMouseEnter={(e) => {
                if (refreshing) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = '#bcd0ea';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#dbe3ee';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.filter = 'brightness(1)';
              }}>
              <i className="ri-refresh-line" style={{ fontSize: '16px', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <button
              type="button"
              onClick={exportReceiptsExcel}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 400,
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(34, 197, 94, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 26px rgba(34, 197, 94, 0.32)';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(34, 197, 94, 0.25)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <i className="ri-download-2-line" style={{ fontSize: '16px' }} />
              <span>Xuất Excel</span>
            </button>
            {(roleId === 1 || roleId === 4) && (
              <button onClick={() => setIsCreateOpen(true)} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 400, cursor: 'pointer', boxShadow: '0 10px 22px rgba(37, 99, 235, 0.18)', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 26px rgba(37, 99, 235, 0.24)'; e.currentTarget.style.filter = 'brightness(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(37, 99, 235, 0.18)'; e.currentTarget.style.filter = 'brightness(1)'; }}>+ Tạo Yêu Cầu Nhập</button>
            )}
          </div>
        </div>
        <div style={{ marginBottom: '18px', color: '#64748b' }}>Danh sách phiếu nhập, đồng bộ theo phong cách xuất kho</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {stats.map((stat) => {
            const statHoverStyles = {
              total: { boxShadow: '0 18px 34px rgba(37,99,235,0.14)', borderColor: 'rgba(37,99,235,0.22)' },
              pending: { boxShadow: '0 18px 34px rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.22)' },
              completed: { boxShadow: '0 18px 34px rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' },
              issues: { boxShadow: '0 18px 34px rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.22)' },
            };
            const isHovered = hoveredStat === stat.id;

            return (
              <div
                key={stat.id}
                className="dashboard-hover-card"
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
                  border: '1px solid ' + (isHovered ? (statHoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5'),
                  borderTop: '4px solid ' + (isHovered ? (statHoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5'),
                  borderRadius: '18px',
                  padding: '18px 20px',
                  boxShadow: isHovered ? (statHoverStyles[stat.id]?.boxShadow || '0 18px 34px rgba(15,23,42,0.10)') : '0 10px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  filter: isHovered ? 'saturate(1.03)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: stat.color, color: '#fff', display: 'grid', placeItems: 'center' }}>{stat.icon}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '34px', lineHeight: 1, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div style={tableWrapStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>Bảng nhập kho</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Danh sách phiếu nhập, đồng bộ theo phong cách xuất kho</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm phiếu, sản phẩm, kho..." style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1px solid #dbe3ee' }} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee' }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="processing">Đang giao</option>
                <option value="completed">Đã nhập</option>
                <option value="rejected">Bị từ chối</option>
              </select>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee' }}>
                <option value="all">Tất cả kho</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setWarehouseFilter('all'); }} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#f8fafc', fontWeight: 700 }}>Xóa lọc</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1280px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                  <th style={{ ...cellStyle, width: '120px' }}>Số phiếu</th>
                  <th style={{ ...cellStyle, width: '130px' }}>Ngày</th>
                  <th style={{ ...cellStyle, width: '180px' }}>Kho nhập</th>
                  <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm nhập</th>
                  <th style={{ ...cellStyle, width: '180px' }}>Ghi chú</th>
                  <th style={{ ...cellStyle, width: '170px' }}>Trạng thái</th>
                  <th style={{ ...cellStyle, width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading || refreshing ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} style={rowBaseStyle}>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '80px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '90px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '130px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '100%' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '120px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '24px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '90px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '38px', width: '38px', borderRadius: '12px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} /></td>
                    </tr>
                  ))
                ) : filteredReceipts.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có phiếu nhập nào.</td></tr>
                ) : filteredReceipts.map((r, index) => {
                  const s = statusStyle(r.status);
                  const isHovered = hoveredReceiptId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onMouseEnter={() => setHoveredReceiptId(r.id)}
                      onMouseLeave={() => setHoveredReceiptId(null)}
                      style={{ ...rowBaseStyle, ...(isHovered ? rowHoverStyle : {}), animation: tableReady ? `rowFadeScaleIn 420ms cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(260, index * 70)}ms both` : 'none' }}
                    >
                      <td style={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>{r.receipt_no}</td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                          <span>{new Date(r.receipt_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ri-store-2-line" style={{ color: '#94a3b8' }} />
                          <span>{getWarehouseName(r)}</span>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: '#475569', lineHeight: 1.6 }}>{getProductSummary(r)}</td>
                      <td style={{ ...cellStyle, color: '#475569' }}>{r.note || '—'}</td>
                      <td style={cellStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: '999px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700 }}>{s.label}</span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        {(r.status === 'pending') && (roleId === 1 || roleId === 5) && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openRespondModal(r.id, 'accept')}
                              style={{ padding: '9px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => openRespondModal(r.id, 'reject')}
                              style={{ padding: '9px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}

                        {r.status === 'processing' && (roleId === 1 || roleId === 4) && (
                          <button type="button" onClick={() => handleConfirm(r.id)} style={{ padding: '10px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Xác nhận</button>
                        )}

                        {r.status !== 'pending' && r.status !== 'processing' && (
                          <button type="button" onClick={() => openDetailModal(r)} style={iconButtonStyle} title="Xem chi tiết phiếu">
                            <i className="ri-eye-line" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(720px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tạo yêu cầu nhập</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>Kho: Yêu cầu nhập hàng</h3>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }}>
                  <option value="">-- Chọn kho muốn nhập --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <input required type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
                <input placeholder="Lý do / ghi chú" value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
              </div>

              <div style={{ border: '1px solid #e5eef8', borderRadius: '18px', background: '#f8fbff', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>Sản phẩm nhập</div>
                  <button type="button" onClick={addItem} style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+ Thêm sản phẩm</button>
                </div>

                {selectedItems.length === 0 && (
                  <div style={{ padding: '14px', border: '1px dashed #cbd5e1', borderRadius: '14px', color: '#64748b', background: '#fff' }}>Chưa có sản phẩm nào. Bấm “Thêm sản phẩm” để chọn hàng cần nhập.</div>
                )}

                {selectedItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 120px 44px', gap: '10px', marginBottom: '10px' }}>
                    <select required value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)} style={{ padding: '11px 12px', border: '1px solid #dbe3ee', borderRadius: '12px', outline: 'none' }}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input required type="number" min="1" placeholder="SL" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} style={{ padding: '11px 12px', border: '1px solid #dbe3ee', borderRadius: '12px', outline: 'none' }} />
                    <button type="button" onClick={() => removeItem(index)} style={{ borderRadius: '12px', border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Gửi yêu cầu</button>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #dbe3ee', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRespondOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: respondAction === 'accept' ? '#2563eb' : '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{respondAction === 'accept' ? 'Duyệt phiếu' : 'Từ chối phiếu'}</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{respondAction === 'accept' ? 'Hẹn ngày giao hàng' : 'Xác nhận lý do từ chối'}</h3>
              </div>
              <button type="button" onClick={() => setIsRespondOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleRespond} style={{ padding: '22px 24px 24px' }}>
              {respondAction === 'accept' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#334155' }}>Ngày giao dự kiến</label>
                  <input required type="date" value={respondDate} onChange={(e) => setRespondDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#334155' }}>Lý do / lời nhắn</label>
                <textarea required value={respondReason} onChange={(e) => setRespondReason(e.target.value)} placeholder={respondAction === 'accept' ? 'VD: Dự kiến giao vào ngày 25/04...' : 'VD: Không đủ nguyên liệu để sản xuất...'} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px 16px', background: respondAction === 'accept' ? '#2563eb' : '#ef4444', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>{respondAction === 'accept' ? 'Duyệt' : 'Từ chối'}</button>
                <button type="button" onClick={() => setIsRespondOpen(false)} style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #dbe3ee', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chi tiết phiếu nhập</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{detailReceipt.receipt_no}</h3>
              </div>
              <button type="button" onClick={() => setIsDetailOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ padding: '22px 24px 24px' }}>
              {detailLoading || !detailReceipt ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Đang tải chi tiết phiếu...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày phiếu</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{new Date(detailReceipt.receipt_date).toLocaleDateString('vi-VN')}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Kho nhập</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{getWarehouseName(detailReceipt)}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Trạng thái</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{statusStyle(detailReceipt.status).label}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Ghi chú</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{detailReceipt.note || '—'}</div></div>
                  </div>

                      <div style={{ border: '1px solid #e5eef8', borderRadius: '18px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fbff', borderBottom: '1px solid #e5eef8', fontWeight: 800, color: '#0f172a' }}>Sản phẩm</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: '#fff' }}>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7' }}>Tên sản phẩm</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', width: '140px' }}>Số lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailReceipt.items || []).map((item, idx) => (
                          <tr key={`${item.product_id}-${idx}`}>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7' }}>{item.product_name || item.product_id}</td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', fontWeight: 700 }}>{item.quantity}</td>
                          </tr>
                        ))}
                        {(!detailReceipt.items || detailReceipt.items.length === 0) && (
                          <tr><td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Không có sản phẩm</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
    

`

## === FILE: D:\Doan_5\frontend\src\pages\OutboundsPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import api from '../services/api';

export default function OutboundsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthorized = [1, 4].includes(user?.role_id);
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [warehouseAction, setWarehouseAction] = useState('xoa_don');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Responsive ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1200 : false
  );

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1200);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pagePad = isMobile ? 12 : isTablet ? 16 : 20;
  const statCols = isMobile ? 2 : isTablet ? 2 : 4;
  const cardR = isMobile ? 14 : 18;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsConfirmOpen(false);
        setIsDetailOpen(false);
        setSelectedOrder(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const fetchData = async ({ showTableLoading = false } = {}) => {
    if (showTableLoading) setLoading(true);

    try {
      const [pendingRes, whRes] = await Promise.all([api.get('/outbounds/pending'), api.get('/warehouses/for-outbound')]);
      setOrders(pendingRes.data || []);
      setWarehouses(whRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ showTableLoading: true });
  }, []);

  useEffect(() => {
    if (targetWarehouse) {
      api.get(`/outbounds/warehouse/${targetWarehouse}/stock`)
        .then(r => setWarehouseStock(r.data || []))
        .catch(() => setWarehouseStock([]));
    } else {
      setWarehouseStock([]);
    }
  }, [targetWarehouse]);

  useEffect(() => {
    if (loading) {
      setIsContentVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setIsContentVisible(true), 60);
    return () => window.clearTimeout(timer);
  }, [loading, orders.length]);

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        id: String(warehouse.id),
        label: warehouse.name || warehouse.code || `Kho ${warehouse.id}`,
      })),
    [warehouses],
  );

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = order.order_status || order.status || 'unknown';
      const orderWarehouseId = String(order.warehouse_id || order.warehouse?.id || order.warehouseId || '');
      const searchableText = [
        order.order_no,
        order.customer_name,
        order.warehouse_name,
        order.warehouse_code,
        order.delivery_note,
        order.note,
        ...(order.items || []).flatMap((item) => [item.product_name, item.product_sku]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
      const matchesWarehouse = warehouseFilter === 'all' || orderWarehouseId === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [orders, searchTerm, statusFilter, warehouseFilter]);

  const getDisplayDate = (order) => order.order_date || order.expected_delivery_date || order.updated_at || order.created_at || '-';

  const getWarehouseDisplay = (order) => order.warehouse_name || order.warehouse_code || 'Chọn kho để hiện';

  const getTotalAmount = (order) => {
    const amount = order.total_amount ?? 0;
    return Number(amount || 0);
  };

  const getItemsPreview = (order) => {
    const items = order.items || [];
    if (!items.length) return 'Không có sản phẩm';
    return items.map((item) => `${item.product_name || 'Sản phẩm'}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`).join('\n');
  };

  const isCompletedOrder = (order) => ['completed', 'canceled'].includes(order.order_status || order.status);

  const statusStyle = (status) => {
    const map = {
      shipping: { bg: '#f3e8ff', color: '#6b21a8', label: 'Đang giao' },
      warehouse_processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Kho đang xử lý' },
      logistics_review: { bg: '#ede9fe', color: '#6d28d9', label: 'Logistics duyệt' },
      returned: { bg: '#fee2e2', color: '#b91c1c', label: 'Bị từ chối' },
      completed: { bg: '#d1fae5', color: '#047857', label: 'Giao thành công' },
      canceled: { bg: '#f3f4f6', color: '#4b5563', label: 'Hủy đơn' }, // 👉 ĐÃ THÊM DÒNG NÀY (MÀU XÁM)
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'N/A' };
  };

  const handleExport = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !targetWarehouse) return;

    try {
      const res = await api.post('/outbounds', {
        order_id: selectedOrder.id,
        warehouse_id: targetWarehouse,
        export_date: new Date().toISOString().split('T')[0],
        note: selectedOrder.note || '',
      });

      alert(res.data.message);
      setIsConfirmOpen(false);
      setTargetWarehouse('');
      setWarehouseStock([]);
      setSelectedOrder(null);
      await fetchData({ showTableLoading: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xuất kho');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !rejectReason) return;
    try {
      await api.put(`/outbounds/${selectedOrder.id}/respond`, {
        action: 'reject',
        reason: rejectReason,
        warehouse_action: warehouseAction,
      });
      alert('Đã gửi từ chối về Sales. Sales sẽ xử lý.');
      setIsRejectOpen(false);
      setRejectReason('');
      setWarehouseAction('xoa_don');
      setSelectedOrder(null);
      await fetchData({ showTableLoading: true });
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatDateForReport = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('vi-VN');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsContentVisible(false);
    await fetchData({ showTableLoading: true });
    setRefreshing(false);
  };

  const exportOutboundsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = 'Báo cáo xuất kho';
    workbook.title = 'Báo cáo xuất kho';
    workbook.company = 'Inventory Management';
    workbook.calcProperties.fullCalcOnLoad = true;

    const worksheet = workbook.addWorksheet('Bao cao xuat kho', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', ySplit: 6 }],
    });

    const visibleOrders = filteredOrders;
    const totalAmount = visibleOrders.reduce((sum, order) => sum + getTotalAmount(order), 0);

    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'BÁO CÁO XUẤT KHO';
    worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    worksheet.getRow(1).height = 26;

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `Xuất lúc: ${new Date().toLocaleString('vi-VN')}  |  Tổng đơn: ${visibleOrders.length}  |  Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} đ`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF475569' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `Từ khóa: ${searchTerm || 'Tất cả'}  |  Trạng thái: ${statusFilter === 'all' ? 'Tất cả' : statusStyle(statusFilter).label}  |  Kho: ${warehouseFilter === 'all' ? 'Tất cả' : (warehouseOptions.find((item) => item.id === warehouseFilter)?.label || 'Tất cả')}`;
    worksheet.getCell('A3').font = { size: 11, color: { argb: 'FF64748B' } };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    const columns = [
      { header: 'Mã đơn', key: 'order_no', width: 18 },
      { header: 'Ngày', key: 'date', width: 14 },
      { header: 'Khách hàng', key: 'customer', width: 24 },
      { header: 'Kho', key: 'warehouse', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Sản phẩm', key: 'items', width: 42 },
      { header: 'Ghi chú logistics', key: 'note', width: 36 },
      { header: 'Tổng tiền', key: 'amount', width: 18 },
    ];

    worksheet.columns = columns;
    worksheet.addRow(columns.map((column) => column.header));
    const headerRow = worksheet.getRow(4);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    visibleOrders.forEach((order) => {
      const items = (order.items || [])
        .map((item) => `${item.product_name || 'Sản phẩm'}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`)
        .join('\n');
      const row = worksheet.addRow({
        order_no: order.order_no || '-',
        date: formatDateForReport(getDisplayDate(order)),
        customer: order.customer_name || '—',
        warehouse: getWarehouseDisplay(order),
        status: statusStyle(order.order_status || order.status).label,
        items: items || 'Không có sản phẩm',
        note: order.delivery_note || order.note || '—',
        warehouse_note: order.warehouse_note || '—',
        amount: `${getTotalAmount(order).toLocaleString('vi-VN')} đ`,
      });

      row.height = Math.max(24, Math.ceil(Math.max(items.length, (order.delivery_note || order.note || '—').length) / 36) * 18);
      row.eachCell((cell) => {
        if (cell.value === order.order_no || cell.value === formatDateForReport(getDisplayDate(order))) {
          cell.font = { color: { argb: 'FF0F172A' } };
        }
        if (cell.value === order.customer_name || cell.value === getWarehouseDisplay(order)) {
          cell.font = { color: { argb: 'FF334155' } };
        }
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      const statusCell = row.getCell(5);
      const statusPalette = {
        'Chờ xuất': 'FFF59E0B',
        'Kho đang xử lý': 'FF3B82F6',
        'Logistics duyệt': 'FFA855F7',
        'Bị từ chối': 'FFEF4444',
        'Đã xuất': 'FF10B981',
      };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusPalette[statusCell.value] || 'FFF3F4F6' } };
      statusCell.font = { bold: true, color: { argb: statusCell.value === 'Chờ xuất' || statusCell.value === 'Logistics duyệt' ? 'FF1F2937' : 'FFFFFFFF' } };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      const amountCell = row.getCell(8);
      amountCell.font = { bold: true, color: { argb: 'FF0F172A' } };
      amountCell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
    });

    const totalRowIndex = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${totalRowIndex}:G${totalRowIndex}`);
    worksheet.getCell(`A${totalRowIndex}`).value = 'TỔNG CỘNG';
    worksheet.getCell(`A${totalRowIndex}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${totalRowIndex}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`A${totalRowIndex}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    worksheet.getCell(`A${totalRowIndex}`).border = {
      top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };
    worksheet.getCell(`H${totalRowIndex}`).value = `${totalAmount.toLocaleString('vi-VN')} đ`;
    worksheet.getCell(`H${totalRowIndex}`).font = { bold: true, size: 12, color: { argb: 'FF1D4ED8' } };
    worksheet.getCell(`H${totalRowIndex}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`H${totalRowIndex}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    worksheet.getCell(`H${totalRowIndex}`).border = {
      top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };

    worksheet.autoFilter = { from: 'A4', to: 'H4' };
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-xuat-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const iconButtonStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: '1px solid #dbe3ee',
    background: '#fff',
    color: '#0f172a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease',
  };

  const actionButtonStyle = {
    padding: '10px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
    whiteSpace: 'nowrap',
    transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  };

  const rowBaseStyle = {
    borderTop: '1px solid #eef2f7',
    transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 220ms ease',
    opacity: isContentVisible ? 1 : 0,
  };

  const rowHoverStyle = {
    background: '#ffffff',
  };

  const tableWrapStyle = {
    background: '#fff',
    borderRadius: cardR,
    border: '1px solid #e8eef5',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    opacity: isContentVisible ? 1 : 0,
    transform: isContentVisible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 320ms ease, transform 320ms ease',
  };

  const tableStyle = {
    width: '100%',
    minWidth: isMobile ? 0 : 900,
    borderCollapse: 'separate',
    borderSpacing: 0,
  };

  const cellStyle = {
    padding: '16px 18px',
    verticalAlign: 'top',
    color: '#334155',
    fontSize: '14px',
  };

  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
  const skeletonCellStyle = {
    height: '14px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
  };

  const statIcons = {
    total: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
    completed: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    warehouse: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
  };

  const stats = [
    {
      id: 'total',
      label: 'Tổng đơn',
      value: orders.length,
      color: '#2563eb',
      icon: statIcons.total
    },
    {
      id: 'pending',
      label: 'Chờ xử lý',
      // Chỉ đếm đơn: Kho đang xử lý (warehouse_processing) + Đang giao (shipping)
      value: orders.filter((o) => ['warehouse_processing', 'shipping'].includes(o.order_status || o.status)).length,
      color: '#f59e0b',
      icon: statIcons.processing
    },
    {
      id: 'completed',
      label: 'Đã hoàn tất',
      // Những đơn đã xong thực sự: Giao thành công (completed) + Hủy đơn (canceled)
      value: orders.filter((o) => ['completed', 'canceled'].includes(o.order_status || o.status)).length,
      color: '#10b981',
      icon: statIcons.completed
    },
    {
      id: 'issues',
      label: 'Kho khả dụng',
      value: warehouses.length,
      color: '#0f172a',
      icon: statIcons.warehouse
    },
  ];

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Phiếu Xuất Kho chỉ dành cho Admin và Kho.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%)', padding: pagePad }}>
      <style>{`
        @keyframes rowFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-animate {
          animation: modalFadeIn 180ms ease-out;
        }

        .modal-panel-animate {
          animation: modalScaleIn 220ms ease-out;
        }

        @media (max-width: 768px) {
          .ob-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .ob-filter-row { grid-template-columns: 1fr !important; }
          .ob-detail-grid { grid-template-columns: 1fr !important; }
          .ob-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, color: '#0f172a', letterSpacing: '-0.02em' }}>Xuất kho</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 12 : 14, lineHeight: 1.6 }}>Danh sách đơn chờ xuất, tối ưu cho thao tác nhanh</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: '12px', padding: '10px 16px', fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: refreshing ? 0.85 : 1, fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, filter 160ms ease' }}
              onMouseEnter={(e) => {
                if (refreshing) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = '#bcd0ea';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#dbe3ee';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <i className="ri-refresh-line" style={{ fontSize: '16px', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <button
              type="button"
              onClick={exportOutboundsExcel}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(34, 197, 94, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 26px rgba(34, 197, 94, 0.32)';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(34, 197, 94, 0.25)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <i className="ri-download-2-line" style={{ fontSize: '16px' }} />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`, gap: isMobile ? 10 : 14, marginBottom: isMobile ? 12 : 18 }} className="ob-stat-grid">
          {stats.map((stat) => {
            const statHoverStyles = {
              total: { boxShadow: '0 18px 34px rgba(37,99,235,0.14)', borderColor: 'rgba(37,99,235,0.22)' },
              pending: { boxShadow: '0 18px 34px rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.22)' },
              completed: { boxShadow: '0 18px 34px rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' },
              issues: { boxShadow: '0 18px 34px rgba(220,38,38,0.14)', borderColor: 'rgba(220,38,38,0.22)' },
            };
            const isHovered = hoveredStat === stat.id;

            return (
              <div
                key={stat.id}
                className="dashboard-hover-card"
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
                  border: '1px solid ' + (isHovered ? (statHoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5'),
                  borderTop: '4px solid ' + (isHovered ? (statHoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5'),
                  borderRadius: isMobile ? 14 : 18,
                  padding: isMobile ? '14px 14px' : '18px 20px',
                  boxShadow: isHovered ? (statHoverStyles[stat.id]?.boxShadow || '0 18px 34px rgba(15,23,42,0.10)') : '0 10px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  filter: isHovered ? 'saturate(1.03)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: stat.color, color: '#fff', display: 'grid', placeItems: 'center', transition: 'transform 0.2s ease' }}>{stat.icon}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '34px', lineHeight: 1, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div style={tableWrapStyle}>
          <div style={{ padding: '18px 20px 10px', borderBottom: '1px solid #eef2f7' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '18px' }}>Bảng xuất kho</div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Bộ lọc phía dưới sẽ được áp dụng khi xuất Excel.</div>
          </div>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'minmax(0, 2fr) repeat(2, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'center' }} className="ob-filter-row">
              <div style={{ position: 'relative' }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm sản phẩm, đơn hàng..."
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="shipping">Đang giao</option>
                <option value="warehouse_processing">Kho đang xử lý</option>
                <option value="returned">Bị từ chối</option>
                <option value="canceled">Hủy đơn</option>
                <option value="completed">Giao thành công</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="all">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setWarehouseFilter('all');
                }}
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', color: '#0f172a', whiteSpace: 'nowrap' }}
              >
                Xóa lọc
              </button>

            </div>
          </div>

          {loading ? (
            <div style={{ overflowX: 'auto', padding: '16px 20px 20px' }}>
              <table style={tableStyle} aria-hidden="true">
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Mã đơn</th>
                    <th style={{ ...cellStyle, width: '110px', whiteSpace: 'nowrap' }}>Ngày</th>
                    <th style={{ ...cellStyle, width: '180px', whiteSpace: 'nowrap' }}>Khách hàng</th>
                    <th style={{ ...cellStyle, width: '180px' }}>Kho</th>
                    <th style={{ ...cellStyle, width: '170px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                    <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm</th>
                    <th style={{ ...cellStyle, width: '140px', whiteSpace: 'nowrap' }}>Tổng tiền</th>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {skeletonRows.map((row) => (
                    <tr key={row} style={{ borderTop: '1px solid #eef2f7' }}>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '92px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '72px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '132px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '118px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '108px', height: '30px' }} /></td>
                      <td style={cellStyle}>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <div style={{ ...skeletonCellStyle, width: '85%' }} />
                          <div style={{ ...skeletonCellStyle, width: '68%' }} />
                        </div>
                      </td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '98px' }} /></td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <div style={{ ...skeletonCellStyle, width: '96px', height: '38px', margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Mã đơn</th>
                    <th style={{ ...cellStyle, width: '110px', whiteSpace: 'nowrap' }}>Ngày</th>
                    <th style={{ ...cellStyle, width: '180px', whiteSpace: 'nowrap' }}>Khách hàng</th>
                    <th style={{ ...cellStyle, width: '180px' }}>Kho</th>
                    <th style={{ ...cellStyle, width: '170px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                    <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm</th>
                    <th style={{ ...cellStyle, width: '140px', whiteSpace: 'nowrap' }}>Tổng tiền</th>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có phiếu yêu cầu xuất kho nào.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, index) => {
                      const s = statusStyle(o.order_status || o.status);
                      const isHovered = hoveredOrderId === o.id;

                      return (
                        <tr
                          key={o.id}
                          onMouseEnter={() => setHoveredOrderId(o.id)}
                          onMouseLeave={() => setHoveredOrderId(null)}
                          style={{
                            ...rowBaseStyle,
                            ...(isHovered ? rowHoverStyle : {}),
                            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: isHovered ? '0 8px 20px rgba(15, 23, 42, 0.04)' : 'none',
                            animation: isContentVisible ? `rowFadeIn 420ms ease ${Math.min(240, index * 45)}ms both` : 'none',
                          }}
                        >
                          <td style={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>{o.order_no}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                              <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                              <span>{String(getDisplayDate(o)).slice(0, 10)}</span>
                            </div>
                          </td>
                          <td style={{ ...cellStyle, color: '#0f172a', fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-user-3-line" style={{ color: '#94a3b8' }} />
                              <span>{o.customer_name || '—'}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-store-2-line" style={{ color: '#94a3b8' }} />
                              <span>{getWarehouseDisplay(o)}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                              {/* Thẻ hiển thị Trạng Thái (giữ nguyên của bạn bà) */}
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: '999px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700, boxShadow: isHovered ? '0 6px 14px rgba(15,23,42,0.08)' : 'none', transition: 'all 160ms ease' }}>
                                {s.label}
                              </span>
                              
                              {/* 👉 CHÈN THÊM: Ngày xuất kho (Chỉ hiện khi đơn đã được Kho xuất) */}
                              {o.export_date && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                                    <i className="ri-calendar-check-line"></i> Xuất: {new Date(o.export_date).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...cellStyle, color: '#475569', lineHeight: 1.6 }}>
                            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>{getItemsPreview(o)}</div>
                          </td>
                          <td style={{ ...cellStyle, fontWeight: 800, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-coins-line" style={{ color: '#94a3b8' }} />
                              <span>{getTotalAmount(o).toLocaleString('vi-VN')} đ</span>
                            </div>
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            {/* 👉 ĐÃ SỬA: Chỉ hiện nút Xuất khi trạng thái đích danh là Kho đang xử lý */}
                            {(o.order_status || o.status) === 'warehouse_processing' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setTargetWarehouse('');
                                    setWarehouseStock([]);
                                    setIsConfirmOpen(true);
                                  }}
                                  style={actionButtonStyle}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 12px 22px rgba(37, 99, 235, 0.22)';
                                    e.currentTarget.style.filter = 'brightness(1.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 18px rgba(37, 99, 235, 0.18)';
                                    e.currentTarget.style.filter = 'brightness(1)';
                                  }}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="ri-truck-line" />
                                    <span>Xuất kho</span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedOrder(o); setIsRejectOpen(true); }}
                                  style={{ ...actionButtonStyle, background: '#ef4444', boxShadow: '0 8px 18px rgba(239,68,68,0.2)' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 12px 22px rgba(239,68,68,0.22)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 18px rgba(239,68,68,0.2)';
                                  }}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="ri-close-line" />
                                    <span>Từ chối</span>
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(o)}
                                style={iconButtonStyle}
                                title="Xem chi tiết"
                                aria-label="Xem chi tiết"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.10)';
                                  e.currentTarget.style.borderColor = '#bcd0ea';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.05)';
                                  e.currentTarget.style.borderColor = '#dbe3ee';
                                }}
                              >
                                <i className="ri-eye-line" style={{ fontSize: '18px' }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal xuất kho */}
      {isConfirmOpen && selectedOrder && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '28px', borderRadius: '18px', width: 'min(640px, 95vw)', maxHeight: '90vh', overflowY: 'auto', transformOrigin: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Xuất kho cho đơn #{selectedOrder.order_no}</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>{selectedOrder.customer_name}</p>
              </div>
              <button type="button" onClick={() => { setIsConfirmOpen(false); setTargetWarehouse(''); setWarehouseStock([]); }}
                style={{ ...iconButtonStyle, width: '40px', height: '40px' }}>
                <i className="ri-close-line" style={{ fontSize: '18px' }} />
              </button>
            </div>

            {/* Thông tin sản phẩm */}
            <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Sản phẩm trong đơn</div>
              {(selectedOrder.items || []).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.product_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.product_sku}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#2563eb' }}>x{item.quantity}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleExport}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 800, color: '#0f172a' }}>Chọn kho xuất <span style={{ color: '#ef4444' }}>*</span></label>
                <select required value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}>
                  <option value="">-- Chọn kho --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {/* Hiện tồn kho khi đã chọn kho */}
              {targetWarehouse && (
                <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', marginBottom: '10px', textTransform: 'uppercase' }}>Tồn kho tại kho đã chọn</div>
                  {warehouseStock.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Đang tải...</div>
                  ) : (
                    (selectedOrder.items || []).map((item) => {
                      const stock = warehouseStock.find((s) => s.product_id === item.product_id);
                      const onHand = stock?.on_hand_qty || 0;
                      const enough = onHand >= item.quantity;
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                          <div style={{ fontSize: '13px' }}>{item.product_name}</div>
                          <span style={{ fontWeight: 800, color: enough ? '#166534' : '#dc2626', fontSize: '13px' }}>
                            {onHand} / cần {item.quantity}
                            {!enough && <span style={{ marginLeft: '6px' }}>⚠</span>}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '15px', boxShadow: '0 8px 18px rgba(16,185,129,0.2)' }}>
                  <i className="ri-truck-line" style={{ marginRight: '8px' }} />Xuất kho
                </button>
                <button type="button" onClick={() => { setIsConfirmOpen(false); setTargetWarehouse(''); setWarehouseStock([]); }}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, color: '#475569', fontSize: '14px' }}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal từ chối */}
      {isRejectOpen && selectedOrder && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '28px', borderRadius: '18px', width: 'min(520px, 95vw)', transformOrigin: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#b91c1c', fontSize: '20px' }}>Kho từ chối xuất hàng</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Đơn #{selectedOrder.order_no} — {selectedOrder.customer_name}</p>
              </div>
              <button type="button" onClick={() => { setIsRejectOpen(false); setRejectReason(''); }}
                style={{ ...iconButtonStyle, width: '40px', height: '40px' }}>
                <i className="ri-close-line" style={{ fontSize: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 800 }}>Lý do từ chối <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea required rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Hết hàng trong kho, sai địa chỉ giao hàng..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 800 }}>Hướng xử lý cho Sales</label>
                <select value={warehouseAction} onChange={(e) => setWarehouseAction(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}>
                  <option value="xoa_don">Xóa đơn hàng</option>
                  <option value="doi_ngay">Dời ngày giao</option>
                  <option value="thay_doi_so_luong">Thay đổi số lượng</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '15px', boxShadow: '0 8px 18px rgba(239,68,68,0.2)' }}>
                  <i className="ri-close-line" style={{ marginRight: '8px' }} />Gửi từ chối
                </button>
                <button type="button" onClick={() => { setIsRejectOpen(false); setRejectReason(''); }}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, color: '#475569', fontSize: '14px' }}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedOrder && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '28px', borderRadius: '18px', width: 'min(720px, 92vw)', maxHeight: '88vh', overflowY: 'auto', transformOrigin: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Chi tiết đơn hàng</h3>
              <button type="button" onClick={() => setIsDetailOpen(false)} style={{ ...iconButtonStyle, width: '40px', height: '40px' }} aria-label="Đóng">
                <i className="ri-close-line" style={{ fontSize: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '18px' }} className="ob-detail-grid">
              <div><b>Mã đơn:</b> {selectedOrder.order_no}</div>
              <div><b>Trạng thái:</b> {statusStyle(selectedOrder.order_status || selectedOrder.status).label}</div>
              <div><b>Khách hàng:</b> {selectedOrder.customer_name || '—'}</div>
              <div><b>Kho liên quan:</b> {getWarehouseDisplay(selectedOrder)}</div>
              <div><b>Ngày:</b> {String(getDisplayDate(selectedOrder)).slice(0, 10)}</div>
              <div><b>Tổng tiền:</b> {getTotalAmount(selectedOrder).toLocaleString('vi-VN')} đ</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b>Ghi chú logistics:</b>
              <div style={{ whiteSpace: 'pre-line', marginTop: '6px', color: '#475569' }}>{selectedOrder.delivery_note || selectedOrder.note || '—'}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b>Sản phẩm</b>
              <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Tên</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px' }}>{item.product_name || 'Sản phẩm'}</td>
                        <td>{item.quantity}</td>
                        <td>{Number(item.unit_price || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\ReturnsPage.jsx ===
`jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const LOGISTICS_ACTION_LABELS = {
  loi_nha_may:  'Lỗi do nhà máy',
  loi_van_tai:  'Lỗi do vận chuyển',
};

const ACTION_OUTCOMES = {
  loi_nha_may: {
    icon: 'ri-error-warning-line',
    iconBg: '#fee2e2', iconColor: '#991b1b',
    headline: 'Kho lỗi + Phiếu bù nhà máy',
    detail: 'Hàng đưa vào kho lỗi. Phiếu bù sẽ gửi nhà máy để xác nhận bù hàng.',
    note: 'Hàng lỗi → Kho lỗi → Phiếu bù → Nhà máy xác nhận bù',
    badge: { bg: '#fee2e2', color: '#991b1b' },
  },
  loi_van_tai: {
    icon: 'ri-truck-line',
    iconBg: '#e0f2fe', iconColor: '#0369a1',
    headline: 'Kho lỗi (tự chịu)',
    detail: 'Hàng lỗi do vận chuyển. Đưa vào kho lỗi — công ty tự chịu thiệt hại.',
    note: 'Hàng lỗi VC → Kho lỗi → Tự chịu',
    badge: { bg: '#e0f2fe', color: '#0369a1' },
  },
};

const PAGE_STYLES = {
  page: (pad) => ({ minHeight: '100vh', padding: pad, background: 'radial-gradient(circle at top left, #fff7ed 0%, #f8fafc 35%, #f3f4f6 100%)', color: '#0f172a' }),
  shell: { maxWidth: '1400px', margin: '0 auto' },
  heroTitle: (fs) => ({ margin: 0, fontSize: fs, letterSpacing: '-0.03em' }),
  heroSub: { margin: '8px 0 0', color: '#64748b', fontSize: '14px' },
  statGrid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '14px', marginBottom: '22px' }),
  statCard: { background: 'rgba(255,255,255,0.92)', borderRadius: '22px', padding: '20px', boxShadow: '0 12px 24px rgba(15,23,42,0.08)', border: '1px solid rgba(148,163,184,0.18)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px' },
  section: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(15,23,42,0.08)', overflow: 'hidden', marginBottom: '22px' },
  sectionHeader: { padding: '22px 24px 0' },
  sectionTitle: { margin: 0, fontSize: '20px' },
  tableWrap: { padding: '18px 24px 24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: 700 },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', borderBottom: '1px solid #eef2f7', verticalAlign: 'middle' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' },
  modal: (isMobile) => ({ background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: isMobile ? '20px' : '28px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', width: '100%', maxWidth: '580px' }),
  input: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 },
};

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

export default function ReturnsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id || 0;
  const isAdmin = roleId === 1;
  const isSales = roleId === 2;
  const isLogistics = roleId === 3;
  const isWarehouse = roleId === 4;
  const isFactory = roleId === 5;
  // Xử lý: Admin + Logistics
  // Duyệt phiếu bù: Admin (tất cả) + Factory (chỉ lỗi nhà máy)
  // Xem phiếu bù: Admin + Logistics + Warehouse + Factory (tất cả đều xem được)

  const [returns, setReturns] = useState([]);
  const [compensations, setCompensations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('returns'); // 'returns' | 'compensations'
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // '' | 'during_delivery' | 'after_delivery'
  const [compFilter, setCompFilter] = useState(''); // '' | 'pending' | 'approved'

  // Modals
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProcessModalVisible, setIsProcessModalVisible] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [processResult, setProcessResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Modal phê duyệt phiếu bù
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isCompModalVisible, setIsCompModalVisible] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [compNote, setCompNote] = useState('');

  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  // ── Responsive ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1200 : false
  );

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1200);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pagePad = isMobile ? 12 : 18;
  const statCols = isMobile ? 1 : isTablet ? 2 : 3;
  const cardR = isMobile ? 14 : 20;
  const fs = isMobile ? 22 : 28;

  // Permission checks
  // Xử lý hàng hoàn: Admin + Logistics
  const canProcess = isAdmin || isLogistics;
  // Xem phiếu bù: Admin, Logistics, Warehouse, Factory
  const canViewCompensation = isAdmin || isLogistics || isWarehouse || isFactory;
  // Duyệt phiếu bù: Admin (tất cả) + Factory (chỉ lỗi nhà máy)
  const canApproveCompensation = (comp) => isAdmin || (isFactory && comp.defect_type === 'loi_nha_may');

  const fetchData = async () => {
    try {
      const [retRes, compRes] = await Promise.all([
        api.get('/returns'),
        api.get('/returns/compensations'),
      ]);
      setReturns(Array.isArray(retRes.data) ? retRes.data : []);
      setCompensations(Array.isArray(compRes.data) ? compRes.data : []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeProcessModal();
        closeCompModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [r.order_no, r.customer_name].filter(Boolean).join(' ').toLowerCase().includes(term);
  }).filter((r) => {
    if (!sourceFilter) return true;
    return r.complaint_source === sourceFilter;
  });

  const filteredComps = compensations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [c.compensation_no, c.order_no, c.customer_name].filter(Boolean).join(' ').toLowerCase().includes(term);
  }).filter((c) => {
    if (!compFilter) return true;
    return c.status === compFilter;
  });

  // Stats
  const pendingReturns = returns.filter((r) => r.status === 'return_pending' && r.logistics_action);
  const completedReturns = returns.filter((r) => r.status === 'return_completed');
  const pendingComps = compensations.filter((c) => c.status === 'pending');

  const openProcessModal = (ret) => {
    setSelectedReturn(ret);
    setProcessResult(null);
    setIsProcessModalVisible(true);
    setIsProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    setIsProcessModalVisible(false);
    setTimeout(() => {
      setIsProcessModalOpen(false);
      setSelectedReturn(null);
      setProcessResult(null);
    }, 220);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post('/returns/process', {
        order_id: selectedReturn.order_id,
        logistics_action: selectedReturn.logistics_action,
      });
      setProcessResult(res.data);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const openCompModal = (comp) => {
    setSelectedComp(comp);
    setCompNote('');
    setIsCompModalVisible(true);
    setIsCompModalOpen(true);
  };

  const closeCompModal = () => {
    setIsCompModalVisible(false);
    setTimeout(() => {
      setIsCompModalOpen(false);
      setSelectedComp(null);
      setCompNote('');
    }, 220);
  };

  const handleCompensation = async () => {
    try {
      await api.put(`/returns/compensations/${selectedComp.id}`, {
        compensation_id: selectedComp.id,
        resolution_note: compNote,
      });
      alert('Da dong y bu hang!');
      closeCompModal();
      fetchData();
    } catch (err) {
      alert('Loi: ' + (err.response?.data?.message || err.message));
    }
  };

  const actionBtn = (bg) => ({
    border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
    fontWeight: 800, fontSize: '14px', color: '#fff', background: bg,
    boxShadow: `0 8px 18px ${bg}40`,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  });

  const getStatusBadge = (status) => {
    const map = {
      return_pending:     { label: 'Chờ xử lý',     bg: '#fef3c7', color: '#92400e' },
      return_completed:   { label: 'Đã xử lý xong', bg: '#dcfce7', color: '#166534' },
      return_to_sales:    { label: 'Về Sales',       bg: '#ede9fe', color: '#6d28d9' },
      logistics_handled:  { label: 'Đã chọn hướng', bg: '#f1f5f9', color: '#475569' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
    return <span style={{ ...PAGE_STYLES.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getCompStatusBadge = (status) => {
    const map = {
      pending:  { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
      approved: { label: 'Đã đồng ý',   bg: '#dcfce7', color: '#166534' },
      rejected: { label: 'Từ chối',     bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
    return <span style={{ ...PAGE_STYLES.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getActionBadge = (action) => {
    const meta = ACTION_OUTCOMES[action] || { badge: { bg: '#f1f5f9', color: '#64748b' } };
    return (
      <span style={{ ...PAGE_STYLES.badge, background: meta.badge.bg, color: meta.badge.color }}>
        {LOGISTICS_ACTION_LABELS[action] || action}
      </span>
    );
  };

  // ── Process Return Modal ──
  const processModal = isProcessModalOpen && modalRoot && selectedReturn ? createPortal(
    <div style={{ ...PAGE_STYLES.modalOverlay, opacity: isProcessModalVisible ? 1 : 0, pointerEvents: isProcessModalVisible ? 'auto' : 'none' }}>
      <div style={{ ...PAGE_STYLES.modal(isMobile), opacity: isProcessModalVisible ? 1 : 0, transform: isProcessModalVisible ? 'scale(1)' : 'scale(0.94)', transition: 'opacity 220ms ease, transform 220ms ease' }}>
        {processResult === null ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', color: '#991b1b' }}>
                  <i className="ri-arrow-go-back-line" style={{ marginRight: '8px' }} />Xử lý hàng hoàn
                </h3>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
                  Đơn #{selectedReturn.order_no} — {selectedReturn.customer_name}
                </p>
              </div>
              <button onClick={closeProcessModal} style={{ ...actionBtn('#6366f1'), background: '#eef2ff', color: '#4338ca', boxShadow: 'none', padding: '10px 14px' }}>Đóng</button>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Hướng xử lý Logistics đã chọn</div>
              {getActionBadge(selectedReturn.logistics_action)}
              {selectedReturn.logistics_note && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  <i className="ri-sticky-note-line" style={{ marginRight: '4px' }} />
                  {selectedReturn.logistics_note}
                </div>
              )}
            </div>

            {(() => {
              const meta = ACTION_OUTCOMES[selectedReturn.logistics_action] || ACTION_OUTCOMES.loi_van_tai;
              return (
                <div style={{ padding: '16px 18px', borderRadius: '16px', background: meta.iconBg, border: '1px solid rgba(0,0,0,0.08)', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: meta.iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <i className={meta.icon} style={{ fontSize: '24px', color: meta.iconColor }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: meta.iconColor, marginBottom: '4px' }}>{meta.headline}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{meta.detail}</div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{meta.note}</div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleProcess}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={processing} style={{ ...actionBtn('#ef4444'), flex: 1, padding: '14px', opacity: processing ? 0.7 : 1 }}>
                  <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }} />
                  {processing ? 'Đang xử lý...' : 'Xác nhận xử lý'}
                </button>
                <button type="button" onClick={closeProcessModal} style={{ ...actionBtn('#6366f1'), background: '#f1f5f9', color: '#475569', boxShadow: 'none', flex: 1, padding: '14px' }}>Hủy</button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <i className="ri-checkbox-circle-line" style={{ fontSize: '40px', color: '#166534' }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: '#166534' }}>Xử lý hoàn hàng thành công!</h3>
            <div style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px', textAlign: 'left', background: '#f8fafc', borderRadius: '14px', padding: '14px' }}>
              <div style={{ marginBottom: '6px' }}>Mã phiếu nhập: <strong style={{ color: '#0f172a' }}>{processResult.receipt_no}</strong></div>
              {processResult.claim_no && (
                <div style={{ marginBottom: '6px' }}>Mã phiếu bù: <strong style={{ color: '#991b1b' }}>{processResult.claim_no}</strong></div>
              )}
              <div>
                Nơi nhận: <strong style={{ color: '#0f172a' }}>{processResult.destination === 'kho_goc' ? 'Kho gốc (cộng tồn)' : 'Kho lỗi (cách ly)'}</strong>
              </div>
              {processResult.claim_no && (
                <div style={{ color: '#92400e', marginTop: '4px' }}>
                  <i className="ri-notification-3-line" style={{ marginRight: '4px' }} />
                  Thông báo đã gửi đến Nhà máy
                </div>
              )}
            </div>
            <button onClick={closeProcessModal} style={{ ...actionBtn('#10b981'), padding: '14px 32px', fontSize: '15px' }}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>, modalRoot
  ) : null;

  // ── Compensation Modal ──
  const compModal = isCompModalOpen && modalRoot && selectedComp ? createPortal(
    <div style={{ ...PAGE_STYLES.modalOverlay, opacity: isCompModalVisible ? 1 : 0, pointerEvents: isCompModalVisible ? 'auto' : 'none' }}>
      <div style={{ ...PAGE_STYLES.modal(isMobile), opacity: isCompModalVisible ? 1 : 0, transform: isCompModalVisible ? 'scale(1)' : 'scale(0.94)', transition: 'opacity 220ms ease', maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-file-list-3-line" style={{ marginRight: '8px', color: '#92400e' }} />Phiếu bù hàng
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              #{selectedComp.compensation_no} — {selectedComp.order_no}
            </p>
          </div>
          <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), background: '#eef2ff', color: '#4338ca', boxShadow: 'none', padding: '10px 14px' }}>Đóng</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }} className="ret-modal-grid">
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Loại lỗi</div>
            <div style={{ fontWeight: 900, color: '#991b1b' }}>
              {selectedComp.defect_type === 'loi_nha_may' ? 'Lỗi do nhà máy' : 'Lỗi do vận chuyển'}
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Kho</div>
            <div style={{ fontWeight: 800 }}>{selectedComp.warehouse_name || selectedComp.warehouse_code || 'Kho lỗi'}</div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Số loại sản phẩm</div>
            <div style={{ fontWeight: 900 }}>{selectedComp.total_items} loại</div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Ngày tạo</div>
            <div style={{ fontWeight: 800 }}>{formatDate(selectedComp.created_at)}</div>
          </div>
        </div>

        {/* Chi tiết sản phẩm */}
        {selectedComp.items && Array.isArray(selectedComp.items) && selectedComp.items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>Chi tiết sản phẩm lỗi</div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>Sản phẩm</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>SL lỗi</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedComp.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '10px 12px', borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.sku}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{item.defective_qty}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#334155', borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {new Intl.NumberFormat('vi-VN').format(Number(item.unit_price) || 0)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ghi chú */}
        {selectedComp.resolution_note && (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
            <strong>Ghi chú:</strong> {selectedComp.resolution_note}
          </div>
        )}

        {selectedComp.status === 'pending' && canApproveCompensation(selectedComp) ? (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                Ghi chú phê duyệt (tùy chọn)
              </label>
              <textarea
                value={compNote}
                onChange={(e) => setCompNote(e.target.value)}
                placeholder="VD: Da dong y boi thuong, se gui hang thay the trong 3 ngay..."
                rows={2}
                style={{ ...PAGE_STYLES.input, minHeight: '72px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCompensation}
                style={{ ...actionBtn('#16a34a'), flex: 1, padding: '14px', boxShadow: '0 8px 18px rgba(22,163,74,0.3)' }}
              >
                <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }} />
                Đồng ý bù hàng
              </button>
              <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), background: '#f1f5f9', color: '#475569', boxShadow: 'none', flex: 1, padding: '14px' }}>
                Hủy
              </button>
            </div>
          </>
        ) : selectedComp.status === 'pending' && !canApproveCompensation(selectedComp) ? (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', marginBottom: '10px' }}>
            <i className="ri-lock-line" style={{ marginRight: '8px' }} />
            Bạn chỉ có quyền xem phiếu bù này. Phiếu bù lỗi nhà máy cần Nhà máy phê duyệt.
          </div>
        ) : selectedComp.status !== 'pending' ? (
          <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), padding: '14px', width: '100%' }}>
            Đóng
          </button>
        ) : null}
      </div>
    </div>, modalRoot
  ) : null;

  // Access denied for roles that shouldn't see anything
  if (!(isAdmin || isSales || isLogistics || isWarehouse || isFactory)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Xử lý hàng hoàn / lỗi chỉ dành cho Admin, Sales, Logistics, Warehouse và Factory.</p>
      </div>
    );
  }

  return (
    <div style={{ ...PAGE_STYLES.page(pagePad), opacity: mounted ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .ret-stat-grid { grid-template-columns: 1fr !important; }
          .ret-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={PAGE_STYLES.shell}>
        <div style={{ marginBottom: '22px' }}>
          <h2 style={PAGE_STYLES.heroTitle(fs)}>Xử lý hàng hoàn / lỗi</h2>
          <p style={PAGE_STYLES.heroSub}>Danh sách hàng khách không nhận hoặc lỗi cần xử lý.</p>
        </div>

        {/* Stats */}
        <div style={PAGE_STYLES.statGrid(statCols)} className="ret-stat-grid">
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-time-line" style={{ fontSize: '22px', color: '#92400e' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Chờ xử lý</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#92400e', margin: '2px 0 0', lineHeight: 1 }}>{pendingReturns.length}</p>
              </div>
            </div>
          </div>
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dcfce7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-checkbox-circle-line" style={{ fontSize: '22px', color: '#166534' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Đã xử lý</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#166534', margin: '2px 0 0', lineHeight: 1 }}>{completedReturns.length}</p>
              </div>
            </div>
          </div>
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-file-list-3-line" style={{ fontSize: '22px', color: '#991b1b' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Phiếu bù chờ</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#991b1b', margin: '2px 0 0', lineHeight: 1 }}>{pendingComps.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '22px', background: '#f1f5f9', borderRadius: '16px', padding: '4px', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setActiveTab('returns')}
            style={{ flex: 1, padding: '11px 24px', borderRadius: '12px', border: 'none',
              background: activeTab === 'returns' ? '#fff' : 'transparent', color: activeTab === 'returns' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'returns' ? 800 : 600, fontSize: '14px', cursor: 'pointer',
              boxShadow: activeTab === 'returns' ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 200ms ease' }}>
            <i className="ri-arrow-go-back-line" style={{ marginRight: '8px' }} />
            Hàng hoàn / lỗi ({returns.length})
          </button>
          <button onClick={() => setActiveTab('compensations')}
            style={{ flex: 1, padding: '11px 24px', borderRadius: '12px', border: 'none',
              background: activeTab === 'compensations' ? '#fff' : 'transparent', color: activeTab === 'compensations' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'compensations' ? 800 : 600, fontSize: '14px', cursor: 'pointer',
              boxShadow: activeTab === 'compensations' ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 200ms ease' }}>
            <i className="ri-file-list-3-line" style={{ marginRight: '8px' }} />
            Phiếu bù nhà máy ({pendingComps.length > 0 ? `${pendingComps.length} chờ` : compensations.length})
          </button>
        </div>

        {/* Main Section */}
        <div style={PAGE_STYLES.section}>
          <div style={PAGE_STYLES.sectionHeader}>
            <h3 style={PAGE_STYLES.sectionTitle}>
              {activeTab === 'returns' ? 'Danh sách hàng hoàn / lỗi' : 'Danh sách phiếu bù nhà máy'}
            </h3>
          </div>

          {/* Search & Filter */}
          <div style={{ padding: '16px 24px 0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo mã đơn, khách hàng..."
              style={{ ...PAGE_STYLES.input, borderRadius: '14px', flex: 1, minWidth: 200 }} />
            {activeTab === 'returns' ? (
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                style={{ ...PAGE_STYLES.input, borderRadius: '14px', minWidth: 180 }}>
                <option value="">Tất cả nguồn</option>
                <option value="during_delivery">Trong quá trình giao</option>
                <option value="after_delivery">Sau khi giao thành công</option>
              </select>
            ) : (
              <select value={compFilter} onChange={(e) => setCompFilter(e.target.value)}
                style={{ ...PAGE_STYLES.input, borderRadius: '14px', minWidth: 180 }}>
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="approved">Đã đồng ý</option>
              </select>
            )}
          </div>

          <div style={PAGE_STYLES.tableWrap}>
            {loading ? (
              <div style={{ padding: '28px', color: '#64748b' }}>Đang tải...</div>
            ) : (
              <table style={PAGE_STYLES.table}>
                <thead>
                  <tr>
                    {activeTab === 'returns' ? (
                      <>
                        <th style={PAGE_STYLES.th}>Mã đơn</th>
                        <th style={PAGE_STYLES.th}>Khách hàng</th>
                        <th style={PAGE_STYLES.th}>Nguồn</th>
                        <th style={PAGE_STYLES.th}>Hướng xử lý</th>
                        <th style={PAGE_STYLES.th}>Trạng thái</th>
                        <th style={PAGE_STYLES.th}>Hành động</th>
                      </>
                    ) : (
                      <>
                        <th style={PAGE_STYLES.th}>Mã phiếu bù</th>
                        <th style={PAGE_STYLES.th}>Mã đơn</th>
                        <th style={PAGE_STYLES.th}>Khách hàng</th>
                        <th style={PAGE_STYLES.th}>Loại lỗi</th>
                        <th style={PAGE_STYLES.th}>Trạng thái</th>
                        <th style={PAGE_STYLES.th}>Hành động</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'returns' ? (
                    filteredReturns.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...PAGE_STYLES.td, textAlign: 'center', color: '#94a3b8', padding: '36px' }}>Chưa có yêu cầu hoàn hàng nào.</td></tr>
                    ) : filteredReturns.map((ret) => (
                      <tr key={ret.id}>
                        <td style={{ ...PAGE_STYLES.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{ret.order_no}</div>
                        </td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700 }}>{ret.customer_name || '—'}</div></td>
                        <td style={PAGE_STYLES.td}>
                          <span style={{ ...PAGE_STYLES.badge, background: ret.complaint_source === 'after_delivery' ? '#ede9fe' : '#fef3c7', color: ret.complaint_source === 'after_delivery' ? '#6d28d9' : '#92400e' }}>
                            {ret.complaint_source === 'after_delivery' ? 'Sau giao' : 'Trong giao'}
                          </span>
                        </td>
                        <td style={PAGE_STYLES.td}>
                          {ret.logistics_action ? getActionBadge(ret.logistics_action) : (
                            <span style={{ ...PAGE_STYLES.badge, background: '#f1f5f9', color: '#94a3b8' }}>Chưa chọn</span>
                          )}
                        </td>
                        <td style={PAGE_STYLES.td}>{getStatusBadge(ret.status)}</td>
                        <td style={{ ...PAGE_STYLES.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          {ret.status === 'return_pending' && ret.logistics_action && canProcess ? (
                            <button onClick={() => openProcessModal(ret)} style={{ ...actionBtn('#ef4444'), padding: '8px 14px' }}>
                              <i className="ri-settings-3-line" style={{ marginRight: '6px' }} />Xử lý
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                              {!canProcess ? 'Chỉ xem' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredComps.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...PAGE_STYLES.td, textAlign: 'center', color: '#94a3b8', padding: '36px' }}>Chưa có phiếu bù nào.</td></tr>
                    ) : filteredComps.map((comp) => (
                      <tr key={comp.id}>
                        <td style={{ ...PAGE_STYLES.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#991b1b' }}>{comp.compensation_no}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(comp.created_at)}</div>
                        </td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700, color: '#1d4ed8' }}>{comp.order_no || '—'}</div></td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700 }}>{comp.customer_name || '—'}</div></td>
                        <td style={PAGE_STYLES.td}>
                          <span style={{ ...PAGE_STYLES.badge, background: comp.defect_type === 'loi_nha_may' ? '#fee2e2' : '#e0f2fe', color: comp.defect_type === 'loi_nha_may' ? '#991b1b' : '#0369a1' }}>
                            {comp.defect_type === 'loi_nha_may' ? 'Lỗi nhà máy' : 'Lỗi vận chuyển'}
                          </span>
                        </td>
                        <td style={PAGE_STYLES.td}>{getCompStatusBadge(comp.status)}</td>
                        <td style={{ ...PAGE_STYLES.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          <button onClick={() => openCompModal(comp)} style={{ ...actionBtn('#6366f1'), padding: '8px 14px' }}>
                            <i className="ri-eye-line" style={{ marginRight: '6px' }} />
                            {canApproveCompensation(comp) ? 'Xem & Duyệt' : 'Xem'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {processModal}
      {compModal}
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\LogisticsPage.jsx ===
`jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { exportListToExcel } from '../utils/exportList';

const CARRIERS = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)', prefix: 'GHN' },
  { code: 'GR',  name: 'Giao Hàng Tiết Kiệm (GR)',  prefix: 'GR'  },
  { code: 'GHT', name: 'Giao Hàng Tiêu Chuẩn (GHT)', prefix: 'GHT' },
];

const LOGISTICS_ACTIONS = [
  { value: 'loi_nha_may', label: 'Lỗi do nhà máy' },
  { value: 'loi_van_tai', label: 'Lỗi do vận chuyển' },
];

const statusConfig = {
  pending:             { label: 'Chờ điều phối',     tone: 'warning', description: 'Đơn mới từ Sales, sẵn sàng phân tuyến.' },
  warehouse_processing: { label: 'Kho đang xử lý',     tone: 'info',    description: 'Đã điều phối, chờ kho soạn hàng và xuất tuyến.' },
  waiting_sales:        { label: 'Đang đợi Sales',      tone: 'amber',   description: 'Kho từ chối, đợi Sales quyết định.' },
  shipping:            { label: 'Đang giao hàng',       tone: 'purple',  description: 'Hàng đã rời kho, đang trên đường giao đến khách.' },
  completed:           { label: 'Đã giao thành công',   tone: 'success', description: 'Khách đã nhận hàng thành công.' },
  customer_rejected:   { label: 'Khách từ chối nhận',  tone: 'danger',  description: 'Khách từ chối nhận hàng, cần xử lý.' },
  return_pending:      { label: 'Đang xử lý hoàn hàng', tone: 'orange',  description: 'Đang xử lý hàng lỗi / hoàn trả.' },
  return_to_sales:     { label: 'Hoàn về Sales',         tone: 'amber',   description: 'Chuyển về Sales xử lý.' },
  canceled:            { label: 'Đã hủy / Bom hàng',    tone: 'danger',  description: 'Đơn bị hủy hoặc hoàn trả.' },
};

const toneStyles = {
  warning:  { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  danger:   { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  info:     { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
  success:  { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  purple:   { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' },
  amber:    { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  orange:   { background: '#ffedd5', color: '#9a3412', border: '1px solid #fb923c' },
};

const pageStyles = {
  page: { minHeight: '100vh', padding: '28px', background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 35%, #f3f4f6 100%)', color: '#0f172a' },
  shell: { maxWidth: '1400px', margin: '0 auto' },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' },
  heroTitle: { margin: 0, fontSize: '28px', letterSpacing: '-0.03em', color: '#0f172a' },
  heroSubtitle: { margin: '8px 0 0', color: '#64748b', lineHeight: 1.7, fontSize: '14px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' },
  statCard: { background: 'rgba(255,255,255,0.92)', borderRadius: '22px', padding: '18px', boxShadow: '0 12px 24px rgba(15,23,42,0.08)', border: '1px solid rgba(148,163,184,0.18)', minHeight: '108px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  statIcon: { width: '44px', height: '44px', borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '18px', color: '#fff', boxShadow: '0 12px 24px rgba(37,99,235,0.18)', marginBottom: '12px' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
  quickPanel: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginBottom: '22px' },
  quickItem: { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '20px', padding: '16px', boxShadow: '0 10px 24px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', transition: 'transform 0.2s ease' },
  quickLabel: { fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontSize: '13px' },
  quickDesc: { color: '#64748b', fontSize: '11px', lineHeight: 1.5 },
  statBlue:    { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  statAmber:   { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  statRose:    { background: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
  statPurple:  { background: 'linear-gradient(135deg, #9333ea, #7e22ce)' },
  section: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(15,23,42,0.08)', overflow: 'hidden', marginBottom: '22px' },
  sectionHeader: { padding: '22px 24px 0' },
  sectionTitle: { margin: 0, fontSize: '20px', color: '#0f172a' },
  sectionDesc: { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6 },
  tabRow: { display: 'inline-flex', gap: '0', padding: '4px', margin: '12px 24px 0', background: '#eef2f7', border: '1px solid #e2e8f0', borderRadius: '16px', width: 'fit-content' },
  tabButton: { border: 'none', borderRadius: '12px', padding: '0 18px', minWidth: '150px', height: '38px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' },
  tableWrap: { padding: '18px 24px 24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: '980px' },
  tableRow: { background: '#fff', transition: 'transform 0.22s ease, box-shadow 0.22s ease', borderRadius: '18px' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', borderBottom: '1px solid #eef2f7', verticalAlign: 'top' },
  actionButton: { border: 'none', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', fontWeight: 800, transition: 'transform 0.15s ease, box-shadow 0.15s ease' },
  primaryButton:   { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' },
  dangerButton:    { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' },
  successButton:   { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' },
  neutralButton:   { background: '#eef2ff', color: '#3730a3' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'modalFadeIn 180ms ease both' },
  modal: { width: '100%', maxWidth: '580px', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', animation: 'modalScaleIn 220ms cubic-bezier(0.16,1,0.3,1) both' },
  modalWide: { width: '100%', maxWidth: '820px', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', animation: 'modalScaleIn 220ms cubic-bezier(0.16,1,0.3,1) both' },
  input: { width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' },
  progressBar: { height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 1s linear' },
};

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

const getMeta = (status) => statusConfig[status] || { label: status || '—', tone: 'warning', description: '' };

const CUSTOMER_REJECT_LABELS = {
  khong_nhan_hang:   'Không nhận hàng',
  hang_loi:          'Hàng lỗi / hư hỏng',
  thieu_hang:        'Thiếu hàng',
  khieu_nai_sau_giao:'Khiếu nại sau giao',
  loi_van_tai:       'Lỗi vận chuyển',
};

export default function LogisticsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id || 0;
  const isAuthorized = [1, 3].includes(roleId); // Admin (1) + Logistics (3)

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Giao hàng / Logistics chỉ dành cho Admin và Logistics.</p>
      </div>
    );
  }

  const [orders, setOrders] = useState([]);
  const [shippingOrders, setShippingOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMounted, setPageMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);

  // Dispatch modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isDispatchVisible, setIsDispatchVisible] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState('GHN');
  const [trackingNo, setTrackingNo] = useState('');
  const [shippingFee, setShippingFee] = useState('');

  // Reject modal (Logistics từ chối đơn)
  const [isLogisticsRejectOpen, setIsLogisticsRejectOpen] = useState(false);
  const [isLogisticsRejectVisible, setIsLogisticsRejectVisible] = useState(false);
  const [logisticsRejectOrder, setLogisticsRejectOrder] = useState(null);
  const [logisticsRejectReason, setLogisticsRejectReason] = useState('');

  // Delivery simulation modal
  const [isDeliverySimOpen, setIsDeliverySimOpen] = useState(false);
  const [isDeliverySimVisible, setIsDeliverySimVisible] = useState(false);
  const [simOrder, setSimOrder] = useState(null);
  const [deliveryStep, setDeliveryStep] = useState(0); // 0=idle, 1=vận chuyển, 2=đang giao, 3=xong
  const [deliveryResult, setDeliveryResult] = useState(null); // null | { success, reason }
  const deliveryAutoRef = useRef(null); // lưu timeout ID của auto-advance step 3

  // Customer rejection processing modal
  const [isCustomerRejectOpen, setIsCustomerRejectOpen] = useState(false);
  const [isCustomerRejectVisible, setIsCustomerRejectVisible] = useState(false);
  const [customerRejectOrder, setCustomerRejectOrder] = useState(null);
  const [customerRejectReason, setCustomerRejectReason] = useState('');
  const [logisticsAction, setLogisticsAction] = useState('khong_nhan_hang');
  const [logisticsActionNote, setLogisticsActionNote] = useState('');

  // Completed order processing modal (khách nhận rồi nhưng vẫn muốn khiếu nại)
  const [isCompletedOrderOpen, setIsCompletedOrderOpen] = useState(false);
  const [isCompletedOrderVisible, setIsCompletedOrderVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [completedAction, setCompletedAction] = useState('confirm'); // 'confirm' | 'complaint'
  const [completedNote, setCompletedNote] = useState('');
  const [completedLogisticsAction, setCompletedLogisticsAction] = useState('hang_loi');

  // View modal for waiting_sales orders
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const fetchData = async () => {
    try {
      const [ordersRes, shippingRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/logistics/shipping'),
        api.get('/logistics/returns'),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setShippingOrders(Array.isArray(shippingRes.data) ? shippingRes.data : []);
      setReturnRequests(Array.isArray(returnsRes.data) ? returnsRes.data : []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu Logistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = window.setTimeout(() => setPageMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  // Đóng modal bằng Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeDispatchModal();
        closeLogisticsRejectModal();
        closeDeliverySim();
        closeCustomerRejectModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Delivery simulation: gọi backend mỗi bước 5s
  // Bước 1: Kho đang xử lý → Bước 2: Đang vận chuyển → Bước 3: Đang giao hàng → Bước 4: Giao thành công
  useEffect(() => {
    if (!isDeliverySimOpen || !simOrder) return;

    if (deliveryStep === 1) {
      // Đợi 5s rồi gọi backend advance step 1 → 2 (đồng thời set status = 'shipping')
      const t = window.setTimeout(async () => {
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(2);
      }, 5000);
      return () => window.clearTimeout(t);
    }
    if (deliveryStep === 2) {
      const t = window.setTimeout(async () => {
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(3);
      }, 5000);
      return () => window.clearTimeout(t);
    }
    if (deliveryStep === 3) {
      const t = window.setTimeout(async () => {
        deliveryAutoRef.current = null;
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(4);
      }, 5000);
      deliveryAutoRef.current = t;
      return () => { window.clearTimeout(t); deliveryAutoRef.current = null; };
    }
    if (deliveryStep === 4) {
      const t = window.setTimeout(async () => {
        try {
          // User đã xác nhận giao thành công → gọi API với success=true
          const res = await api.post('/logistics/simulate', { order_id: simOrder.id, success: true });
          setDeliveryResult({ success: true, reason: null });
          fetchData();
        } catch (err) {
          console.error('Lỗi simulate:', err);
          setDeliveryResult({ success: false, reason: 'loi_he_thong' });
        }
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [isDeliverySimOpen, simOrder, deliveryStep]);

  // Auto-simulate all shipping orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const hasShipping = orders.some((o) => o.status === 'shipping');
      if (!hasShipping) return;
      try {
        await api.post('/logistics/simulate-all');
        fetchData();
      } catch (err) {
        // silent fail - just retry next interval
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orders, fetchData]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const trackingOrders = useMemo(() => orders.filter((o) =>
    ['warehouse_processing', 'waiting_sales', 'shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales', 'canceled'].includes(o.status)
  ), [orders]);
  const visibleOrders = useMemo(() => {
    const base = activeTab === 'pending' ? pendingOrders : trackingOrders;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return base;
    return base.filter((o) =>
      [o.order_no, o.customer_name, o.note].filter(Boolean).join(' ').toLowerCase().includes(term)
    );
  }, [activeTab, pendingOrders, trackingOrders, searchTerm]);

  const summaryCards = [
    { label: 'Tổng đơn',         value: orders.length,                                              icon: 'ri-stack-line',    tone: 'statBlue' },
    { label: 'Chờ điều phối',    value: pendingOrders.length,                                       icon: 'ri-time-line',     tone: 'statAmber' },
    { label: 'Đang theo dõi',     value: trackingOrders.filter(o => o.status !== 'completed').length, icon: 'ri-truck-line',     tone: 'statEmerald' },
    { label: 'Khách từ chối',     value: orders.filter((o) => ['customer_rejected', 'return_pending'].includes(o.status)).length, icon: 'ri-alert-line', tone: 'statRose' },
  ];

  // === Dispatch Modal ===
  const openDispatchModal = (order) => {
    setDispatchOrder(order);
    setSelectedCarrier('GHN');
    setTrackingNo('');
    setShippingFee('');
    setIsDispatchVisible(true);
    setIsDispatchOpen(true);
  };
  const closeDispatchModal = () => {
    setIsDispatchVisible(false);
    setTimeout(() => { setIsDispatchOpen(false); setDispatchOrder(null); }, 220);
  };
  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/logistics/dispatch', {
        order_id: dispatchOrder.id,
        carrier_code: selectedCarrier,
        shipping_fee: Number(shippingFee) || 0,
      });
      alert(`Điều phối thành công!\nMã vận đơn: ${res.data.tracking_no}\nĐơn vị: ${res.data.carrier}\nPhí ship: ${formatCurrency(res.data.shipping_fee)}đ`);
      closeDispatchModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Logistics Reject Modal ===
  const openLogisticsRejectModal = (order) => {
    setLogisticsRejectOrder(order);
    setLogisticsRejectReason('');
    setIsLogisticsRejectVisible(true);
    setIsLogisticsRejectOpen(true);
  };
  const closeLogisticsRejectModal = () => {
    setIsLogisticsRejectVisible(false);
    setTimeout(() => { setIsLogisticsRejectOpen(false); setLogisticsRejectOrder(null); }, 220);
  };
  const handleLogisticsReject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/reject', {
        order_id: logisticsRejectOrder.id,
        reason: logisticsRejectReason,
      });
      alert('Đã từ chối đơn. Đơn quay về trạng thái chờ Sales xử lý.');
      closeLogisticsRejectModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Delivery Simulation ===
  const openDeliverySim = (order) => {
    setSimOrder(order);
    setDeliveryStep(1); // Bắt đầu từ bước 1
    setDeliveryResult(null);
    setIsDeliverySimVisible(true);
    setIsDeliverySimOpen(true);
  };
  const closeDeliverySim = () => {
    if (deliveryAutoRef.current) { window.clearTimeout(deliveryAutoRef.current); deliveryAutoRef.current = null; }
    setIsDeliverySimVisible(false);
    setTimeout(() => { setIsDeliverySimOpen(false); setSimOrder(null); setDeliveryStep(0); setDeliveryResult(null); }, 220);
  };

  // === Customer Rejection Processing ===
  const openCustomerRejectModal = (order) => {
    setCustomerRejectOrder(order);
    setCustomerRejectReason('Không nhận hàng');
    setLogisticsActionNote('');
    setIsCustomerRejectVisible(true);
    setIsCustomerRejectOpen(true);
  };
  const closeCustomerRejectModal = () => {
    setIsCustomerRejectVisible(false);
    setTimeout(() => { setIsCustomerRejectOpen(false); setCustomerRejectOrder(null); }, 220);
  };

  // === Completed Order Processing (khách nhận rồi nhưng vẫn khiếu nại) ===
  const openCompletedOrderModal = (order) => {
    setCompletedOrder(order);
    setCompletedAction('confirm');
    setCompletedNote('');
    setCompletedLogisticsAction('loi_nha_may');
    setIsCompletedOrderVisible(true);
    setIsCompletedOrderOpen(true);
  };
  const closeCompletedOrderModal = () => {
    setIsCompletedOrderVisible(false);
    setTimeout(() => { setIsCompletedOrderOpen(false); setCompletedOrder(null); setCompletedNote(''); setCompletedLogisticsAction('hang_loi'); }, 220);
  };

  // === View Modal (cho waiting_sales) ===
  const openViewModal = (order) => {
    setViewOrder(order);
    setIsViewVisible(true);
    setIsViewOpen(true);
  };
  const closeViewModal = () => {
    setIsViewVisible(false);
    setTimeout(() => { setIsViewOpen(false); setViewOrder(null); }, 220);
  };
  const handleProcessCompletedOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/process-completed', {
        order_id: completedOrder.id,
        action: completedAction,
        note: completedNote,
        logistics_action: completedAction === 'complaint' ? completedLogisticsAction : null,
      });
      alert(completedAction === 'confirm' ? 'Đã xác nhận hoàn thành!' : 'Đã ghi nhận khiếu nại!');
      closeCompletedOrderModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleProcessCustomerRejection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/customer-rejection', {
        order_id: customerRejectOrder.id,
        logistics_action: logisticsAction,
        logistics_note: logisticsActionNote,
      });
      alert('Đã xử lý! Đơn đã được chuyển đến khu vực phù hợp.');
      closeCustomerRejectModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Delivery Simulation steps ===
  // Bước 1: Kho đang xử lý  →  Bước 2: Đang vận chuyển  →  Bước 3: Đang giao hàng  →  Bước 4: Giao thành công
  const DELIVERY_STEPS = [
    { label: 'Kho đang xử lý',  icon: 'ri-archive-line',          color: '#2563eb', desc: 'Kho đang soạn và đóng gói hàng...' },
    { label: 'Đang vận chuyển', icon: 'ri-truck-line',            color: '#9333ea', desc: 'Hàng đã rời kho, đang trên đường...' },
    { label: 'Đang giao hàng',  icon: 'ri-navigation-line',        color: '#d97706', desc: 'Hàng đang được giao đến khách...' },
    { label: 'Giao thành công', icon: 'ri-checkbox-circle-line',  color: '#10b981', desc: '' },
  ];

  // === Render Modals ===
  const dispatchModal = isDispatchOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isDispatchVisible ? 1 : 0, pointerEvents: isDispatchVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isDispatchVisible ? 1 : 0, transform: isDispatchVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease, transform 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Điều phối vận chuyển</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Chọn đơn vị vận chuyển — mã vận đơn sẽ tự sinh.</p>
          </div>
          <button onClick={closeDispatchModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Mã đơn</div><div style={{ fontWeight: 900, color: '#1d4ed8' }}>{dispatchOrder?.order_no}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Khách hàng</div><div style={{ fontWeight: 800 }}>{dispatchOrder?.customer_name}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày giao</div><div style={{ fontWeight: 800 }}>{formatDate(dispatchOrder?.expected_delivery_date)}</div></div>
          </div>
        </div>

        <form onSubmit={handleDispatch}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Đơn vị vận chuyển</label>
              <select value={selectedCarrier} onChange={(e) => { setSelectedCarrier(e.target.value); setTrackingNo(''); }} style={pageStyles.input}>
                {CARRIERS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Mã vận đơn <span style={{ color: '#2563eb', fontSize: '12px' }}>(tự sinh)</span></label>
              <input value={trackingNo} readOnly placeholder="Mã sẽ tự sinh khi bấm điều phối..." style={{ ...pageStyles.input, background: '#f1f5f9', color: '#64748b' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Phí ship dự tính (VNĐ)</label>
              <input type="number" min="0" placeholder="VD: 35000" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} style={pageStyles.input} required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.primaryButton, flex: 1, padding: '14px 16px' }}>
                <i className="ri-truck-line" style={{ marginRight: '8px' }} />Điều phối sang kho
              </button>
              <button type="button" onClick={closeDispatchModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
            </div>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  const logisticsRejectModal = isLogisticsRejectOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isLogisticsRejectVisible ? 1 : 0, pointerEvents: isLogisticsRejectVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isLogisticsRejectVisible ? 1 : 0, transform: isLogisticsRejectVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#b91c1c' }}>Từ chối đơn hàng</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Gửi lại cho Sales để sửa hoặc xóa đơn.</p>
          </div>
          <button onClick={closeLogisticsRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Khách hàng</div>
          <div style={{ fontWeight: 900, marginTop: '4px' }}>{logisticsRejectOrder?.customer_name || '—'}</div>
        </div>
        <form onSubmit={handleLogisticsReject}>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Lý do từ chối <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea required rows="4" placeholder="VD: Địa chỉ không rõ ràng, không có tuyến giao..." value={logisticsRejectReason} onChange={(e) => setLogisticsRejectReason(e.target.value)} style={pageStyles.textarea} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, flex: 1, padding: '14px 16px' }}>Gửi từ chối</button>
            <button type="button" onClick={closeLogisticsRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  const deliverySimModal = isDeliverySimOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isDeliverySimVisible ? 1 : 0, pointerEvents: isDeliverySimVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modalWide, opacity: isDeliverySimVisible ? 1 : 0, transform: isDeliverySimVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-truck-line" style={{ marginRight: '10px', color: '#2563eb' }} />
              Bảng giao hàng ảo
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Theo dõi đơn #{simOrder?.order_no} — Khách: {simOrder?.customer_name}</p>
          </div>
          <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        {deliveryResult === null ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {DELIVERY_STEPS.map((step, idx) => {
                const done = deliveryStep > idx + 1;
                const active = deliveryStep === idx + 1;
                return (
                  <div key={idx} style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: active ? `2px solid ${step.color}` : '2px solid #e2e8f0',
                    background: done ? '#f0fdf4' : active ? '#eff6ff' : '#f8fafc',
                    textAlign: 'center',
                    transition: 'all 0.4s ease',
                  }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: done ? '#10b981' : active ? step.color : '#cbd5e1', display: 'grid', placeItems: 'center', margin: '0 auto 14px', transition: 'background 0.4s ease' }}>
                      <i className={done ? 'ri-check-line' : active ? step.icon : 'ri-checkbox-blank-circle-line'} style={{ fontSize: '24px', color: '#fff' }} />
                    </div>
                    <div style={{ fontWeight: 900, color: done ? '#166534' : active ? step.color : '#94a3b8', marginBottom: '6px' }}>{step.label}</div>
                    {active && <div style={{ fontSize: '12px', color: '#64748b' }}>{step.desc}</div>}
                    {active && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: step.color, width: '70%', borderRadius: '999px', animation: 'progressPulse 5s linear forwards' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
              Đang cập nhật tự động... (mỗi bước 5 giây)
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {deliveryResult.success ? (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <i className="ri-checkbox-circle-line" style={{ fontSize: '48px', color: '#166534' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: '#166534' }}>Giao hàng thành công!</h3>
                <p style={{ color: '#64748b', margin: '0 0 24px' }}>Khách hàng đã nhận đầy đủ hàng hóa.</p>
                <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.successButton, padding: '12px 32px', fontSize: '15px' }}>Đóng</button>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <i className="ri-close-circle-line" style={{ fontSize: '48px', color: '#991b1b' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: '#991b1b' }}>Khách từ chối nhận hàng!</h3>
                <p style={{ color: '#64748b', margin: '0 0 8px' }}>Lý do: <strong style={{ color: '#b91c1c' }}>{CUSTOMER_REJECT_LABELS[deliveryResult.reason] || deliveryResult.reason}</strong></p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>Nhấn nút bên dưới để xử lý khiếu nại.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '12px 24px', fontSize: '14px' }}>Đóng</button>
                  <button
                    onClick={() => {
                      closeDeliverySim();
                      // Mở modal xử lý hàng trả cho đơn này
                      openCustomerRejectModal(simOrder);
                    }}
                    style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, padding: '12px 24px', fontSize: '14px' }}
                  >
                    <i className="ri-settings-line" style={{ marginRight: '6px' }} />Xử lý khiếu nại
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>, modalRoot
  ) : null;

  const customerRejectModal = isCustomerRejectOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isCustomerRejectVisible ? 1 : 0, pointerEvents: isCustomerRejectVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isCustomerRejectVisible ? 1 : 0, transform: isCustomerRejectVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#991b1b' }}>
              <i className="ri-alert-warning-line" style={{ marginRight: '8px' }} />Xử lý hàng trả
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{customerRejectOrder?.order_no} — {customerRejectOrder?.customer_name}</p>
          </div>
          <button onClick={closeCustomerRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          // Gửi về Sales — không cần logistics_action
          api.put(`/orders/${customerRejectOrder.id}/return-to-sales`, {
            note: logisticsActionNote,
          }).then(() => {
            alert('Da gui don ve Sales xu ly!');
            closeCustomerRejectModal();
            fetchData();
          }).catch(err => {
            alert('Loi: ' + (err.response?.data?.message || err.message));
          });
        }}>
          <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fee2e2', border: '1px solid #fca5a5', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Lý do khách từ chối</div>
            <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: '16px' }}>Không nhận hàng</div>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Ghi chú</label>
              <textarea rows="3" placeholder="VD: Khách báo không đặt hàng, địa chỉ sai..." value={logisticsActionNote} onChange={(e) => setLogisticsActionNote(e.target.value)} style={pageStyles.textarea} />
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#fef9c3', border: '1px solid #fde047', fontSize: '13px', color: '#92400e' }}>
              → Hàng sẽ được gửi về <strong>Sales</strong> xử lý. Sales có thể sửa đơn, giao lại hoặc hủy đơn.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, flex: 1, padding: '14px 16px' }}>
                <i className="ri-send-plane-line" style={{ marginRight: '8px' }} />Gửi về Sales
              </button>
              <button type="button" onClick={closeCustomerRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
            </div>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  // Modal xử lý đơn đã giao thành công (Logistics vẫn thấy nút Hoàn thành / Khiếu nại)
  const completedOrderModal = isCompletedOrderOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isCompletedOrderVisible ? 1 : 0, pointerEvents: isCompletedOrderVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isCompletedOrderVisible ? 1 : 0, transform: isCompletedOrderVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-checkbox-circle-line" style={{ marginRight: '8px', color: '#16a34a' }} />Đơn đã giao thành công
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{completedOrder?.order_no} — {completedOrder?.customer_name}</p>
          </div>
          <button onClick={closeCompletedOrderModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <i className="ri-checkbox-circle-line" style={{ fontSize: '42px', color: '#16a34a' }} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '22px', color: '#16a34a' }}>Giao hàng thành công!</h3>
          <p style={{ color: '#64748b', margin: '0', fontSize: '14px' }}>Khách hàng đã nhận đầy đủ hàng hóa.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ngày giao dự kiến</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>{completedOrder?.expected_delivery_date ? new Date(completedOrder.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ngày giao thực tế</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>{completedOrder?.actual_delivery_date ? new Date(completedOrder.actual_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
          </div>
        </div>

        {completedOrder?.note && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ghi chú</div>
            <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{completedOrder.note}</div>
          </div>
        )}

        {/* Action: Hoàn thành / Khiếu nại */}
        <form onSubmit={handleProcessCompletedOrder}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Hành động của Logistics</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" name="completedAction" value="confirm" checked={completedAction === 'confirm'} onChange={() => setCompletedAction('confirm')} style={{ marginRight: '6px' }} />
                <span style={{ padding: '8px 14px', borderRadius: '10px', border: completedAction === 'confirm' ? '2px solid #16a34a' : '2px solid #e2e8f0', background: completedAction === 'confirm' ? '#f0fdf4' : '#fff', color: completedAction === 'confirm' ? '#15803d' : '#64748b', fontWeight: 700, fontSize: '13px', display: 'inline-block' }}>
                  <i className="ri-checkbox-circle-line" style={{ marginRight: '4px' }} />Hoàn thành
                </span>
              </label>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" name="completedAction" value="complaint" checked={completedAction === 'complaint'} onChange={() => setCompletedAction('complaint')} style={{ marginRight: '6px' }} />
                <span style={{ padding: '8px 14px', borderRadius: '10px', border: completedAction === 'complaint' ? '2px solid #dc2626' : '2px solid #e2e8f0', background: completedAction === 'complaint' ? '#fff1f2' : '#fff', color: completedAction === 'complaint' ? '#b91c1c' : '#64748b', fontWeight: 700, fontSize: '13px', display: 'inline-block' }}>
                  <i className="ri-error-warning-line" style={{ marginRight: '4px' }} />Khiếu nại
                </span>
              </label>
            </div>
          </div>

          {completedAction === 'complaint' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Loại khiếu nại</div>
              <select
                value={completedLogisticsAction}
                onChange={(e) => setCompletedLogisticsAction(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', background: '#fff' }}
              >
                {LOGISTICS_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: completedLogisticsAction === 'loi_nha_may' ? '#fef3c7' : '#e0f2fe', border: '1px solid ' + (completedLogisticsAction === 'loi_nha_may' ? '#fde047' : '#bae6fd'), fontSize: '13px', color: completedLogisticsAction === 'loi_nha_may' ? '#92400e' : '#0369a1' }}>
                {completedLogisticsAction === 'loi_nha_may'
                  ? '→ Hàng vào Kho lỗi. Phiếu bù gửi Nhà máy xác nhận bù hàng.'
                  : '→ Hàng vào Kho lỗi. Công ty tự chịu thiệt hại vận chuyển.'}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Ghi chú</div>
            <textarea
              value={completedNote}
              onChange={(e) => setCompletedNote(e.target.value)}
              placeholder="Nhập ghi chú nếu cần..."
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={closeCompletedOrderModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 20px', fontSize: '14px' }}>Hủy</button>
            <button type="submit" style={{ ...pageStyles.actionButton, ...(completedAction === 'confirm' ? pageStyles.successButton : pageStyles.dangerButton), padding: '10px 20px', fontSize: '14px' }}>
              {completedAction === 'confirm' ? 'Xác nhận hoàn thành' : 'Ghi nhận khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  // Modal xem đơn đang đợi Sales (Logistics đã từ chối)
  const viewModal = isViewOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isViewVisible ? 1 : 0, pointerEvents: isViewVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isViewVisible ? 1 : 0, transform: isViewVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#b45309' }}>
              <i className="ri-time-line" style={{ marginRight: '8px', color: '#b45309' }} />Đơn đang đợi Sales xử lý
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{viewOrder?.order_no} — {viewOrder?.customer_name}</p>
          </div>
          <button onClick={closeViewModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fef9c3', border: '1px solid #fde047', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Lý do Kho từ chối xuất hàng</div>
          <div style={{ fontWeight: 900, color: '#854d0e', fontSize: '15px' }}>{viewOrder?.warehouse_note || 'Không có ghi chú'}</div>
        </div>

        {viewOrder?.warehouse_note && (
          <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Lý do Logistics từ chối (gốc)</div>
            <div style={{ color: '#475569', fontSize: '14px' }}>{viewOrder?.note || '—'}</div>
          </div>
        )}

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày giao dự kiến</div><div style={{ fontWeight: 800, marginTop: '4px' }}>{formatDate(viewOrder?.expected_delivery_date)}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Trạng thái</div><div style={{ fontWeight: 800, marginTop: '4px', color: '#92400e' }}>Đang đợi Sales</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={closeViewModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '12px 24px', fontSize: '14px' }}>Đóng</button>
        </div>
      </div>
    </div>, modalRoot
  ) : null;

  const iconMap = { pending: 'ri-time-line', warehouse_processing: 'ri-box-3-line', waiting_sales: 'ri-user-follow-line', shipping: 'ri-truck-line', completed: 'ri-check-line', customer_rejected: 'ri-close-circle-line', return_pending: 'ri-arrow-go-back-line', return_to_sales: 'ri-reply-line', canceled: 'ri-alert-line' };
  const toneMap = { pending: pageStyles.statAmber, warehouse_processing: pageStyles.statBlue, waiting_sales: pageStyles.statAmber, shipping: pageStyles.statPurple, completed: pageStyles.statEmerald, customer_rejected: pageStyles.statRose, return_pending: pageStyles.statRose, return_to_sales: pageStyles.statAmber, canceled: pageStyles.statRose };

  return (
    <div style={{ ...pageStyles.page, opacity: pageMounted ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.94) translateY(18px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes progressPulse { from { width: 0%; } to { width: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={pageStyles.shell}>
        {/* Hero */}
        <div style={pageStyles.hero}>
          <div>
            <h2 style={pageStyles.heroTitle}>Điều phối giao hàng</h2>
            <p style={pageStyles.heroSubtitle}>Quản lý đơn từ Sales → điều phối → kho xuất → giao hàng → xử lý hoàn trong một màn hình.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={pageStyles.statGrid}>
          {summaryCards.map((card) => (
            <div key={card.label} style={{ ...pageStyles.statCard, transform: hoveredCard === card.label ? 'translateY(-4px)' : 'translateY(0)' }}
              onMouseEnter={() => setHoveredCard(card.label)} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ ...pageStyles.statIcon, ...pageStyles[card.tone] }}><i className={card.icon} /></div>
              <p style={pageStyles.statLabel}>{card.label}</p>
              <p style={pageStyles.statValue}>{card.value}</p>
              <p style={pageStyles.statDesc}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick panel */}
        <div style={pageStyles.quickPanel}>
          {['pending', 'warehouse_processing', 'waiting_sales', 'shipping', 'customer_rejected'].map((key) => {
            const meta = getMeta(key);
            return (
              <div key={key} style={{ ...pageStyles.quickItem, transform: hoveredCard === `q-${key}` ? 'translateY(-3px)' : 'translateY(0)' }}
                onMouseEnter={() => setHoveredCard(`q-${key}`)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'grid', placeItems: 'center', ...toneMap[key] }}>
                    <i className={iconMap[key]} style={{ fontSize: '18px', color: '#fff' }} />
                  </div>
                  <div>
                    <div style={pageStyles.quickLabel}>{meta.label}</div>
                    <div style={{ ...pageStyles.quickDesc }}>{meta.description}</div>
                  </div>
                </div>
                <span style={{ ...toneStyles[meta.tone], padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
                  {orders.filter((o) => o.status === key).length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Section */}
        <div style={pageStyles.section}>
          <div style={pageStyles.sectionHeader}>
            <h3 style={pageStyles.sectionTitle}>Danh sách điều phối</h3>
            <p style={pageStyles.sectionDesc}>Tìm nhanh đơn theo mã, khách hàng, ghi chú.</p>
          </div>

          {/* Tabs */}
          <div style={pageStyles.tabRow}>
            {['pending', 'tracking'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ ...pageStyles.tabButton, background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#2563eb' : '#64748b', boxShadow: activeTab === tab ? '0 1px 3px rgba(15,23,42,0.08)' : 'none', border: activeTab === tab ? '1px solid #dbeafe' : '1px solid transparent' }}>
                {tab === 'pending' ? `Chờ điều phối (${pendingOrders.length})` : `Theo dõi giao hàng (${trackingOrders.length})`}
              </button>
            ))}
          </div>

          {/* Search + Export */}
          <div style={{ padding: '18px 24px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo mã đơn, khách hàng..." style={{ ...pageStyles.input, flex: 1, minWidth: 200 }} />
            <button
              onClick={async () => {
                const list = activeTab === 'pending' ? pendingOrders : trackingOrders;
                const rows = list.map(o => [
                  o.order_no || '',
                  o.customer_name || '',
                  o.customer_phone || '',
                  o.customer_address || '',
                  o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString('vi-VN') : '',
                  o.actual_delivery_date ? new Date(o.actual_delivery_date).toLocaleDateString('vi-VN') : '',
                  o.status || '',
                  o.delivery_step || 0,
                  o.tracking_no || '',
                  o.carrier_name || '',
                ]);
                await exportListToExcel({
                  filename: 'DanhSachGiaoHang',
                  sheetName: 'GiaoHang',
                  title: 'DANH SÁCH ĐƠN GIAO HÀNG / VẬN CHUYỂN',
                  headers: ['Mã đơn', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Ngày giao DK', 'Ngày giao TT', 'Trạng thái', 'Step', 'Mã vận đơn', 'ĐVVC'],
                  rows,
                  colWidths: [16, 24, 14, 32, 14, 14, 16, 8, 18, 14],
                });
              }}
              style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 6px 14px rgba(16,185,129,0.22)',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}
            >
              <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />
              Xuất Excel
            </button>
          </div>

          {/* Table */}
          <div style={pageStyles.tableWrap}>
            {loading ? <div style={{ padding: '28px', color: '#64748b' }}>Đang tải...</div> : (
              <table style={pageStyles.table}>
                <thead>
                  <tr>
                    <th style={pageStyles.th}>Mã đơn</th>
                    <th style={pageStyles.th}>Khách hàng</th>
                    <th style={pageStyles.th}>Ngày giao</th>
                    <th style={pageStyles.th}>Trạng thái</th>
                    <th style={pageStyles.th}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.length === 0 && (
                    <tr><td colSpan="5" style={{ ...pageStyles.td, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>Không có dữ liệu.</td></tr>
                  )}
                  {visibleOrders.map((order) => {
                    const meta = getMeta(order.status);
                    const isHov = hoveredOrderId === order.id;
                    return (
                      <tr key={order.id} style={{ ...pageStyles.tableRow, backgroundColor: isHov ? 'rgba(59,130,246,0.03)' : '#fff' }}
                        onMouseEnter={() => setHoveredOrderId(order.id)} onMouseLeave={() => setHoveredOrderId(null)}>
                        <td style={{ ...pageStyles.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{order.order_no}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ID: {order.id}</div>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ fontWeight: 700 }}>{order.customer_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{order.address || ''}</div>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                            {formatDate(order.expected_delivery_date)}
                          </div>
                        </td>
                        <td style={pageStyles.td}>
                          <span style={{ ...toneStyles[meta.tone], padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>{meta.label}</span>
                          {order.note && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{order.note}</div>}
                        </td>
                        <td style={{ ...pageStyles.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                            {/* === PENDING === */}
                            {order.status === 'pending' && (
                              <>
                                <button onClick={() => openDispatchModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.primaryButton }}>
                                  <i className="ri-truck-line" style={{ marginRight: '6px' }} />Điều phối
                                </button>
                                <button onClick={() => openLogisticsRejectModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton }}>
                                  <i className="ri-close-line" style={{ marginRight: '6px' }} />Từ chối
                                </button>
                              </>
                            )}

                            {/* === WAREHOUSE_PROCESSING === */}
                            {order.status === 'warehouse_processing' && (
                              <span style={{ ...toneStyles.info, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-loader-4-line" style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />Kho đang xử lý
                              </span>
                            )}

                            {/* === WAITING_SALES === */}
                            {order.status === 'waiting_sales' && (
                              <button onClick={() => openViewModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton }}>
                                <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem
                              </button>
                            )}

                            {/* === SHIPPING === */}
                            {order.status === 'shipping' && (
                              <>
                                <button onClick={() => openDeliverySim(order)} style={{ ...pageStyles.actionButton, ...pageStyles.successButton }}>
                                  <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem giao hàng
                                </button>
                              </>
                            )}

                            {/* === COMPLETED === */}
                            {order.status === 'completed' && (
                              <button onClick={() => openCompletedOrderModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.successButton }}>
                                <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem đơn hoàn thành
                              </button>
                            )}

                            {/* === CUSTOMER_REJECTED === */}
                            {order.status === 'customer_rejected' && (
                              <button onClick={() => openCustomerRejectModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton }}>
                                <i className="ri-alert-warning-line" style={{ marginRight: '6px' }} />Xử lý hàng trả
                              </button>
                            )}

                            {/* === RETURN_PENDING === */}
                            {order.status === 'return_pending' && (
                              <span style={{ ...toneStyles.orange, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-arrow-go-back-line" style={{ marginRight: '6px' }} />Đang xử lý hoàn
                              </span>
                            )}

                            {/* === RETURN_TO_SALES === */}
                            {order.status === 'return_to_sales' && (
                              <span style={{ ...toneStyles.amber, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-reply-line" style={{ marginRight: '6px' }} />Hoàn về Sales
                              </span>
                            )}

                            {/* === CANCELED === */}
                            {order.status === 'canceled' && (
                              <span style={{ ...toneStyles.danger, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-alert-line" style={{ marginRight: '6px' }} />Đã hủy
                              </span>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Theo dõi hoàn hàng */}
        <div style={{ ...pageStyles.section, marginTop: '22px' }}>
          <div style={{ ...pageStyles.sectionHeader }}>
            <h3 style={pageStyles.sectionTitle}>Theo dõi hoàn hàng</h3>
            <p style={pageStyles.sectionDesc}>Đơn hàng đang trong quy trình hoàn trả / khiếu nại sau giao.</p>
          </div>
          <div style={pageStyles.tableWrap}>
            {returnRequests.length === 0 ? (
              <div style={{ padding: '28px', color: '#94a3b8', textAlign: 'center' }}>Không có yêu cầu hoàn hàng nào.</div>
            ) : (
              <table style={pageStyles.table}>
                <thead>
                  <tr>
                    <th style={pageStyles.th}>Mã đơn</th>
                    <th style={pageStyles.th}>Khách hàng</th>
                    <th style={pageStyles.th}>Lý do</th>
                    <th style={pageStyles.th}>Nguồn</th>
                    <th style={pageStyles.th}>Trạng thái</th>
                    <th style={pageStyles.th}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((rr) => {
                    const statusLabel = {
                      pending: 'Chờ xử lý',
                      return_pending: 'Đang hoàn',
                      return_to_sales: 'Hoàn về Sales',
                      return_completed: 'Đã hoàn thành',
                      canceled: 'Đã hủy',
                    }[rr.status] || rr.status;
                    const toneKey = {
                      pending: 'warning',
                      return_pending: 'orange',
                      return_to_sales: 'amber',
                      return_completed: 'success',
                      canceled: 'danger',
                    }[rr.status] || 'info';
                    const sourceLabel = {
                      during_delivery: 'Trong quá trình giao',
                      after_delivery: 'Sau khi giao',
                    }[rr.complaint_source] || rr.complaint_source || '—';
                    return (
                      <tr key={rr.id} style={pageStyles.tableRow}>
                        <td style={pageStyles.td}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{rr.order_no}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ID: {rr.order_id}</div>
                        </td>
                        <td style={pageStyles.td}>{rr.customer_name || '—'}</td>
                        <td style={pageStyles.td}>{rr.customer_reject_reason || '—'}</td>
                        <td style={pageStyles.td}>{sourceLabel}</td>
                        <td style={pageStyles.td}>
                          <span style={{ ...toneStyles[toneKey], padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>{statusLabel}</span>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                            {rr.logistics_note || rr.order_note || '—'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {dispatchModal}
      {logisticsRejectModal}
      {deliverySimModal}
      {customerRejectModal}
      {completedOrderModal}
      {viewModal}
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\ReportsPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../services/api';
import { getSalesReport, getLogisticsReport, getWarehouseReport, getFactoryReport, getInventoryReport } from '../services/reportService';
import { exportInventoryReport, exportSalesReport, exportLogisticsReport, exportWarehouseReport, exportFactoryReport } from '../utils/excelExport';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];
const fmtCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const PERIOD_OPTIONS = [
  { value: 'day',     label: 'Ngày' },
  { value: 'month',   label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'all',     label: 'Tất cả' },
];

function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '18px 20px',
      border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 20 }}>
        <i className={icon} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id;
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        switch (roleId) {
          case 2: res = await getSalesReport(period); break;
          case 3: res = await getLogisticsReport(period); break;
          case 4: res = await getWarehouseReport(period); break;
          case 5: res = await getFactoryReport(period); break;
          default: res = await getInventoryReport(); break;
        }
        setData(res || {});
      } catch (err) {
        console.error('Lỗi tải báo cáo', err);
        setError('Không thể tải dữ liệu báo cáo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId, period]);

  const roleTitle = roleId === 1 ? 'Báo cáo Tổng quan' : roleId === 2 ? 'Báo cáo Doanh thu (Sales)' : roleId === 3 ? 'Báo cáo Vận chuyển (Logistics)' : roleId === 4 ? 'Báo cáo Kho (Warehouse)' : roleId === 5 ? 'Báo cáo Sản xuất (Nhà máy)' : 'Báo cáo';
  const roleColor = roleId === 1 ? '#2563eb' : roleId === 2 ? '#10b981' : roleId === 3 ? '#f97316' : roleId === 4 ? '#7c3aed' : roleId === 5 ? '#f59e0b' : '#64748b';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải báo cáo...
    </div>
  );

  const renderInventoryReport = () => {
    const items = Array.isArray(data) ? data : [];
    const summary = {
      totalItems: items.length,
      totalQty: items.reduce((s, i) => s + Number(i.on_hand_qty || 0), 0),
      totalValue: items.reduce((s, i) => s + Number((i.on_hand_qty || 0) * (i.sale_price || 0)), 0),
    };
    const warehouseMap = {};
    items.forEach(it => {
      const wh = it.warehouse_name || 'Khác';
      if (!warehouseMap[wh]) warehouseMap[wh] = { name: wh, value: 0, qty: 0 };
      warehouseMap[wh].value += (it.on_hand_qty || 0) * (it.sale_price || 0);
      warehouseMap[wh].qty += Number(it.on_hand_qty || 0);
    });
    const whChart = Object.values(warehouseMap).sort((a, b) => b.value - a.value);

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Mã SP" value={summary.totalItems} accent={roleColor} icon="ri-box-3-line" />
          <StatCard label="Tổng tồn" value={summary.totalQty} accent="#10b981" icon="ri-stack-line" />
          <StatCard label="Giá trị tồn" value={`${fmtCurrency(summary.totalValue)} đ`} accent="#f59e0b" icon="ri-coins-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Top 6 giá trị tồn cao</h3>
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...items].sort((a, b) => (b.on_hand_qty * b.sale_price) - (a.on_hand_qty * a.sale_price)).slice(0, 6)} barCategoryGap={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="sku" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000000}tr`} />
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Giá trị']} />
                  <Bar dataKey="sale_price" name="Đơn giá" radius={[8, 8, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phân bổ theo kho</h3>
            {whChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={whChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {whChart.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Giá trị']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Chi tiết tồn kho</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Sản phẩm</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Kho</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Tồn</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Đơn giá</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Thành tiền</th>
            </tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu</td></tr> :
                items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 0', fontWeight: 700 }}>{it.sku}</td>
                    <td style={{ padding: '9px 0', fontSize: 13 }}>{it.product_name}</td>
                    <td style={{ padding: '9px 0', fontSize: 13 }}>{it.warehouse_name}</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 700 }}>{it.on_hand_qty} {it.unit}</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontSize: 13 }}>{fmtCurrency(it.sale_price)} đ</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 800, color: roleColor }}>{fmtCurrency(it.total_value)} đ</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderSalesReport = () => {
    const charts = data?.charts || {};
    const tables = data?.tables || {};
    const s = data?.summary || {};

    const revenueData = (charts.revenue_by_period || []).map(r => ({ ...r, revenue: Number(r.revenue || 0), name: r.period }));
    const topProducts = Array.isArray(tables.top_products) ? tables.top_products : [];
    const topCustomers = Array.isArray(tables.top_customers) ? tables.top_customers : [];
    const orderStats = Array.isArray(tables.order_stats) ? tables.order_stats : [];

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Tổng đơn" value={s.total_orders || 0} accent={roleColor} icon="ri-shopping-bag-3-line" />
          <StatCard label="Tổng doanh thu" value={`${fmtCurrency(s.total_revenue)} đ`} accent="#10b981" icon="ri-money-cny-circle-line" />
          <StatCard label="Kỳ báo cáo" value={data?.period || '—'} accent="#7c3aed" icon="ri-calendar-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Doanh thu theo {data?.group_by === 'month' ? 'tháng' : 'ngày'}</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData} barCategoryGap={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000000}tr`} />
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Doanh thu']} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Trạng thái đơn hàng</h3>
            {orderStats.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {orderStats.map((st, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{st.status}</span>
                    <span style={{ color: '#64748b' }}>{st.count} đơn • {fmtCurrency(st.revenue)} đ</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top sản phẩm bán chạy</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>SP</th><th style={{ padding: '6px 0', textAlign: 'right' }}>SL</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Doanh thu</th>
              </tr></thead>
              <tbody>{topProducts.slice(0, 8).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13 }}>{p.total_qty || 0}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: roleColor }}>{fmtCurrency(p.total_revenue)} đ</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top khách hàng</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>Khách hàng</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Đơn</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Chi tiêu</th>
              </tr></thead>
              <tbody>{topCustomers.slice(0, 8).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{c.company_name}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13 }}>{c.order_count || 0}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmtCurrency(c.total_spent)} đ</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderLogisticsReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const delStats = Array.isArray(t.delivery_stats) ? t.delivery_stats : [];
    const retStats = Array.isArray(t.return_stats) ? t.return_stats : [];
    const compStats = Array.isArray(t.compensation_stats) ? t.compensation_stats : [];
    const carrierStats = Array.isArray(t.carrier_stats) ? t.carrier_stats : [];
    const delData = (charts.deliveries_by_day || []).map(r => ({ ...r, deliveries: Number(r.deliveries || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Giao hàng" value={delStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent={roleColor} icon="ri-truck-line" />
          <StatCard label="Hoàn hàng" value={retStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#f97316" icon="ri-arrow-go-back-line" />
          <StatCard label="Phiếu bù" value={compStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#ef4444" icon="ri-file-list-3-line" />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Giao hàng theo ngày</h3>
          {delData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={delData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="deliveries" fill={roleColor} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Đơn vị vận chuyển</h3>
            {carrierStats.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              carrierStats.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{c.carrier_code}</span>
                  <span style={{ color: '#64748b' }}>{c.shipments} đơn • {c.delivered} giao thành công</span>
                </div>
              ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù theo loại lỗi</h3>
            {compStats.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              compStats.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{c.defect_type}</span>
                  <span style={{ color: '#64748b' }}>{c.count} phiếu • {c.total_items} SP • {c.status}</span>
                </div>
              ))}
          </div>
        </div>
      </>
    );
  };

  const renderWarehouseReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const recStats = Array.isArray(t.receipt_stats) ? t.receipt_stats : [];
    const outStats = Array.isArray(t.outbound_stats) ? t.outbound_stats : [];
    const whSummary = Array.isArray(t.warehouse_summary) ? t.warehouse_summary : [];
    const productMove = Array.isArray(t.product_movement) ? t.product_movement : [];
    const recData = (charts.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));
    const outData = (charts.outbounds_by_day || []).map(r => ({ ...r, outbounds: Number(r.outbounds || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          {recStats.map((st, i) => (
            <StatCard key={i} label={`Nhập: ${st.status}`} value={`${st.count} phiếu`} accent={roleColor} icon="ri-inbox-archive-line" />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Nhập kho theo ngày</h3>
            {recData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="receipts" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Xuất kho theo ngày</h3>
            {outData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={outData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="outbounds" fill="#7c3aed" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Biến động hàng hóa</h3>
            {productMove.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                  <th style={{ padding: '6px 0', textAlign: 'left' }}>SP</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Nhập</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Xuất</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Tồn</th>
                </tr></thead>
                <tbody>{productMove.slice(0, 10).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', color: '#10b981' }}>{p.total_in || 0}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', color: '#ef4444' }}>{p.total_out || 0}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700 }}>{p.current_stock || 0}</td>
                  </tr>
                ))}</tbody>
              </table>
            }
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Tổng hợp theo kho</h3>
            {whSummary.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              whSummary.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', marginBottom: 6, fontSize: 13, border: '1px solid #e0e7ff' }}>
                  <div><div style={{ fontWeight: 700 }}>{w.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{w.product_types} loại SP</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800 }}>{w.total_qty || 0} SP</div><div style={{ fontSize: 11, color: '#64748b' }}>Nhập: {w.receipt_count || 0} • Xuất: {w.outbound_count || 0}</div></div>
                </div>
              ))
            }
          </div>
        </div>
      </>
    );
  };

  const renderFactoryReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const recStats = Array.isArray(t.receipt_stats) ? t.receipt_stats : [];
    const compStats = Array.isArray(t.compensation_stats) ? t.compensation_stats : [];
    const pendingRec = Array.isArray(t.pending_receipts) ? t.pending_receipts : [];
    const pendingComp = Array.isArray(t.pending_compensations) ? t.pending_compensations : [];
    const recData = (charts.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Phiếu nhập" value={recStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent={roleColor} icon="ri-inbox-archive-line" />
          <StatCard label="Phiếu bù" value={compStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#ef4444" icon="ri-file-list-3-line" />
          <StatCard label="Kỳ báo cáo" value={data?.period || '—'} accent="#7c3aed" icon="ri-calendar-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phiếu nhập theo ngày</h3>
            {recData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="receipts" fill={roleColor} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Trạng thái phiếu bù</h3>
            {compStats.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div> :
              <div style={{ display: 'grid', gap: 8 }}>
                {compStats.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{c.defect_type} — {c.status}</span>
                    <span style={{ color: '#64748b' }}>{c.count} phiếu • {c.total_items || 0} SP</span>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu nhập chờ duyệt</h3>
            {pendingRec.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Không có phiếu chờ</div> :
              pendingRec.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 6, fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700 }}>{r.receipt_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{r.warehouse_name || '—'} • {r.item_count || 0} SP</div></div>
                  <span style={{ fontSize: 12, color: '#92400e' }}>{r.note?.slice(0, 25) || '—'}</span>
                </div>
              ))
            }
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù chờ xử lý</h3>
            {pendingComp.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Không có phiếu bù chờ</div> :
              pendingComp.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 6, fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700, color: '#ef4444' }}>{c.compensation_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{c.order_no} • {c.customer_name || '—'}</div></div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 11 }}>{c.defect_type}</span>
                </div>
              ))
            }
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: 'linear-gradient(160deg, #f5f7fb, #eef3f9)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{roleTitle}</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Chu kỳ: <strong>{data?.period || 'Tất cả'}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PERIOD_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p.value ? roleColor : '#fff', color: period === p.value ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {p.label}
              </button>
            ))}
            <button
              onClick={() => roleId === 1 || !roleId ? exportInventoryReport(data)
                : roleId === 2 ? exportSalesReport(data)
                : roleId === 3 ? exportLogisticsReport(data)
                : roleId === 4 ? exportWarehouseReport(data)
                : exportFactoryReport(data)}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #dbe3ee', background: '#fff', color: roleColor, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />Xuất Excel
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ padding: 24, color: '#b91c1c', background: '#fee2e2', borderRadius: 16, border: '1px solid #fecaca' }}>{error}</div>
        ) : roleId === 1 || !roleId ? renderInventoryReport() :
          roleId === 2 ? renderSalesReport() :
          roleId === 3 ? renderLogisticsReport() :
          roleId === 4 ? renderWarehouseReport() :
          roleId === 5 ? renderFactoryReport() :
          <div style={{ padding: 24, color: '#64748b' }}>Không có báo cáo phù hợp với vai trò của bạn.</div>
        }
      </div>
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\AccountsPage.jsx ===
`jsx
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const initialFormState = {
  email: '',
  password: '',
  fullName: '',
  roleId: '2'
};

const roleMeta = {
  1: { name: 'Ban Giám Đốc (Admin)', short: 'Admin', color: '#b42318', bg: '#fef3f2', border: '#fecdca', icon: 'ri-shield-star-line' },
  2: { name: 'Kinh Doanh (Sales)', short: 'Sales', color: '#175cd3', bg: '#eff8ff', border: '#b2ddff', icon: 'ri-briefcase-4-line' },
  3: { name: 'Giao Vận (Logistics)', short: 'Logistics', color: '#b54708', bg: '#fffaeb', border: '#fedf89', icon: 'ri-truck-line' },
  4: { name: 'Thủ Kho', short: 'Kho', color: '#067647', bg: '#ecfdf3', border: '#abefc6', icon: 'ri-store-2-line' },
  5: { name: 'Nhà Máy', short: 'Nhà máy', color: '#6941c6', bg: '#f4f3ff', border: '#d9d6fe', icon: 'ri-building-4-line' }
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '28px',
    background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 38%, #f1f5f9 100%)',
    color: '#0f172a'
  },
  shell: { maxWidth: '1440px', margin: '0 auto' },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  heroTitle: { margin: 0, fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.04em' },
  heroSubtitle: { margin: '8px 0 0', maxWidth: '820px', color: '#64748b', lineHeight: 1.7, fontSize: '14px' },
  buttonPrimary: {
    padding: '13px 18px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 14px 24px rgba(37,99,235,0.22)'
  },
  buttonGhost: {
    padding: '13px 18px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 800,
    cursor: 'pointer'
  },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' },
  statCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '22px',
    padding: '18px',
    background: '#fff',
    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
    border: '1px solid rgba(148,163,184,0.14)',
    minHeight: '108px',
    willChange: 'transform, box-shadow'
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '12px',
    fontSize: '18px',
    color: '#fff'
  },
  statBlue: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  statAmber: { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
  card: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(148,163,184,0.18)',
    boxShadow: '0 16px 40px rgba(15,23,42,0.08)'
  },
  cardHeader: { padding: '20px 20px 0' },
  cardBody: { padding: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' },
  cardSubtitle: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.6 },
  tableWrap: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  td: { padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid transparent'
  },
  editBtn: {
    width: '38px',
    height: '38px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#2563eb',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 6px 14px rgba(15,23,42,0.04)'
  },
  deleteBtn: {
    width: '38px',
    height: '38px',
    border: '1px solid #fee2e2',
    background: '#fff5f5',
    color: '#ef4444',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 6px 14px rgba(239,68,68,0.06)'
  },
  empty: { padding: '40px 20px', textAlign: 'center', color: '#64748b' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.58)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modal: {
    width: 'min(760px, 100%)',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '24px',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
    border: '1px solid rgba(148,163,184,0.16)'
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 700
  },
  hint: { color: '#94a3b8', fontSize: '12px', marginTop: '-2px' },
  modalActions: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', gridColumn: '1 / -1', marginTop: '4px' }
};

export default function AccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredAddButton, setHoveredAddButton] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [form, setForm] = useState(initialFormState);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      alert('Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const enter = () => {
      setPageLoaded(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true)));
    };

    fetchUsers();
    enter();
    setPortalReady(true);

    window.addEventListener('pageshow', enter);
    return () => window.removeEventListener('pageshow', enter);
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const roleRank = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

    return users
      .filter((user) => {
        const matchesRole = roleFilter === 'all' || String(user.role_id) === roleFilter;
        const email = (user.email || '').toLowerCase();
        const fullName = (user.full_name || '').toLowerCase();
        const roleName = (roleMeta[user.role_id]?.name || '').toLowerCase();
        const matchesText = !keyword || email.includes(keyword) || fullName.includes(keyword) || roleName.includes(keyword);

        return matchesRole && matchesText;
      })
      .sort((a, b) => (roleRank[a.role_id] || 99) - (roleRank[b.role_id] || 99));
  }, [roleFilter, searchTerm, users]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => String(user.role_id) === '1').length,
    activeRoles: new Set(users.map((user) => user.role_id)).size
  }), [users]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialFormState);
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setForm({
      email: user.email || '',
      password: '',
      fullName: user.full_name || '',
      roleId: String(user.role_id || '2')
    });
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const closeModal = () => {
    setIsModalVisible(false);
    window.setTimeout(() => {
      setIsModalOpen(false);
      setEditingId(null);
      setForm(initialFormState);
    }, 220);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/auth/users/${editingId}`, {
          full_name: form.fullName,
          role_id: form.roleId,
          password: form.password || undefined
        });
        alert('Cập nhật tài khoản thành công!');
      } else {
        await api.post('/auth/users', {
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          role_id: form.roleId
        });
        alert('Tạo tài khoản mới thành công!');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi hệ thống!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa tài khoản của ${name} không?`)) {
      try {
        await api.delete(`/auth/users/${id}`);
        alert('Đã xóa thành công!');
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi khi xóa!');
      }
    }
  };

  const renderModal = () => {
    if (!isModalOpen || !portalReady || typeof document === 'undefined') return null;

    return createPortal(
      <div style={{ ...styles.overlay, background: isModalVisible ? 'rgba(15, 23, 42, 0.58)' : 'rgba(15, 23, 42, 0)' }} onClick={closeModal}>
        <div
          style={{
            ...styles.modal,
            transform: isModalVisible ? 'scale(1)' : 'scale(0.97)',
            opacity: isModalVisible ? 1 : 0,
            transition: 'transform 220ms ease, opacity 220ms ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <h3 style={styles.cardTitle}>{editingId ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <p style={styles.cardSubtitle}>
                {editingId ? 'Cập nhật thông tin và phân quyền cho tài khoản đang sử dụng.' : 'Tạo tài khoản mới với email đăng nhập, họ tên và quyền phù hợp.'}
              </p>
            </div>
            <button type="button" onClick={closeModal} style={{ ...styles.buttonGhost, padding: '10px 14px' }}>Đóng</button>
          </div>

          <div style={styles.cardBody}>
            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Email đăng nhập</label>
                <input
                  required
                  disabled={!!editingId}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="VD: nhanvien@congty.com"
                  style={{ ...styles.input, background: editingId ? '#f8fafc' : '#fff' }}
                />
                {editingId && <small style={styles.hint}>Không thể thay đổi email đăng nhập của tài khoản đã tạo.</small>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Họ và tên</label>
                <input required name="fullName" value={form.fullName} onChange={handleChange} placeholder="VD: Nguyễn Văn A" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mật khẩu</label>
                <input
                  required={!editingId}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editingId ? 'Bỏ trống nếu không đổi mật khẩu' : 'Nhập mật khẩu...'}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Chức vụ / Phòng ban</label>
                <select name="roleId" value={form.roleId} onChange={handleChange} style={styles.select}>
                  <option value="1">Ban Giám Đốc (Toàn quyền)</option>
                  <option value="2">Kinh Doanh (Tạo đơn hàng)</option>
                  <option value="3">Giao Vận (Xem địa chỉ giao)</option>
                  <option value="4">Thủ Kho (Nhập/Xuất kho)</option>
                  <option value="5">Nhà Máy (Sản xuất & Giao hàng)</option>
                </select>
                <small style={{ ...styles.hint, color: roleMeta[form.roleId]?.color || '#94a3b8' }}>
                  {roleMeta[form.roleId]?.name}
                </small>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={styles.buttonGhost}>Hủy bỏ</button>
                <button type="submit" style={styles.buttonPrimary} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div style={{ ...styles.page, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 320ms ease, transform 320ms ease' }}>
      <div style={styles.shell}>
        <div style={{ ...styles.hero, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 420ms ease 80ms, transform 420ms ease 80ms' }}>
          <div>
            <h2 style={styles.heroTitle}>Quản lý tài khoản</h2>
            <p style={styles.heroSubtitle}>
              Giao diện quản trị hiện đại, rõ ràng và đồng bộ với phong cách dashboard hiện tại. Theo dõi tài khoản, vai trò và thao tác nhanh trong một màn hình duy nhất.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={openAddModal}
              onMouseEnter={() => setHoveredAddButton(true)}
              onMouseLeave={() => setHoveredAddButton(false)}
              style={{
                ...styles.buttonPrimary,
                transform: hoveredAddButton ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredAddButton ? '0 18px 30px rgba(37,99,235,0.26)' : styles.buttonPrimary.boxShadow,
                transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease, filter 180ms ease',
                filter: hoveredAddButton ? 'brightness(1.02)' : 'none'
              }}
            >
              + Thêm tài khoản
            </button>
          </div>
        </div>

        <div style={styles.statGrid}>
          {[
            { key: 'total', label: 'Tổng tài khoản', value: stats.total, desc: 'Toàn bộ người dùng đang có trong hệ thống.', tone: 'statBlue', icon: 'ri-user-3-line' },
            { key: 'admins', label: 'Quản trị viên', value: stats.admins, desc: 'Các tài khoản có quyền cao nhất.', tone: 'statAmber', icon: 'ri-shield-star-line' },
            { key: 'roles', label: 'Nhóm quyền', value: stats.activeRoles, desc: 'Số loại vai trò đang được sử dụng.', tone: 'statEmerald', icon: 'ri-settings-3-line' }
          ].map((item, index) => (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredStat(item.key)}
              onMouseLeave={() => setHoveredStat(null)}
              style={{
                ...styles.statCard,
                opacity: pageLoaded ? 1 : 0,
                transform: hoveredStat === item.key ? 'translateY(-5px) scale(1.01)' : pageLoaded ? 'translateY(0) scale(1)' : 'translateY(18px) scale(1)',
                boxShadow: hoveredStat === item.key
                  ? item.key === 'total'
                    ? '0 18px 36px rgba(37,99,235,0.14), 0 12px 24px rgba(37,99,235,0.10)'
                    : item.key === 'admins'
                      ? '0 18px 36px rgba(245,158,11,0.16), 0 12px 24px rgba(245,158,11,0.10)'
                      : '0 18px 36px rgba(16,185,129,0.16), 0 12px 24px rgba(16,185,129,0.10)'
                  : undefined,
                transition: `opacity 420ms ease ${120 + index * 100}ms, transform 460ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 460ms cubic-bezier(0.22, 1, 0.36, 1)`
              }}
            >
              <div style={{ ...styles.statIcon, ...styles[item.tone] }}><i className={item.icon} /></div>
              <p style={styles.statLabel}>{item.label}</p>
              <div style={styles.statValue}>{item.value}</div>
              <p style={styles.statDesc}>{item.desc}</p>
            </div>
          ))}
        </div>

        <section
          style={{
            ...styles.card,
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 460ms ease 180ms, transform 460ms ease 180ms'
          }}
        >
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Danh sách tài khoản</h3>
            <p style={styles.cardSubtitle}>Bảng thông tin được thiết kế tối giản nhưng giàu độ tương phản để dễ đọc và thao tác quản trị nhanh.</p>
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(240px, 0.7fr)', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <i
                  className="ri-search-line"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo email, họ tên hoặc quyền..."
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.04)',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease'
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <i
                  className="ri-filter-3-line"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.04)',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease'
                  }}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="1">Ban Giám Đốc (Admin)</option>
                  <option value="2">Kinh Doanh (Sales)</option>
                  <option value="3">Giao Vận (Logistics)</option>
                  <option value="4">Thủ Kho</option>
                  <option value="5">Nhà Máy</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ ...styles.cardBody, padding: '20px 24px 24px' }}>
            {loading ? (
              <div style={styles.empty}>Đang tải dữ liệu...</div>
            ) : users.length === 0 ? (
              <div style={styles.empty}>Chưa có tài khoản nào. Hãy tạo tài khoản đầu tiên để bắt đầu.</div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.empty}>Không có tài khoản nào phù hợp với từ khóa hoặc bộ lọc hiện tại.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={{ ...styles.table, minWidth: '1100px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, minWidth: '260px' }}>Email đăng nhập</th>
                      <th style={{ ...styles.th, minWidth: '220px' }}>Họ và tên</th>
                      <th style={{ ...styles.th, minWidth: '240px' }}>Chức vụ / Quyền</th>
                      <th style={{ ...styles.th, minWidth: '140px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => {
                      const role = roleMeta[user.role_id] || { name: 'Chưa rõ', color: '#475467', bg: '#f2f4f7', border: '#d0d5dd', icon: '•' };
                      return (
                        <tr
                          key={user.id}
                          onMouseEnter={() => setHoveredRowId(user.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            opacity: pageLoaded ? 1 : 0,
                            transform: hoveredRowId === user.id ? 'translateY(-2px)' : pageLoaded ? 'translateY(0)' : 'translateY(10px)',
                            background: hoveredRowId === user.id ? '#f8fbff' : 'transparent',
                            boxShadow: hoveredRowId === user.id ? '0 10px 24px rgba(15,23,42,0.06)' : 'none',
                            transition: `opacity 360ms ease ${120 + index * 70}ms, transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, box-shadow 180ms ease`
                          }}
                        >
                          <td style={styles.td}>
                            <div style={{ fontWeight: 800 }}>{user.email}</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Tài khoản đăng nhập hệ thống</div>
                          </td>
                          <td style={styles.td}>{user.full_name}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.roleBadge, color: role.color, background: role.bg, borderColor: role.border }}>
                              <i className={role.icon} />
                              <span>{role.name}</span>
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <button type="button" title="Sửa tài khoản" aria-label="Sửa tài khoản" onClick={() => openEditModal(user)} style={{ ...styles.editBtn, transform: hoveredRowId === user.id ? 'translateY(-1px)' : 'translateY(0)', transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', boxShadow: hoveredRowId === user.id ? '0 10px 18px rgba(37,99,235,0.10)' : '0 6px 14px rgba(15,23,42,0.04)' }}>
                                <i className="ri-edit-2-line" />
                              </button>
                              {String(user.role_id) !== '1' && (
                                <button type="button" title="Xóa tài khoản" aria-label="Xóa tài khoản" onClick={() => handleDelete(user.id, user.full_name)} style={{ ...styles.deleteBtn, transform: hoveredRowId === user.id ? 'translateY(-1px)' : 'translateY(0)', transition: 'transform 180ms ease, box-shadow 180ms ease', boxShadow: hoveredRowId === user.id ? '0 10px 18px rgba(239,68,68,0.12)' : '0 6px 14px rgba(239,68,68,0.06)' }}>
                                <i className="ri-delete-bin-line" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {renderModal()}
    </div>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\pages\WarehousesPage.jsx ===
`jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { colors, spacing, radius, shadows, card, btn, input, badge, pageWrap } from '../styles/theme';

// ---- SVG Icons ----
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconPackage = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
  </svg>
);
const IconWarehouse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
  </svg>
);

// ---- Formatted number ----
const fmtVND = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ---- Status badge ----
const StockBadge = ({ status }) => {
  const map = {
    'in-stock':   { label: 'Còn hàng', bg: colors.successSoft, color: colors.success, border: colors.successBorder },
    'low-stock':  { label: 'Sắp hết',  bg: colors.warningSoft, color: colors.warning, border: colors.warningBorder },
    'out-stock':  { label: 'Hết hàng',  bg: colors.dangerSoft, color: colors.danger,  border: colors.dangerBorder },
  };
  const s = map[status] || map['in-stock'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: radius.full,
      fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {status === 'in-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.success, display: 'inline-block' }} />}
      {status === 'low-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.warning, display: 'inline-block' }} />}
      {status === 'out-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.danger, display: 'inline-block' }} />}
      {s.label}
    </span>
  );
};

// ---- Defect type badge ----
const DefectBadge = ({ type }) => {
  const map = {
    'loi_van_tai': { label: 'Lỗi vận chuyển', bg: '#fff3e0', color: '#e65100', border: '#ffb74d' },
    'loi_nha_may': { label: 'Lỗi nhà máy', bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
  };
  const s = map[type] || { label: type, bg: '#f5f5f5', color: '#757575', border: '#bdbdbd' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: radius.full,
      fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

// ---- Modal overlay ----
const Modal = ({ children, onClose, maxW = 560 }) => {
  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: spacing.md,
    animation: 'fadeIn 200ms ease',
  };
  const panelStyle = {
    background: colors.white, borderRadius: radius.xl,
    boxShadow: shadows.xl, width: '100%', maxWidth: maxW,
    maxHeight: '90vh', overflowY: 'auto',
    animation: 'slideUp 250ms ease',
  };
  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>{children}</div>
    </div>
  );
};

// ---- Modal Header ----
const ModalHeader = ({ title, subtitle, icon, onClose, color = colors.primary }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `1.5px solid ${colors.border}`,
  }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: radius.lg,
          background: color + '18', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.text }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textMuted }}>{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} style={{
      width: 36, height: 36, borderRadius: radius.md,
      background: colors.backgroundAlt, color: colors.textSecondary,
      border: 'none', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      transition: 'all 200ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.dangerSoft; e.currentTarget.style.color = colors.danger; }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.backgroundAlt; e.currentTarget.style.color = colors.textSecondary; }}
    >
      <IconClose />
    </button>
  </div>
);

// ---- Form Field ----
const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: colors.textSecondary }}>
      {label} {required && <span style={{ color: colors.danger }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>{hint}</p>}
  </div>
);

// ---- Form Input ----
const FormInput = ({ style: extraStyle, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`; }}
    onBlur={e => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }}
  />
);

const FormSelect = ({ style: extraStyle, children, ...props }) => (
  <select
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      cursor: 'pointer',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; }}
    onBlur={e => { e.target.style.borderColor = colors.border; }}
  >
    {children}
  </select>
);

// ============================================================

export default function WarehousesPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [defectiveOrders, setDefectiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWHModalOpen, setIsWHModalOpen] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'defective'
  const [defectiveSearch, setDefectiveSearch] = useState('');
  const [defectiveFilterType, setDefectiveFilterType] = useState('all');
  const skuInputRef = useRef(null);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [newSku, setNewSku] = useState('');
  const [nextSku, setNextSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Cái');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newMinStock, setNewMinStock] = useState('50');
  const [searchText, setSearchText] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [initialStock, setInitialStock] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // Category management
  const [categories, setCategories] = useState(['Ống thép', 'Phụ kiện', 'Vật tư', 'Thiết bị']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Warehouse form
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user?.role_id === 1 || user?.role_id === 4;

  // ---- Fetch data ----
  const fetchData = async () => {
    try {
      const [pRes, wRes, dRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses'),
        api.get('/warehouses/defective-orders'),
      ]);
      setProducts(pRes.data);
      setWarehouses(wRes.data);
      setDefectiveOrders(dRes.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isModalOpen && !isWHModalOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { setIsModalOpen(false); setIsWHModalOpen(false); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, isWHModalOpen]);

  useEffect(() => {
    if (location.state?.filter === 'low-stock') setFilterMode('low-stock');
    if (location.state?.filter === 'all-stock') setFilterMode('all');
  }, [location.state]);

  // ---- Helpers ----
  const parseStockBreakdown = (breakdown = '') =>
    String(breakdown).split(' | ').map(e => e.trim()).filter(Boolean).map(entry => {
      const [warehouseName, qtyText] = entry.split(': ');
      return { warehouseName: warehouseName?.trim() || '', quantity: Number.parseInt(qtyText, 10) || 0 };
    }).filter(e => e.warehouseName);

  const selectedWarehouse = warehouses.find(w => String(w.id) === String(viewFilter));

  const getWarehouseStockRows = (item) => {
    const rows = parseStockBreakdown(item.stock_breakdown);
    if (viewFilter === 'all') return rows;
    return rows.filter(r => r.warehouseName === selectedWarehouse?.name);
  };

  const getDisplayQty = (item) => {
    const totalQty = Number(item.total_stock || item.stock || 0);
    if (viewFilter === 'all') return totalQty;
    return getWarehouseStockRows(item)[0]?.quantity || 0;
  };

  const getStockStatus = (qty, minStock) => {
    if (qty <= 0) return 'out-stock';
    if (qty < minStock) return 'low-stock';
    return 'in-stock';
  };

  const getWarehouseAlerts = (item) => {
    const minStock = Number(item.min_stock) || 50;
    return parseStockBreakdown(item.stock_breakdown)
      .map(r => ({ ...r, status: getStockStatus(r.quantity, minStock), minStock }))
      .filter(r => r.status !== 'in-stock');
  };

  const filteredProducts = products.filter(item => {
    const minStock = Number(item.min_stock) || 50;
    const totalQty = Number(item.total_stock || item.stock || 0);
    const warehouseRows = getWarehouseStockRows(item);
    const viewQty = viewFilter === 'all' ? totalQty : (warehouseRows[0]?.quantity || 0);
    const viewStatus = getStockStatus(viewQty, minStock);
    const warehouseAlerts = getWarehouseAlerts(item);
    const hasLow = warehouseAlerts.some(r => r.status === 'low-stock');
    const hasOut = warehouseAlerts.some(r => r.status === 'out-stock');

    const matchesStatus =
      filterMode === 'all' ||
      (filterMode === 'low-stock' && (viewFilter === 'all' ? hasLow : viewStatus === 'low-stock')) ||
      (filterMode === 'out-stock' && (viewFilter === 'all' ? hasOut : viewStatus === 'out-stock'));

    const search = searchText.trim().toLowerCase();
    const matchesSearch = !search ||
      [item.name, item.sku, item.category].some(v => String(v || '').toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  // ---- Defective orders filtering ----
  const filteredDefectiveOrders = defectiveOrders.filter(item => {
    const search = defectiveSearch.trim().toLowerCase();
    const matchesSearch = !search ||
      String(item.order_no || '').toLowerCase().includes(search) ||
      String(item.customer_name || '').toLowerCase().includes(search);
    const matchesType = defectiveFilterType === 'all' || item.logistics_action === defectiveFilterType;
    return matchesSearch && matchesType;
  });

  // ---- Actions ----
  const openAddModal = async () => {
    setEditingId(null);
    setNewSku('');
    setNewName(''); setNewPrice(''); setNewUnit('Cái');
    setNewCategory(''); setNewImageUrl(''); setNewMinStock('50');
    setInitialStock(0); setTargetWarehouse('all');
    try {
      const res = await api.get('/products/next-code');
      setNextSku(res.data.sku || '');
    } catch {
      setNextSku('');
    }
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewSku(product.sku || '');
    setNewName(product.name);
    setNewPrice(product.sale_price);
    setNewUnit(product.unit || 'Cái');
    setNewCategory(product.category || '');
    setNewImageUrl(product.image_url || '');
    setNewMinStock(String(product.min_stock ?? 50));
    setInitialStock('');
    setTargetWarehouse(warehouses[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', { name: whName, location: whLocation });
      setIsWHModalOpen(false); setWhName(''); setWhLocation('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    setCategories(prev => [...prev, name]);
    setNewCategory(name);
    setIsCategoryModalOpen(false);
    setNewCategoryInput('');
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          sku: newSku, name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          adjust_stock: initialStock, target_warehouse: targetWarehouse,
        });
      } else {
        await api.post('/products', {
          sku: nextSku,
          name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          initial_stock: initialStock, warehouse_id: targetWarehouse,
        });
      }
      setIsModalOpen(false); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await api.delete(`/products/${deleteConfirmProduct.id}`);
      setDeleteConfirmProduct(null); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  // ---- Excel Export for Defective Orders ----
  const handleExportDefective = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Loại lỗi', 'Ngày tạo', 'Kho gốc', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
    const rows = filteredDefectiveOrders.map(item => {
      const items = item.order_items || [];
      const productLines = items.map(i =>
        `${i.product_name || ''} (${i.sku || ''}) x${i.quantity}`
      ).join('; ');
      const total = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price || 0)), 0);
      return [
        item.order_no || '',
        item.customer_name || '',
        item.logistics_action === 'loi_van_tai' ? 'Lỗi vận chuyển' : 'Lỗi nhà máy',
        fmtDate(item.created_at),
        item.warehouse_name || '—',
        productLines,
        items.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
        fmtVND(total),
        fmtVND(total),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KhoLoi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isFiltered = viewFilter !== 'all' || filterMode !== 'all' || searchText.trim();

  return (
    <div style={pageWrap}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .product-card:hover .card-actions { opacity: 1 !important; }
        @media (max-width: 640px) {
          .prod-wrap { padding: 8px !important; }
          .prod-header { flex-direction: column !important; align-items: flex-start !important; }
          .prod-header-btns { width: 100% !important; }
          .prod-header-btns > * { flex: 1 !important; }
          .prod-filter-row { grid-template-columns: 1fr !important; }
          .prod-filter-row > * { min-width: 0; }
          .prod-status-pills { flex-wrap: wrap !important; }
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 10px !important; }
          .prod-card-img { height: 100px !important; }
          .prod-card-body { padding: 8px !important; }
          .prod-card-title { font-size: 12px !important; line-height: 1.2 !important; }
          .prod-card-price { font-size: 11px !important; }
          .prod-card-qty { font-size: 16px !important; }
          .prod-page-title { font-size: 20px !important; }
          .prod-filter-bar { padding: 12px !important; }
          .prod-header-btns > button { font-size: 12px !important; padding: 8px 12px !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important; gap: 12px !important; }
          .prod-card-img { height: 150px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }} className="prod-wrap">

        {/* ---- PAGE HEADER ---- */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: 16, marginBottom: 24,
          animation: 'fadeUp 400ms ease both',
        }} className="prod-header">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: radius.full,
              background: colors.primarySoft, color: colors.primary,
              fontSize: 12, fontWeight: 700, marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary }} />
              Quản lý
            </div>
            <h1 className="prod-page-title" style={{ margin: 0, fontSize: 30, fontWeight: 900, color: colors.text, letterSpacing: '-0.03em' }}>
              Quản lý Kho
            </h1>
            <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 14 }}>
              {loading ? 'Đang tải...' : activeTab === 'inventory'
                ? `${filteredProducts.length} / ${products.length} sản phẩm`
                : `${filteredDefectiveOrders.length} đơn lỗi`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="prod-header-btns">
            {canEdit && (
              <>
                <button
                  onClick={() => setIsWHModalOpen(true)}
                  style={{
                    ...btn('secondary', 'md'),
                    borderColor: colors.purpleBorder,
                    color: colors.purple,
                  }}
                >
                  <IconWarehouse /> Kho
                </button>
                <button onClick={openAddModal} style={btn('primary', 'md')}>
                  <IconPlus /> Thêm sản phẩm
                </button>
              </>
            )}
          </div>
        </div>

        {/* ---- TAB SWITCHER ---- */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: colors.backgroundAlt, padding: 4,
          borderRadius: radius.lg, width: 'fit-content',
          animation: 'fadeUp 400ms ease 40ms both',
        }}>
          {[
            { key: 'inventory', label: 'Tồn kho', icon: <IconPackage /> },
            { key: 'defective', label: 'Kho lỗi', icon: <IconWarning />, count: defectiveOrders.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px',
                borderRadius: radius.md,
                border: 'none',
                background: activeTab === tab.key ? colors.white : 'transparent',
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: activeTab === tab.key ? shadows.sm : 'none',
                transition: 'all 200ms ease',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 20, height: 20, padding: '0 6px',
                  borderRadius: radius.full,
                  background: activeTab === tab.key ? colors.primarySoft : colors.dangerSoft,
                  color: activeTab === tab.key ? colors.primary : colors.danger,
                  fontSize: 11, fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* =================== TAB: TỒN KHO =================== */}
        {activeTab === 'inventory' && (
          <>
        {/* ---- FILTER BAR ---- */}
        <div style={{
          ...card({ marginBottom: 20, padding: '16px 20px' }),
          animation: 'fadeUp 400ms ease 80ms both',
        }}>
          {/* Search + Filter Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1fr)',
            gap: 12, alignItems: 'center',
          }} className="prod-filter-row">
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 14px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: radius.md, background: colors.backgroundAlt,
              height: 44, transition: 'border-color 200ms',
            }}
              onFocus={e => e.currentTarget.style.borderColor = colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            >
              <span style={{ color: colors.textMuted, flexShrink: 0 }}><IconSearch /></span>
              <input
                placeholder="Tìm tên, mã SKU, danh mục..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  outline: 'none', color: colors.text, fontSize: 14,
                }}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: colors.textMuted, padding: 0, display: 'flex',
                }}>
                  <IconClose size={14} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 6 }} className="prod-status-pills">
              {[
                { key: 'all', label: 'Tất cả', color: colors.textSecondary },
                { key: 'low-stock', label: 'Sắp hết', color: colors.warning },
                { key: 'out-stock', label: 'Hết hàng', color: colors.danger },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterMode(f.key)} style={{
                  padding: '8px 14px', borderRadius: radius.md,
                  border: `1.5px solid ${filterMode === f.key ? f.color : 'transparent'}`,
                  background: filterMode === f.key ? f.color + '15' : colors.backgroundAlt,
                  color: filterMode === f.key ? f.color : colors.textMuted,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Warehouse filter */}
            <FormSelect
              value={viewFilter}
              onChange={e => setViewFilter(e.target.value)}
              style={{ height: 44 }}
            >
              <option value="all">Tất cả kho</option>
              {warehouses.filter(w => w.warehouse_code !== 'KHO-LOI').map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </FormSelect>
          </div>

          {/* Filter status bar */}
          {isFiltered && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: `1px solid ${colors.borderLight}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                Đang lọc {filteredProducts.length} kết quả
              </span>
              <button
                onClick={() => { setViewFilter('all'); setFilterMode('all'); setSearchText(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: radius.md,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.white, color: colors.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <IconClose size={12} /> Xóa lọc
              </button>
            </div>
          )}
        </div>

        {/* ---- PRODUCT GRID ---- */}
        {loading ? (
          <div style={{ ...card(), textAlign: 'center', padding: 60, color: colors.textMuted }}>
            <div style={{ marginBottom: 12, opacity: 0.5 }}><IconPackage /></div>
            <p>Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            ...card(), textAlign: 'center', padding: 60,
            animation: 'fadeUp 400ms ease 120ms both',
          }}>
            <div style={{ color: colors.textMuted, marginBottom: 12, opacity: 0.4 }}><IconPackage /></div>
            <p style={{ fontWeight: 700, color: colors.text }}>Chưa có sản phẩm nào</p>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {isFiltered ? 'Thử thay đổi bộ lọc để xem thêm sản phẩm.' : 'Bấm "Thêm sản phẩm" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16, marginBottom: 32,
          }} className="prod-grid">
            {filteredProducts.map((item, i) => {
              const minStock = Number(item.min_stock) || 50;
              const displayQty = getDisplayQty(item);
              const status = getStockStatus(displayQty, minStock);
              const warehouseAlerts = getWarehouseAlerts(item);
              const activeWarehouseName = viewFilter === 'all' ? null : selectedWarehouse?.name;
              const activeAlert = activeWarehouseName
                ? warehouseAlerts.find(r => r.warehouseName === activeWarehouseName)
                : null;
              const warehouseSummary = activeAlert
                ? `${activeAlert.warehouseName}: ${activeAlert.status === 'out-stock' ? 'hết' : 'sắp hết'} (${activeAlert.quantity}/${minStock})`
                : null;

              return (
                <div
                  key={item.id}
                  className="product-card"
                  style={{
                    ...card({ padding: 0, overflow: 'hidden' }),
                    animation: `fadeUp 400ms ease ${80 + i * 40}ms both`,
                    transition: 'transform 220ms ease, box-shadow 220ms ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = shadows.lg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.md;
                  }}
                >
                  {/* Image */}
                  <div style={{
                    height: 220, position: 'relative', overflow: 'hidden',
                    background: item.image_url
                      ? `url(${item.image_url}) center/cover no-repeat`
                      : `linear-gradient(160deg, ${colors.primarySoft} 0%, #e8edf8 60%, ${colors.primarySoft}88 100%)`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }} className="prod-card-img">
                    {!item.image_url && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: colors.primary, gap: 6,
                      }}>
                        <IconPackage />
                        <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary, opacity: 0.6 }}>Chưa có ảnh</span>
                      </div>
                    )}
                    {/* SKU chip */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      padding: '3px 8px', borderRadius: radius.full,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      fontSize: 11, fontWeight: 700, color: colors.text,
                      fontFamily: 'monospace',
                    }}>
                      {item.sku}
                    </div>
                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StockBadge status={status} />
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '18px 18px 18px' }} className="prod-card-body">
                    <h3 className="prod-card-title" style={{
                      margin: '0 0 8px', fontSize: 15, fontWeight: 800,
                      color: colors.text, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.name}
                    </h3>

                    {/* Category */}
                    {item.category && (
                      <span style={{
                        display: 'inline-block', marginBottom: 10,
                        padding: '3px 8px', borderRadius: radius.full,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {item.category}
                      </span>
                    )}

                    {/* Warehouse alert */}
                    {warehouseSummary && (
                      <div style={{
                        marginBottom: 10, padding: '7px 10px', borderRadius: radius.md,
                        background: colors.warningSoft, border: `1px solid ${colors.warningBorder}`,
                        fontSize: 11, color: colors.warning, fontWeight: 600,
                      }}>
                        <IconWarning /> {warehouseSummary}
                      </div>
                    )}

                    {/* Price + Stock row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                      paddingTop: 10, borderTop: `1px solid ${colors.borderLight}`,
                      marginTop: 4,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Đơn giá</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: colors.success }} className="prod-card-price">{fmtVND(item.sale_price)} đ</div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>/{item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 22, fontWeight: 900,
                          color: status === 'out-stock' ? colors.danger : status === 'low-stock' ? colors.warning : colors.text,
                        }} className="prod-card-qty">
                          {displayQty}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Tồn kho</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {canEdit && (
                      <div
                        className="card-actions"
                        style={{
                          display: 'flex', gap: 8, marginTop: 12,
                          opacity: hoveredProductId === item.id ? 1 : 0,
                          transition: 'opacity 200ms ease',
                        }}
                      >
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            flex: 1, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.primaryBorder}`,
                            background: colors.primarySoft, color: colors.primary,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          }}
                        >
                          <IconEdit /> Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(item)}
                          style={{
                            width: 38, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.dangerBorder}`,
                            background: colors.dangerSoft, color: colors.danger,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* =================== TAB: KHO LỖI =================== */}
        {activeTab === 'defective' && (
          <div style={{ animation: 'fadeUp 400ms ease both' }}>
            {/* Filter bar for defective */}
            <div style={{
              ...card({ marginBottom: 20, padding: '16px 20px' }),
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1,
                }}>
                  {/* Search */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0 14px',
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: radius.md, background: colors.backgroundAlt,
                    height: 40, minWidth: 220, flex: 1,
                    transition: 'border-color 200ms',
                  }}
                    onFocus={e => e.currentTarget.style.borderColor = colors.primary}
                    onBlur={e => e.currentTarget.style.borderColor = colors.border}
                  >
                    <span style={{ color: colors.textMuted, flexShrink: 0 }}><IconSearch /></span>
                    <input
                      placeholder="Tìm mã đơn, khách hàng..."
                      value={defectiveSearch}
                      onChange={e => setDefectiveSearch(e.target.value)}
                      style={{
                        border: 'none', background: 'transparent', width: '100%',
                        outline: 'none', color: colors.text, fontSize: 14,
                      }}
                    />
                    {defectiveSearch && (
                      <button onClick={() => setDefectiveSearch('')} style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: colors.textMuted, padding: 0, display: 'flex',
                      }}>
                        <IconClose size={14} />
                      </button>
                    )}
                  </div>

                  {/* Type filter */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'loi_van_tai', label: 'Lỗi vận chuyển' },
                      { key: 'loi_nha_may', label: 'Lỗi nhà máy' },
                    ].map(f => (
                      <button key={f.key} onClick={() => setDefectiveFilterType(f.key)} style={{
                        padding: '7px 14px', borderRadius: radius.md,
                        border: `1.5px solid ${defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#e65100' : f.key === 'loi_nha_may' ? '#c62828' : colors.primary) : 'transparent'}`,
                        background: defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#fff3e0' : f.key === 'loi_nha_may' ? '#fce4ec' : colors.primarySoft) : colors.backgroundAlt,
                        color: defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#e65100' : f.key === 'loi_nha_may' ? '#c62828' : colors.primary) : colors.textMuted,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Excel */}
                <button
                  onClick={handleExportDefective}
                  style={{
                    ...btn('secondary', 'md'),
                    display: 'flex', alignItems: 'center', gap: 6,
                    borderColor: colors.successBorder, color: colors.success,
                  }}
                >
                  <IconDownload /> Xuất Excel
                </button>
              </div>
            </div>

            {/* Defective orders table */}
            {loading ? (
              <div style={{ ...card(), textAlign: 'center', padding: 60, color: colors.textMuted }}>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : filteredDefectiveOrders.length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', padding: 60 }}>
                <div style={{ color: colors.textMuted, marginBottom: 12, opacity: 0.4 }}><IconWarning /></div>
                <p style={{ fontWeight: 700, color: colors.text }}>Chưa có đơn lỗi nào</p>
                <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  {defectiveSearch || defectiveFilterType !== 'all' ? 'Thử thay đổi bộ lọc.' : 'Các đơn lỗi sẽ xuất hiện tại đây khi có sự cố.'}
                </p>
              </div>
            ) : (
              <div style={{ ...card({ padding: 0 }), overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: colors.backgroundAlt }}>
                        {[
                          'Mã đơn', 'Khách hàng', 'Loại lỗi', 'Ngày tạo', 'Kho gốc', 'Sản phẩm', 'Tổng SL', 'Thành tiền', 'Trạng thái'
                        ].map(h => (
                          <th key={h} style={{
                            padding: '12px 16px', textAlign: 'left',
                            fontWeight: 700, color: colors.textSecondary,
                            borderBottom: `1.5px solid ${colors.border}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDefectiveOrders.map((item, i) => {
                        const items = item.order_items || [];
                        const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
                        const totalAmount = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
                        const isEven = i % 2 === 0;
                        return (
                          <tr key={item.id} style={{
                            background: isEven ? colors.white : colors.backgroundAlt,
                            transition: 'background 150ms',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = colors.primarySoft + '40'}
                            onMouseLeave={e => e.currentTarget.style.background = isEven ? colors.white : colors.backgroundAlt}
                          >
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: colors.primary }}>
                              {item.order_no || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>
                              {item.customer_name || '—'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <DefectBadge type={item.logistics_action} />
                            </td>
                            <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                              {fmtDate(item.created_at)}
                            </td>
                            <td style={{ padding: '12px 16px', color: colors.textSecondary }}>
                              {item.warehouse_name || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {items.slice(0, 3).map((it, idx) => (
                                  <span key={idx} style={{ fontSize: 12, color: colors.text }}>
                                    {it.product_name || '—'} <span style={{ color: colors.textMuted }}>(x{it.quantity})</span>
                                  </span>
                                ))}
                                {items.length > 3 && (
                                  <span style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                                    +{items.length - 3} sản phẩm khác
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: colors.danger }}>
                              {totalQty}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: colors.success }}>
                              {fmtVND(totalAmount)} đ
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: radius.full,
                                fontSize: 11, fontWeight: 700,
                                background: item.status === 'return_completed' ? colors.successSoft : colors.warningSoft,
                                color: item.status === 'return_completed' ? colors.success : colors.warning,
                                border: `1px solid ${item.status === 'return_completed' ? colors.successBorder : colors.warningBorder}`,
                              }}>
                                {item.status === 'return_completed' ? 'Đã xử lý' : 'Chờ xử lý'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary footer */}
                <div style={{
                  padding: '12px 20px', borderTop: `1.5px solid ${colors.border}`,
                  display: 'flex', justifyContent: 'flex-end', gap: 24,
                  background: colors.backgroundAlt, fontSize: 13,
                }}>
                  <span style={{ color: colors.textMuted }}>
                    Tổng cộng: <strong style={{ color: colors.text }}>{filteredDefectiveOrders.length} đơn lỗi</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- MODAL: ADD / EDIT PRODUCT ---- */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} maxW={560}>
            <ModalHeader
              title={editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              subtitle={editingId ? 'Cập nhật thông tin và tồn kho' : 'Nhập thông tin sản phẩm mới'}
              icon={editingId ? <IconEdit /> : <IconPackage />}
              color={editingId ? colors.warning : colors.success}
              onClose={() => setIsModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleSubmitProduct}>

                {/* SKU + Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                  <Field label="Mã SKU" required>
                    <FormInput
                      readOnly
                      value={editingId !== null ? newSku : nextSku}
                      placeholder="VD: SP-0001"
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: colors.primarySoft,
                        borderColor: colors.primaryBorder,
                        cursor: 'default',
                      }}
                    />
                  </Field>
                  <Field label="Đơn vị" required>
                    <FormSelect value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                      {['Cái', 'Bộ', 'Hộp', 'Kg', 'Lít', 'Mét', 'Chiếc', 'Bó'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <Field label="Tên sản phẩm" required>
                  <FormInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="VD: Bàn phím cơ Logitech MX" />
                </Field>

                <Field label="Danh mục">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <FormSelect
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </FormSelect>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{
                        height: 42, padding: '0 14px',
                        borderRadius: radius.md,
                        border: `1.5px solid ${colors.primaryBorder}`,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <IconPlus /> Thêm
                    </button>
                  </div>
                </Field>

                <Field label="Ảnh sản phẩm" hint="Dán URL ảnh sản phẩm">
                  <FormInput
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>

                {/* Price + Stock + MinStock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Field label="Đơn giá (đ)" required>
                    <FormInput
                      type="number" min="0"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="320000"
                    />
                  </Field>
                  <Field label={editingId ? 'Tồn mới' : 'Tồn ban đầu'} hint={editingId ? 'Đặt lại tồn kho' : 'Nhập số lượng ban đầu'}>
                    <FormInput
                      type="number" min="0"
                      value={initialStock}
                      onChange={e => setInitialStock(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Tồn tối thiểu" hint="Cảnh báo khi dưới mức">
                    <FormInput
                      type="number" min="0"
                      value={newMinStock}
                      onChange={e => setNewMinStock(e.target.value)}
                      placeholder="50"
                    />
                  </Field>
                </div>

                {/* Warehouse selector */}
                <Field label={editingId ? 'Kho điều chỉnh tồn' : 'Nhập kho ban đầu'}>
                  <FormSelect value={targetWarehouse} onChange={e => setTargetWarehouse(e.target.value)}>
                    {!editingId && <option value="all">Rải đều tất cả kho</option>}
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {editingId ? 'Kho: ' : 'Nhập vào: '}{w.name}
                      </option>
                    ))}
                  </FormSelect>
                </Field>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy bỏ
                  </button>
                  <button type="submit" style={{ ...btn(editingId ? 'primary' : 'success', 'md'), flex: 1 }}>
                    <IconCheck /> {editingId ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD WAREHOUSE ---- */}
        {isWHModalOpen && (
          <Modal onClose={() => setIsWHModalOpen(false)} maxW={420}>
            <ModalHeader
              title="Mở kho hàng mới"
              subtitle="Thêm một kho để phân bổ tồn kho"
              icon={<IconWarehouse />}
              color={colors.purple}
              onClose={() => setIsWHModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleAddWarehouse}>
                <Field label="Tên kho" required>
                  <FormInput
                    value={whName}
                    onChange={e => setWhName(e.target.value)}
                    placeholder="VD: Kho Bình Dương 2"
                    autoFocus
                  />
                </Field>
                <Field label="Vị trí / Địa chỉ">
                  <FormInput
                    value={whLocation}
                    onChange={e => setWhLocation(e.target.value)}
                    placeholder="VD: Số 5, KCN Sóng Thần, Bình Dương"
                  />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setIsWHModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy
                  </button>
                  <button type="submit" style={{ ...btn('primary', 'md'), flex: 1, background: colors.purple }}>
                    <IconPlus /> Lưu kho
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD CATEGORY ---- */}
        {isCategoryModalOpen && (
          <Modal onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }} maxW={380}>
            <ModalHeader
              title="Thêm danh mục mới"
              subtitle="Nhập tên danh mục sản phẩm"
              icon={<IconPlus />}
              color={colors.primary}
              onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
            />
            <div style={{ padding: spacing.lg }}>
              <Field label="Tên danh mục" required>
                <FormInput
                  value={newCategoryInput}
                  onChange={e => setNewCategoryInput(e.target.value)}
                  placeholder="VD: Thiết bị điện"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                />
              </Field>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(c => (
                  <span key={c} style={{
                    padding: '4px 10px', borderRadius: radius.full,
                    background: colors.backgroundAlt, color: colors.textSecondary,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
                  style={btn('secondary', 'md')}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  style={{ ...btn('primary', 'md'), flex: 1 }}
                >
                  <IconPlus /> Thêm danh mục
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: DELETE CONFIRM ---- */}
        {deleteConfirmProduct && (
          <Modal onClose={() => setDeleteConfirmProduct(null)} maxW={440}>
            <div style={{ padding: spacing.lg }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: colors.dangerSoft,
                  color: colors.danger,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <IconAlertTriangle />
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.text }}>Xóa sản phẩm?</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>
                  Bạn có chắc muốn xóa <strong style={{ color: colors.text }}>{deleteConfirmProduct.name}</strong>?<br />
                  Chỉ xóa được khi chưa phát sinh tồn kho.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteConfirmProduct(null)}
                  style={btn('secondary', 'md')}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  style={{ ...btn('danger', 'md'), flex: 1 }}
                >
                  <IconTrash /> Xóa sản phẩm
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

`



# 8. FRONTEND - Utils & Config

## === FILE: D:\Doan_5\frontend\src\config\menuConfig.js ===
`javascript
// roles: 1=Admin, 2=Sales, 3=Logistics, 4=Warehouse, 5=Factory
// parent: null = menu item thường; parent = path của parent item
export const MENU_ITEMS = [
  // --- QUẢN LÝ DANH MỤC ---
  { path: '/accounts',   name: 'Quản lý Tài khoản', icon: 'ri-user-settings-line', roles: [1] },

  { path: '/customers',  name: 'Quản lý Khách hàng', icon: 'ri-team-line',         roles: [1, 2, 3] },

  { path: '/products',   name: 'Quản lý Kho',         icon: 'ri-box-3-line',         roles: [1, 2, 3, 4, 5] },

  // --- KHO (group: Nhập Kho / Xuất Kho / Giao hàng / Trả hàng) ---
  { path: '/receipts',   name: 'Nhập Kho',            icon: 'ri-inbox-archive-line', roles: [1, 4, 5], groupParent: '/receipts' },
  { path: '/outbounds',  name: 'Xuất Kho',             icon: 'ri-send-plane-line',    roles: [1, 4],     groupParent: '/receipts' },
  { path: '/logistics',  name: 'Giao hàng',            icon: 'ri-truck-line',         roles: [1, 3],     groupParent: '/receipts' },
  { path: '/returns',    name: 'Trả hàng / Hoàn hàng', icon: 'ri-arrow-go-back-line', roles: [1, 2, 3, 4, 5], groupParent: '/receipts' },

  // --- NGHIỆP VỤ ---
  { path: '/sales-orders', name: 'Quản lý Đơn hàng',  icon: 'ri-shopping-bag-3-line', roles: [1, 2] },

  // --- BÁO CÁO ---
  { path: '/reports',    name: 'Báo cáo & Thống kê', icon: 'ri-bar-chart-box-line', roles: [1, 2, 3, 4, 5] },
];

// Dashboard items — hiện 1 cái phù hợp role
export const DASHBOARD_ITEMS = [
  { path: '/admin-dashboard',      title: 'Dashboard',         icon: 'ri-dashboard-line',     roles: [1] },
  { path: '/sales-dashboard',      title: 'Dashboard Sales',  icon: 'ri-line-chart-line',     roles: [2] },
  { path: '/logistics',            title: 'Dashboard GT',      icon: 'ri-truck-line',          roles: [3] },
  { path: '/warehouse-dashboard',  title: 'Dashboard Kho',    icon: 'ri-archive-line',       roles: [4] },
  { path: '/factory-dashboard',    title: 'Dashboard NM',     icon: 'ri-building-4-line',    roles: [5] },
];

export const KHO_GROUP_LABEL = 'Kho';

`

## === FILE: D:\Doan_5\frontend\src\styles\theme.js ===
`javascript
// ============================================================
//  DESIGN SYSTEM — STEEL STOCK
//  Tông màu xanh dương, responsive laptop + điện thoại
// ============================================================

export const colors = {
  // Primary — xanh dương chính
  primary:        '#2563eb',
  primaryLight:   '#3b82f6',
  primaryDark:    '#1d4ed8',
  primarySoft:    '#eff6ff',
  primaryBorder:  '#bfdbfe',

  // Accent / Success
  success:        '#10b981',
  successLight:   '#059669',
  successSoft:    '#ecfdf3',
  successBorder:  '#a7f3d0',

  // Warning
  warning:        '#f59e0b',
  warningLight:   '#d97706',
  warningSoft:    '#fffbeb',
  warningBorder:  '#fde68a',

  // Danger / Lỗi
  danger:         '#ef4444',
  dangerLight:    '#dc2626',
  dangerSoft:     '#fef2f2',
  dangerBorder:   '#fecaca',

  // Purple / Xuất kho
  purple:         '#7c3aed',
  purpleLight:    '#6d28d9',
  purpleSoft:     '#f5f3ff',
  purpleBorder:   '#ddd6fe',

  // Cyan
  cyan:           '#0ea5e9',
  cyanLight:      '#38bdf8',
  cyanSoft:       '#e0f2fe',

  // Neutral
  white:          '#ffffff',
  background:     '#f0f4ff',
  backgroundAlt:  '#f1f5f9',
  surface:        '#ffffff',
  border:         '#e0e7ff',
  borderLight:    '#f1f5f9',

  // Text
  text:           '#0f172a',
  textSecondary:  '#475569',
  textMuted:      '#94a3b8',
  textInverse:    '#ffffff',

  // Trạng thái đơn hàng
  statusPending:        '#f59e0b',
  statusProcessing:     '#3b82f6',
  statusWarehouse:     '#7c3aed',
  statusShipping:      '#0ea5e9',
  statusCompleted:     '#10b981',
  statusCanceled:      '#64748b',
  statusReturned:      '#f59e0b',
};

// --- SPACING & BORDER RADIUS ---
export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
};

export const radius = {
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  full: '9999px',
};

// --- SHADOW ---
export const shadows = {
  sm:  '0 1px 3px rgba(37,99,235,0.06), 0 1px 2px rgba(37,99,235,0.04)',
  md:  '0 4px 12px rgba(37,99,235,0.08), 0 2px 4px rgba(37,99,235,0.04)',
  lg:  '0 10px 28px rgba(37,99,235,0.10), 0 4px 8px rgba(37,99,235,0.06)',
  xl:  '0 20px 48px rgba(37,99,235,0.14), 0 8px 16px rgba(37,99,235,0.08)',
};

// --- TYPOGRAPHY ---
export const fonts = {
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// --- BUTTON BASE STYLE ---
export const btn = (variant = 'primary', size = 'md') => {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px', height: '32px' },
    md: { padding: '10px 20px', fontSize: '14px', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '16px', height: '48px' },
  };
  const variants = {
    primary: {
      background: colors.primary,
      color: colors.white,
      border: 'none',
      hoverBg: colors.primaryDark,
      boxShadow: `0 4px 12px ${colors.primary}33`,
    },
    secondary: {
      background: colors.white,
      color: colors.primary,
      border: `1.5px solid ${colors.border}`,
      hoverBg: colors.primarySoft,
      boxShadow: 'none',
    },
    danger: {
      background: colors.danger,
      color: colors.white,
      border: 'none',
      hoverBg: colors.dangerLight,
      boxShadow: `0 4px 12px ${colors.danger}33`,
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
      border: 'none',
      hoverBg: colors.backgroundAlt,
      boxShadow: 'none',
    },
    success: {
      background: colors.success,
      color: colors.white,
      border: 'none',
      hoverBg: colors.successLight,
      boxShadow: `0 4px 12px ${colors.success}33`,
    },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: radius.md,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    outline: 'none',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    ...s,
    background: v.background,
    color: v.color,
    border: v.border,
    boxShadow: v.boxShadow,
  };
};

// --- CARD BASE ---
export const card = (extra = {}) => ({
  background: colors.surface,
  borderRadius: radius.xl,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.md,
  padding: spacing.lg,
  ...extra,
});

// --- INPUT BASE ---
export const input = () => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.border}`,
  background: colors.white,
  color: colors.text,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
  boxSizing: 'border-box',
});

// --- BADGE BASE ---
export const badge = (variant = 'default') => {
  const map = {
    default:   { bg: colors.backgroundAlt, color: colors.textSecondary, border: colors.border },
    primary:   { bg: colors.primarySoft, color: colors.primary, border: colors.primaryBorder },
    success:   { bg: colors.successSoft, color: colors.successLight, border: colors.successBorder },
    warning:   { bg: colors.warningSoft, color: colors.warningLight, border: colors.warningBorder },
    danger:    { bg: colors.dangerSoft, color: colors.danger, border: colors.dangerBorder },
    purple:    { bg: colors.purpleSoft, color: colors.purple, border: colors.purpleBorder },
    cyan:      { bg: colors.cyanSoft, color: colors.cyan, border: '#bae6fd' },
  };
  const b = map[variant] || map.default;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: '600',
    border: `1px solid ${b.border}`,
    background: b.bg,
    color: b.color,
    gap: '4px',
  };
};

// --- PAGE WRAPPER ---
export const pageWrap = {
  minHeight: '100vh',
  padding: spacing.lg,
  background: `linear-gradient(160deg, #eff6ff 0%, ${colors.background} 40%, #f8fafc 100%)`,
  color: colors.text,
};
export const pageWrapMobile = {
  padding: spacing.sm,
};

// ============================================================
//  COMPONENT FACTORIES
// ============================================================

export const StatCard = ({ icon, value, label, sub, accent = colors.primary, delay = 0 }) => ({
  type: 'div',
  style: {
    ...card(),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    animation: `fadeUp 500ms ease ${delay}ms both`,
  },
  children: [
    {
      type: 'div',
      style: {
        width: 44, height: 44,
        borderRadius: radius.lg,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: 20,
      },
      children: icon,
    },
    {
      type: 'div',
      children: [
        { type: 'div', style: { fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: label },
        { type: 'div', style: { fontSize: 28, fontWeight: 800, color: colors.text, marginTop: 4, lineHeight: 1.1 }, children: value },
        sub ? { type: 'div', style: { fontSize: 12, color: colors.textMuted, marginTop: 6 }, children: sub } : null,
      ].filter(Boolean),
    },
  ].filter(Boolean),
});

export default {
  colors, spacing, radius, shadows, fonts,
  btn, card, input, badge, pageWrap, StatCard,
};

`

## === FILE: D:\Doan_5\frontend\src\utils\excelExport.js ===
`javascript
import ExcelJS from 'exceljs';

const HDR_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const HDR_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HDR_ALIGN = { vertical: 'middle', horizontal: 'center' };
const ROW_FILL_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
const ROW_FILL_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const CELL_FONT  = { size: 11, color: { argb: 'FF1F1F1F' } };
const BORDER_STYLE = { style: 'thin', color: { argb: 'FFAAAAAA' } };
const TABLE_BORDER = {
  top:    BORDER_STYLE,
  bottom: BORDER_STYLE,
  left:   BORDER_STYLE,
  right:  BORDER_STYLE,
};

function applyHeader(ws, colCount, title) {
  // Merge title row
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font  = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // Header row
  const hdrRow = ws.getRow(2);
  hdrRow.alignment = HDR_ALIGN;
  for (let c = 1; c <= colCount; c++) {
    const cell = hdrRow.getCell(c);
    cell.fill  = HDR_FILL;
    cell.font  = HDR_FONT;
    cell.border = TABLE_BORDER;
  }
}

function addSheet(wb, sheetName, title, headers, rows, colWidths) {
  const ws = wb.addWorksheet(sheetName);
  ws.properties.defaultRowHeight = 18;

  // Title & header rows
  applyHeader(ws, headers.length, title);

  // Column widths
  if (colWidths) colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  // Data rows
  rows.forEach((row, ri) => {
    const sheetRow = ws.addRow(row);
    sheetRow.alignment = { vertical: 'middle', wrapText: false };
    sheetRow.eachCell({ includeEmpty: true }, (cell) => {
      const even = ri % 2 === 0;
      cell.fill   = even ? ROW_FILL_EVEN : ROW_FILL_ODD;
      cell.font   = CELL_FONT;
      cell.border = TABLE_BORDER;
      // Bold if first col (label)
      if (cell._column._number === 1) cell.font = { ...CELL_FONT, bold: true };
    });
  });

  return ws;
}

function fmtVND(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v || 0));
}

export function exportInventoryReport(data) {
  const wb = new ExcelJS.Workbook();
  const items = Array.isArray(data) ? data : [];
  addSheet(wb, 'TonKho', 'BÁO CÁO TỒN KHO', ['SKU', 'Tên sản phẩm', 'Kho', 'Tồn', 'Đơn giá (VND)', 'Thành tiền (VND)'],
    items.map(it => [
      it.sku || '',
      it.product_name || '',
      it.warehouse_name || '',
      Number(it.on_hand_qty || 0),
      Number(it.sale_price || 0),
      Number((it.on_hand_qty || 0) * (it.sale_price || 0)),
    ]),
    [14, 28, 20, 10, 18, 20]
  );
  // Number formats
  const ws = wb.getWorksheet('TonKho');
  ws.getColumn(4).numFmt = '#,##0';
  ws.getColumn(5).numFmt = '#,##0 "đ"';
  ws.getColumn(6).numFmt = '#,##0 "đ"';
  download(wb, 'BaoCaoTonKho');
}

export function exportSalesReport(data) {
  const wb = new ExcelJS.Workbook();
  const tables = data?.tables || {};
  const summary = data?.summary || {};

  // Sheet 1: Summary
  addSheet(wb, 'TongQuan', 'BÁO CÁO DOANH THU - TỔNG QUAN',
    ['Chỉ tiêu', 'Giá trị'],
    [['Tổng đơn hàng', summary.total_orders || 0], ['Tổng doanh thu (VND)', summary.total_revenue || 0], ['Kỳ báo cáo', data?.period || '']],
    [30, 20]
  );
  const ws0 = wb.getWorksheet('TongQuan');
  ws0.getColumn(2).numFmt = '#,##0 "đ"';
  ws0.getRow(2).eachCell({ includeEmpty: true }, c => { c.font = { bold: true }; });

  // Sheet 2: Top Products
  const topProds = Array.isArray(tables.top_products) ? tables.top_products : [];
  addSheet(wb, 'SanPham', 'TOP SẢN PHẨM BÁN CHẠY',
    ['Tên sản phẩm', 'Số lượng bán', 'Doanh thu (VND)'],
    topProds.map(p => [p.name || '', Number(p.total_qty || 0), Number(p.total_revenue || 0)]),
    [30, 18, 22]
  );
  const ws1 = wb.getWorksheet('SanPham');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0 "đ"';

  // Sheet 3: Top Customers
  const topCusts = Array.isArray(tables.top_customers) ? tables.top_customers : [];
  addSheet(wb, 'KhachHang', 'TOP KHÁCH HÀNG',
    ['Khách hàng', 'Số đơn', 'Chi tiêu (VND)'],
    topCusts.map(c => [c.company_name || '', Number(c.order_count || 0), Number(c.total_spent || 0)]),
    [30, 12, 22]
  );
  const ws2 = wb.getWorksheet('KhachHang');
  ws2.getColumn(2).numFmt = '#,##0';
  ws2.getColumn(3).numFmt = '#,##0 "đ"';

  download(wb, 'BaoCaoDoanhThu');
}

export function exportLogisticsReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const delStats  = Array.isArray(t.delivery_stats)     ? t.delivery_stats : [];
  const retStats  = Array.isArray(t.return_stats)       ? t.return_stats : [];
  const compStats = Array.isArray(t.compensation_stats)  ? t.compensation_stats : [];
  const carrier   = Array.isArray(t.carrier_stats)      ? t.carrier_stats : [];

  addSheet(wb, 'GiaoHang', 'TRẠNG THÁI GIAO HÀNG',
    ['Trạng thái', 'Số lượng'],
    delStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('GiaoHang').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'DonViVanChuyen', 'ĐƠN VỊ VẬN CHUYỂN',
    ['Đơn vị', 'Số chuyến', 'Đã giao', 'Tỷ lệ thành công (%)'],
    carrier.map(c => [c.carrier_code || '', Number(c.shipments || 0), Number(c.delivered || 0), c.success_rate || 0]),
    [20, 14, 14, 20]
  );
  const ws1 = wb.getWorksheet('DonViVanChuyen');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0';
  ws1.getColumn(4).numFmt = '0.0"%"';

  addSheet(wb, 'PhieuBu', 'PHIẾU BÙ THEO LOẠI LỖI',
    ['Loại lỗi', 'Số phiếu', 'Số SP', 'Trạng thái'],
    compStats.map(c => [c.defect_type || '', Number(c.count || 0), Number(c.total_items || 0), c.status || '']),
    [22, 12, 12, 18]
  );
  wb.getWorksheet('PhieuBu').getColumn(2).numFmt = '#,##0';

  download(wb, 'BaoCaoVanChuyen');
}

export function exportWarehouseReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const recStats  = Array.isArray(t.receipt_stats)      ? t.receipt_stats : [];
  const outStats   = Array.isArray(t.outbound_stats)    ? t.outbound_stats : [];
  const whSummary  = Array.isArray(t.warehouse_summary) ? t.warehouse_summary : [];
  const prodMove   = Array.isArray(t.product_movement)   ? t.product_movement : [];

  addSheet(wb, 'PhieuNhap', 'TRẠNG THÁI PHIẾU NHẬP KHO',
    ['Trạng thái', 'Số phiếu'],
    recStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuNhap').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'PhieuXuat', 'TRẠNG THÁI PHIẾU XUẤT KHO',
    ['Trạng thái', 'Số phiếu'],
    outStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuXuat').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'TongHopKho', 'TỔNG HỢP THEO KHO',
    ['Kho', 'Loại SP', 'Tổng tồn (SP)', 'Phiếu nhập', 'Phiếu xuất'],
    whSummary.map(w => [w.name || '', Number(w.product_types || 0), Number(w.total_qty || 0), Number(w.receipt_count || 0), Number(w.outbound_count || 0)]),
    [25, 12, 18, 15, 15]
  );
  const ws2 = wb.getWorksheet('TongHopKho');
  ws2.getColumn(3).numFmt = '#,##0';
  ws2.getColumn(4).numFmt = '#,##0';
  ws2.getColumn(5).numFmt = '#,##0';

  addSheet(wb, 'BienDong', 'BIẾN ĐỘNG HÀNG HÓA',
    ['Sản phẩm', 'Nhập (SP)', 'Xuất (SP)', 'Tồn hiện tại'],
    prodMove.map(p => [p.name || '', Number(p.total_in || 0), Number(p.total_out || 0), Number(p.current_stock || 0)]),
    [28, 15, 15, 18]
  );
  const ws3 = wb.getWorksheet('BienDong');
  ws3.getColumn(2).numFmt = '#,##0';
  ws3.getColumn(3).numFmt = '#,##0';
  ws3.getColumn(4).numFmt = '#,##0';

  download(wb, 'BaoCaoKho');
}

export function exportFactoryReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const recStats  = Array.isArray(t.receipt_stats)          ? t.receipt_stats : [];
  const compStats  = Array.isArray(t.compensation_stats)      ? t.compensation_stats : [];
  const pendingRec  = Array.isArray(t.pending_receipts)       ? t.pending_receipts : [];
  const pendingComp = Array.isArray(t.pending_compensations)  ? t.pending_compensations : [];

  addSheet(wb, 'PhieuNhap', 'TRẠNG THÁI PHIẾU NHẬP',
    ['Trạng thái', 'Số phiếu'],
    recStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuNhap').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'PhieuBu', 'TRẠNG THÁI PHIẾU BÙ',
    ['Loại lỗi', 'Trạng thái', 'Số phiếu', 'Số SP'],
    compStats.map(c => [c.defect_type || '', c.status || '', Number(c.count || 0), Number(c.total_items || 0)]),
    [22, 18, 12, 12]
  );
  const ws1 = wb.getWorksheet('PhieuBu');
  ws1.getColumn(3).numFmt = '#,##0';
  ws1.getColumn(4).numFmt = '#,##0';

  addSheet(wb, 'PhieuNhapCho', 'PHIẾU NHẬP CHỜ DUYỆT',
    ['Số phiếu', 'Kho', 'Số SP', 'Ghi chú'],
    pendingRec.map(r => [r.receipt_no || '', r.warehouse_name || '', Number(r.item_count || 0), r.note || '']),
    [20, 22, 12, 30]
  );
  wb.getWorksheet('PhieuNhapCho').getColumn(3).numFmt = '#,##0';

  addSheet(wb, 'PhieuBuCho', 'PHIẾU BÙ CHỜ XỬ LÝ',
    ['Số phiếu', 'Mã đơn', 'Khách hàng', 'Loại lỗi'],
    pendingComp.map(c => [c.compensation_no || '', c.order_no || '', c.customer_name || '', c.defect_type || '']),
    [20, 16, 22, 18]
  );

  download(wb, 'BaoCaoNhaMay');
}

export function exportAdminDashboard(data) {
  const wb = new ExcelJS.Workbook();
  const s         = data?.summary || {};
  const whUtil    = Array.isArray(data?.tables?.warehouse_utilization) ? data.tables.warehouse_utilization : [];
  const recentOrd = Array.isArray(data?.tables?.recent_orders)        ? data.tables.recent_orders        : [];
  const topProds  = Array.isArray(data?.tables?.top_products)         ? data.tables.top_products         : [];
  const revData   = (data?.charts?.revenue_by_day || []).map(r => ({ ...r, name: r.date || r.period }));

  // Sheet 1: KPIs
  addSheet(wb, 'KPI', 'DASHBOARD TỔNG QUAN - KPIs',
    ['Chỉ tiêu', 'Giá trị'],
    [
      ['Tổng doanh thu (VND)',     s.total_revenue || 0],
      ['Đơn hoàn thành',           `${s.completed_orders || 0} / ${s.total_orders || 0}`],
      ['Đơn đang chờ',             s.pending_orders || 0],
      ['Tồn kho thấp',             s.low_stock_count || 0],
      ['Phiếu nhập kho',           s.total_receipts || 0],
      ['Phiếu xuất kho',           s.total_outbounds || 0],
      ['Yêu cầu hoàn',             s.return_pending || 0],
      ['Người dùng',               s.total_users || 0],
    ],
    [28, 22]
  );
  wb.getWorksheet('KPI').getColumn(2).numFmt = '#,##0 "đ"';

  // Sheet 2: Doanh thu theo ngày
  addSheet(wb, 'DoanhThu', 'DOANH THU THEO NGÀY',
    ['Ngày', 'Doanh thu (VND)'],
    revData.map(r => [r.name, Number(r.revenue || 0)]),
    [20, 22]
  );
  wb.getWorksheet('DoanhThu').getColumn(2).numFmt = '#,##0 "đ"';

  // Sheet 3: Phân bổ tồn kho
  addSheet(wb, 'PhanBoTonKho', 'PHÂN BỔ TỒN KHO THEO KHO',
    ['Kho', 'SKU', 'Tổng tồn (SP)'],
    whUtil.map(w => [w.name || '', Number(w.product_count || 0), Number(w.total_qty || 0)]),
    [28, 12, 18]
  );
  const ws1 = wb.getWorksheet('PhanBoTonKho');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0';

  // Sheet 4: Đơn hàng gần nhất
  addSheet(wb, 'DonHang', 'ĐƠN HÀNG GẦN NHẤT',
    ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Ngày tạo'],
    recentOrd.map(o => [
      o.order_no || '',
      o.customer_name || '—',
      o.status || '',
      o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '',
    ]),
    [18, 24, 16, 14]
  );

  // Sheet 5: Top sản phẩm bán chạy
  addSheet(wb, 'SanPham', 'TOP SẢN PHẨM BÁN CHẠY',
    ['Sản phẩm', 'SKU', 'Số lượng', 'Doanh thu (VND)'],
    topProds.map(p => [p.name || '', p.sku || '', Number(p.total_qty || 0), Number(p.total_revenue || 0)]),
    [28, 14, 12, 22]
  );
  const ws3 = wb.getWorksheet('SanPham');
  ws3.getColumn(3).numFmt = '#,##0';
  ws3.getColumn(4).numFmt = '#,##0 "đ"';

  download(wb, 'DashboardTongQuan');
}

function download(wb, filename) {
  wb.xlsx.writeBuffer().then(buf => {
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

`

## === FILE: D:\Doan_5\frontend\src\utils\exportList.js ===
`javascript
/**
 * Helper export danh sach ra Excel (.xlsx) su dung exceljs.
 * Dung cho cac trang list: Sales, Products, Customers, Receipts, Outbounds, Returns, Logistics.
 */
import ExcelJS from 'exceljs';

const HDR_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const HDR_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HDR_ALIGN = { vertical: 'middle', horizontal: 'center' };
const ROW_FILL_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
const ROW_FILL_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const CELL_FONT  = { size: 11, color: { argb: 'FF1F1F1F' } };
const BORDER_STYLE = { style: 'thin', color: { argb: 'FFAAAAAA' } };
const TABLE_BORDER = { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE };

function applyHeader(ws, colCount, title) {
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font  = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;
  const hdrRow = ws.getRow(2);
  hdrRow.alignment = HDR_ALIGN;
  for (let c = 1; c <= colCount; c++) {
    const cell = hdrRow.getCell(c);
    cell.fill  = HDR_FILL;
    cell.font  = HDR_FONT;
    cell.border = TABLE_BORDER;
  }
}

/**
 * Export 1 sheet tu mang rows.
 * @param {string} filename - Ten file (khong can .xlsx)
 * @param {string} sheetName
 * @param {string} title
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 * @param {number[]} colWidths - chieu rong tung cot
 * @param {object[]} [numberCols] - [{ col: 1-based index, format: '#,##0' | '#,##0 "đ"' | '0.0"%"' }]
 */
export async function exportListToExcel({
  filename, sheetName = 'Sheet1', title, headers, rows, colWidths = [], numberCols = [],
}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.properties.defaultRowHeight = 18;
  applyHeader(ws, headers.length, title);
  colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  rows.forEach((row, ri) => {
    const sheetRow = ws.addRow(row);
    sheetRow.alignment = { vertical: 'middle', wrapText: false };
    sheetRow.eachCell({ includeEmpty: true }, (cell) => {
      const even = ri % 2 === 0;
      cell.fill   = even ? ROW_FILL_EVEN : ROW_FILL_ODD;
      cell.font   = CELL_FONT;
      cell.border = TABLE_BORDER;
      if (cell._column._number === 1) cell.font = { ...CELL_FONT, bold: true };
    });
  });

  // Apply number formats
  numberCols.forEach(({ col, format }) => {
    ws.getColumn(col).numFmt = format;
  });

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 2 }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

`

## === FILE: D:\Doan_5\frontend\src\utils\orderItems.js ===
`javascript
export function normalizeOrderItems(order) {
  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.products)
      ? order.products
      : Array.isArray(order?.order_items)
        ? order.order_items
        : [];

  return items.map((item, index) => ({
    id: item.id ?? `${order?.id ?? 'order'}-${item.product_id ?? index}`,
    product_id: item.product_id ?? item.id ?? item.product?.id,
    product_name:
      item.product_name ??
      item.name ??
      item.product?.name ??
      item.product?.product_name ??
      item.product_title ??
      item.productName ??
      item.product?.title ??
      item.product?.product_title ??
      item.product?.productName ??
      'Sản phẩm không tên',
    product_sku: item.product_sku ?? item.sku ?? item.product?.sku ?? item.product?.product_sku ?? '',
    quantity: Number(item.quantity ?? item.qty ?? item.product_quantity ?? 0),
  }));
}

export function formatOrderItems(order) {
  const items = normalizeOrderItems(order);
  if (!items.length) return 'Chưa có sản phẩm';

  return items
    .map((item) => `${item.product_name}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`)
    .join(', ');
}

`

## === FILE: D:\Doan_5\frontend\src\App.jsx ===
`jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
import CustomersPage from './pages/CustomersPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import LogisticsPage from './pages/LogisticsPage';
import OutboundsPage from './pages/OutboundsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import AccountsPage from './pages/AccountsPage';
import ReportsPage from './pages/ReportsPage';
import MyDashboardPage from './pages/MyDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WarehouseDashboardPage from './pages/WarehouseDashboardPage';
import LogisticsDashboardPage from './pages/LogisticsDashboardPage';
import FactoryDashboardPage from './pages/FactoryDashboardPage';
import ReturnsPage from './pages/ReturnsPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const HomeRedirect = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  const roleId = user.role_id;

  switch (roleId) {
    case 1: return <AdminDashboardPage />;                  // Admin
    case 2: return <MyDashboardPage />;                     // Sales
    case 3: return <LogisticsDashboardPage />;              // Logistics
    case 4: return <WarehouseDashboardPage />;              // Warehouse
    case 5: return <FactoryDashboardPage />;                // Factory
    default: return <div style={{ padding: '20px' }}>Chào mừng bạn đến với hệ thống!</div>;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Home redirect theo role */}
          <Route index element={<HomeRedirect />} />

          {/* Dashboards */}
          <Route path="sales-dashboard"    element={<MyDashboardPage />} />
          <Route path="admin-dashboard"     element={<AdminDashboardPage />} />
          <Route path="warehouse-dashboard" element={<WarehouseDashboardPage />} />
          <Route path="factory-dashboard"   element={<FactoryDashboardPage />} />

          {/* Danh mục */}
          <Route path="products"   element={<WarehousesPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="accounts"   element={<AccountsPage />} />

          {/* Nghiệp vụ */}
          <Route path="receipts"   element={<ReceiptsPage />} />
          <Route path="outbounds"  element={<OutboundsPage />} />
          <Route path="logistics"  element={<LogisticsPage />} />
          <Route path="returns"    element={<ReturnsPage />} />

          {/* Đơn hàng */}
          <Route path="sales-orders" element={<SalesOrdersPage />} />

          {/* Báo cáo */}
          <Route path="reports"    element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

`

## === FILE: D:\Doan_5\frontend\src\main.jsx ===
`jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

`


# 9. FRONTEND - Config files

## === FILE: D:\Doan_5\frontend\vite.config.js ===
`javascript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5000/api'),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:10000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

`


