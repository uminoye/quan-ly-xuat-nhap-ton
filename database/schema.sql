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