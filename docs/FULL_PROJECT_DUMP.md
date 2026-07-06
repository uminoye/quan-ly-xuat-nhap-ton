# HE THONG QUAN LY XUAT NHAP TON — FULL SOURCE CODE
# Do An Tot Nghiep — Backend API (Node.js/Express) + Frontend (React/Vite)

---

## PART 1: DATABASE SCHEMA

### File: database/schema_neon.sql

```sql
-- ============================================================
-- SCHEMA POSTGRESQL CHO NEON (Tuong thich Render Deploy)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    category VARCHAR(100),
    image_url TEXT,
    min_stock INTEGER DEFAULT 50,
    sale_price DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_receipts (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id),
    receipt_date TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    note TEXT,
    responded_by VARCHAR(100),
    responded_reason TEXT,
    expected_delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES production_receipts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    order_date TIMESTAMP NOT NULL,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft',
    delivery_step INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2)
);

CREATE TABLE IF NOT EXISTS delivery_requests (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_orders(id),
    handled_by INTEGER REFERENCES users(id),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'received',
    logistics_note TEXT,
    warehouse_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_outbound_notes (
    id SERIAL PRIMARY KEY,
    outbound_no VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES sales_orders(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    export_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_outbound_note_items (
    id SERIAL PRIMARY KEY,
    outbound_note_id INTEGER REFERENCES stock_outbound_notes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_balances (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id),
    product_id INTEGER REFERENCES products(id),
    on_hand_qty INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id),
    product_id INTEGER REFERENCES products(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

CREATE TABLE IF NOT EXISTS auto_codes (
    code VARCHAR(50) PRIMARY KEY,
    prefix VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_orders (
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
);

CREATE TABLE IF NOT EXISTS return_requests (
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
);

CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER REFERENCES return_requests(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    is_defective BOOLEAN DEFAULT true,
    handled_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compensation_requests (
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
);

CREATE TABLE IF NOT EXISTS compensation_items (
    id SERIAL PRIMARY KEY,
    compensation_id INTEGER REFERENCES compensation_requests(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    defective_qty INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS supplier_claims (
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
);

CREATE TABLE IF NOT EXISTS carrier_claims (
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
);

CREATE TABLE IF NOT EXISTS notifications (
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
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_codes_prefix_year ON auto_codes(prefix, year);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_warehouse ON inventory_balances(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_product ON inventory_balances(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_order ON delivery_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_order ON shipping_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_compensation_requests_return ON compensation_requests(return_id);
CREATE INDEX IF NOT EXISTS idx_compensation_requests_status ON compensation_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_supplier_claims_return ON supplier_claims(return_id);
CREATE INDEX IF NOT EXISTS idx_supplier_claims_status ON supplier_claims(status);
CREATE INDEX IF NOT EXISTS idx_carrier_claims_return ON carrier_claims(return_id);
CREATE INDEX IF NOT EXISTS idx_carrier_claims_status ON carrier_claims(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(recipient_user_id, is_read);
```

---

## PART 2: BACKEND — SERVER & CONFIG

### File: backend/src/server.js

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

// CORS cho Vercel Frontend
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

// REQUEST LOGGING
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ROUTES
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

// TEST ENDPOINT
app.get('/api/test', (_req, res) => {
    res.json({
        message: 'Server Backend da hoat dong tren Render!',
        database: 'Ket noi Neon PostgreSQL thanh cong.',
        timestamp: new Date().toISOString(),
    });
});

// REGISTER ROUTES
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

// ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('LOI HE THONG:', err.stack);
    res.status(500).json({ message: 'Da co loi xay ra tren server!', error: err.message });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chay tai: http://localhost:${PORT}`);
    console.log(`API Test: http://localhost:${PORT}/api/test`);
});
```

### File: backend/src/utils/autoCode.js

```javascript
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
```

---

## PART 3: BACKEND — ROUTES

### File: backend/src/routes/auth.routes.js

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.get('/users', authController.getAllUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;
```

### File: backend/src/routes/order.routes.js

```javascript
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

module.exports = router;
```

### File: backend/src/routes/product.routes.js

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, productController.getAllProducts);
router.get('/next-code', verifyToken, productController.getNextSku);
router.post('/', verifyToken, productController.createProduct);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
```

### File: backend/src/routes/customer.routes.js

```javascript
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/next-code', customerController.getNextCustomerCode);  // No auth required for code preview
router.get('/', verifyToken, customerController.getAllCustomers);
router.post('/', verifyToken, customerController.createCustomer);
router.delete('/:id', verifyToken, customerController.deleteCustomer);

module.exports = router;
```

### File: backend/src/routes/receipt.routes.js

```javascript
const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', receiptController.getAllReceipts);
router.post('/', verifyToken, receiptController.createRequest);
router.put('/:id/respond', receiptController.factoryRespond);
router.put('/:id/confirm', receiptController.confirmReceipt);

module.exports = router;
```

### File: backend/src/routes/logistics.routes.js

```javascript
const express = require('express');
const router = express.Router();
const logisticsCtrl = require('../controllers/logistics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/process',          verifyToken, logisticsCtrl.processOrder);
router.post('/dispatch',         verifyToken, logisticsCtrl.dispatchOrder);
router.post('/reject',          verifyToken, logisticsCtrl.rejectOrder);
router.post('/simulate',        verifyToken, logisticsCtrl.triggerDeliverySimulation);
router.post('/simulate-all',    verifyToken, logisticsCtrl.simulateAllShipping);
router.post('/customer-rejection', verifyToken, logisticsCtrl.processCustomerRejection);
router.post('/process-completed',  verifyToken, logisticsCtrl.processCompletedOrder);
router.get('/shipping',         verifyToken, logisticsCtrl.getShippingOrders);
router.get('/returns',         verifyToken, logisticsCtrl.getReturnRequests);

module.exports = router;
```

### File: backend/src/routes/outbound.routes.js

```javascript
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
```

### File: backend/src/routes/return.routes.js

```javascript
const express = require('express');
const router = express.Router();
const returnCtrl = require('../controllers/return.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/',                       verifyToken, returnCtrl.getAllReturns);
router.get('/compensations',          verifyToken, returnCtrl.getCompensations);
router.get('/:order_id',             verifyToken, returnCtrl.getReturnByOrder);
router.post('/process',              verifyToken, returnCtrl.processReturn);
router.put('/compensations/:id',     verifyToken, returnCtrl.processCompensation);
router.get('/notifications',          verifyToken, returnCtrl.getNotifications);
router.put('/notifications/:id/read',  verifyToken, returnCtrl.markNotificationRead);
router.put('/notifications/read-all',  verifyToken, returnCtrl.markAllNotificationsRead);

// Legacy endpoints
router.post('/init',     verifyToken, returnCtrl.processReturnInit);
router.post('/complete', verifyToken, returnCtrl.processReturnComplete);

module.exports = router;
```

### File: backend/src/routes/report.routes.js

```javascript
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Dashboard theo role
router.get('/dashboard', verifyToken, reportController.getRoleReport);

// Báo cáo chi tiết
router.get('/sales',        verifyToken, reportController.getSalesReport);
router.get('/logistics',    verifyToken, reportController.getLogisticsReport);
router.get('/warehouse',    verifyToken, reportController.getWarehouseReport);
router.get('/factory',      verifyToken, reportController.getFactoryReport);
router.get('/inventory',    verifyToken, reportController.getInventoryReport);

module.exports = router;
```

### File: backend/src/routes/warehouse.routes.js

```javascript
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
```

---

## PART 4: BACKEND — CONTROLLERS

### File: backend/src/controllers/auth.controller.js

```javascript
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
```

### File: backend/src/controllers/order.controller.js

```javascript
const db = require('../config/database');

// GET NEXT ORDER NO — sinh mã SO-YYYY-NNNN trong transaction với FOR UPDATE lock
const getNextOrderNo = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;

        const maxRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1 FOR UPDATE`,
            [pattern]
        );

        let nextNum = 1;
        if (maxRes.rows[0]?.order_no) {
            const lastNum = parseInt(maxRes.rows[0].order_no.split('-').pop(), 10);
            nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
        }
        const order_no = `SO-${year}-${String(nextNum).padStart(4, '0')}`;

        await client.query('COMMIT');
        res.status(200).json({ order_no });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi sinh ma don', error: err.message });
    } finally {
        client.release();
    }
};

// GET ALL ORDERS — trả về đơn kèm items (Map deduplicate)
const getAllOrders = async (req, res) => {
    try {
        const query = `
            SELECT
                o.id, o.order_no, o.customer_id, c.company_name as customer_name,
                o.order_date, o.expected_delivery_date, o.actual_delivery_date,
                o.created_by, o.status, o.delivery_step, o.note,
                o.created_at, o.updated_at,
                (SELECT dr.warehouse_note FROM delivery_requests dr WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1) AS warehouse_note,
                (SELECT dr.logistics_note FROM delivery_requests dr WHERE dr.order_id = o.id ORDER BY dr.id DESC LIMIT 1) AS logistics_note,
                oi.id as item_id, oi.product_id, oi.quantity, oi.unit_price,
                p.name as product_name, p.sku as product_sku
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
                    id: row.id, order_no: row.order_no, customer_id: row.customer_id,
                    customer_name: row.customer_name, order_date: row.order_date,
                    expected_delivery_date: row.expected_delivery_date,
                    actual_delivery_date: row.actual_delivery_date,
                    created_by: row.created_by, status: row.status,
                    delivery_step: row.delivery_step, note: row.note,
                    warehouse_note: row.warehouse_note, logistics_note: row.logistics_note,
                    created_at: row.created_at, updated_at: row.updated_at,
                    items: [],
                });
            }
            if (row.item_id) {
                ordersMap.get(row.id).items.push({
                    id: row.item_id, product_id: row.product_id,
                    product_name: row.product_name, product_sku: row.product_sku,
                    quantity: row.quantity, unit_price: row.unit_price,
                });
            }
        });
        res.status(200).json(Array.from(ordersMap.values()));
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

// CREATE ORDER — sinh mã trong transaction, insert đơn + items
const createOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { customer_id, order_date, expected_delivery_date, note, items } = req.body;
        if (!customer_id) return res.status(400).json({ message: 'Vui long chon khach hang!' });
        if (!order_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });

        await client.query('BEGIN');

        const year = new Date().getFullYear();
        const pattern = `SO-${year}-%`;
        const maxRes = await client.query(
            `SELECT order_no FROM sales_orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1 FOR UPDATE`,
            [pattern]
        );

        let nextNum = 1;
        if (maxRes.rows[0]?.order_no) {
            const lastNum = parseInt(maxRes.rows[0].order_no.split('-').pop(), 10);
            nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
        }
        const order_no = `SO-${year}-${String(nextNum).padStart(4, '0')}`;

        const result = await client.query(
            `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [order_no, customer_id, order_date, expected_delivery_date, note]
        );
        const orderId = result.rows[0].id;

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

// UPDATE ORDER
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

// DELETE ORDER — chỉ xóa được đơn ở trạng thái pending/returned
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
        await client.query(`DELETE FROM stock_outbound_notes WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM delivery_requests WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM shipping_orders WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_order_items WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM sales_orders WHERE id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da xoa don hang thanh cong' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi khi xoa: ' + err.message });
    } finally {
        client.release();
    }
};

// LOGISTICS xu ly đơn
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

// Kho bao loi
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

// Export / xuat kho
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

// Xac nhan giao hang
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

// Hoan tra ton kho
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

// Khach tu choi nhan hang
const processCustomerRejection = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { action, note } = req.body;
        await client.query('BEGIN');

        const outbound = await client.query(
            `SELECT warehouse_id FROM stock_outbound_notes WHERE order_id = $1 ORDER BY id DESC LIMIT 1`,
            [orderId]
        );

        if (action === 'return_to_warehouse') {
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

// Gui don ve Sales
const returnToSales = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const orderId = req.params.id;
        const { note } = req.body;

        await client.query('BEGIN');

        const rrRes = await client.query(`SELECT id FROM return_requests WHERE order_id = $1`, [orderId]);
        if (rrRes.rows.length) {
            await client.query(`
                UPDATE return_requests SET status = 'return_to_sales',
                customer_reject_reason = 'khong_nhan_hang', complaint_source = 'during_delivery',
                logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE order_id = $2
            `, [note || null, orderId]);
        }

        await client.query(`
            UPDATE sales_orders SET status = 'return_to_sales', note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
        `, [`[Logistics] Khach khong nhan hang: ${note || ''}`, orderId]);

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
```

### File: backend/src/controllers/product.controller.js

```javascript
const db = require('../config/database');

// GET ALL PRODUCTS — kèm tồn kho và trạng thái
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
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi Database', error: err.message });
    }
};

// CREATE PRODUCT — sinh SKU trong transaction, retry nếu trùng (max 5 lần)
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

            // Sinh SKU trong transaction với FOR UPDATE lock
            const prefix = 'SP';
            const year = new Date().getFullYear();
            const pattern = `${prefix}-${year}-%`;
            const lockRes = await client.query(
                `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
                [pattern]
            );
            let nextNum = 1;
            if (lockRes.rows[0]?.code) {
                const lastNum = parseInt(lockRes.rows[0].code.split('-').pop(), 10);
                nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
            }
            const sku = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
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

            // Retry on duplicate SKU
            if (err.code === '23505' && attempt < MAX_RETRIES) {
                console.warn(`[createProduct] SKU trung, retry lan ${attempt + 1}`);
                await new Promise(r => setTimeout(r, 50 * attempt));
                continue;
            }

            if (err.code === '23505') {
                return res.status(400).json({ message: 'Ma SKU da ton tai! Vui long thu lai.' });
            }
            return res.status(500).json({ message: 'Loi Database', error: err.message });
        }
    }
};

// UPDATE PRODUCT
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

// DELETE PRODUCT — không xóa được nếu còn tồn kho
const deleteProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;

        const stockResult = await client.query(
            `SELECT COALESCE(SUM(on_hand_qty), 0)::int AS total_stock FROM inventory_balances WHERE product_id = $1`,
            [id]
        );
        const totalStock = Number(stockResult.rows[0]?.total_stock || 0);

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

// GET NEXT SKU
const getNextSku = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const prefix = 'SP';
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
        const sku = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

        // Reserve immediately so next call won't return the same SKU
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
            [sku, prefix, year]
        );
        await client.query('COMMIT');

        res.status(200).json({ sku });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ message: 'Loi sinh SKU', error: err.message });
    } finally {
        client.release();
    }
};

module.exports = { getAllProducts, getNextSku, createProduct, updateProduct, deleteProduct };
```

### File: backend/src/controllers/customer.controller.js

```javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// GET ALL CUSTOMERS
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

// GET NEXT CUSTOMER CODE
const getNextCustomerCode = async (req, res) => {
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
        res.status(500).json({ message: 'Loi sinh ma tiep theo', error: err.message });
    } finally {
        client.release();
    }
};

// CREATE CUSTOMER — sinh mã KH-YYYY-NNNN trong transaction
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
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Ma khach hang da ton tai. Vui long thu lai.' });
        }
        res.status(500).json({ message: 'Loi tao khach hang', error: err.message });
    }
};

// DELETE CUSTOMER
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
```

### File: backend/src/controllers/receipt.controller.js

```javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// GET ALL RECEIPTS
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

// CREATE REQUEST — yeu cau nhap kho (pending -> cho nha may duyet)
const createRequest = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { warehouse_id, receipt_date, note, items } = req.body;
        const created_by = req.user?.id || 1;
        if (!warehouse_id) return res.status(400).json({ message: 'Vui long chon kho nhap!' });
        if (!receipt_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });

        await client.query('BEGIN');
        const receipt_no = await generateCode('receipt', client);
        await client.query(
            `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [receipt_no, warehouse_id, receipt_date, created_by, note || '']
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
        if (err.code === '23505') return res.status(400).json({ message: 'Ma phieu da ton tai, vui long dung ma khac!' });
        if (err.code === '23503') return res.status(400).json({ message: 'Kho hoac san pham khong ton tai trong he thong!' });
        res.status(400).json({ message: 'Loi tao phieu: ' + err.message });
    } finally {
        client.release();
    }
};

// FACTORY RESPOND — nha may chap nhan hoac tu choi
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

// CONFIRM RECEIPT — kho xac nhan nhan hang, cong ton kho
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
```

### File: backend/src/controllers/logistics.controller.js

```javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

const CARRIERS = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
  { code: 'GR',  name: 'Giao Hàng Tiết Kiệm (GR)' },
  { code: 'GHT', name: 'Giao Hàng Tiêu Chuẩn (GHT)' },
];

// PROCESS ORDER
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

// DISPATCH ORDER — chọn ĐVVC, sinh mã vận đơn, chuyển sang warehouse_processing
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

      const CARRIER_PREFIX = { GHN: 'GHN', GR: 'GR', GHT: 'GHT', VTP: 'VTP' };
      const carrierPrefix = CARRIER_PREFIX[carrier.code] || 'GHN';
      const trackingNo = await generateCode(carrierPrefix, client);

      const shResult = await client.query(
        `INSERT INTO shipping_orders (order_id, carrier_code, carrier_name, tracking_no, shipping_fee)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [order_id, carrier.code, carrier.name, trackingNo, shipping_fee || 0]
      );
      const shipping_order_id = shResult.rows[0].id;

      await client.query(
        `UPDATE sales_orders SET status = 'warehouse_processing', delivery_step = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );

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

      // Retry on duplicate tracking_no
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

// REJECT ORDER
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

// ADVANCE DELIVERY STEP — ham noi bo, tang delivery_step hoac hoan thanh
async function advanceDeliveryStep(client, order_id, forceFail = false, forceSuccess = false) {
  const stepRes = await client.query(
    `SELECT delivery_step FROM sales_orders WHERE id = $1`,
    [order_id]
  );
  const currentStep = Number(stepRes.rows[0]?.delivery_step || 1);
  const nextStep = currentStep + 1;

  if (nextStep <= 3) {
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

  let customerRejects = false;
  let rejectReason = null;

  if (forceFail) {
    customerRejects = true;
    rejectReason = 'khong_nhan_hang';
  } else if (forceSuccess) {
    customerRejects = false;
  } else {
    // Random: 5% khách từ chối
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

// TRIGGER DELIVERY SIMULATION — cho 1 don
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
    res.status(500).json({ message: 'Loi giao hang', error: err.message });
  } finally {
    client.release();
  }
};

// SIMULATE ALL SHIPPING — cho tat ca don shipping
const simulateAllShipping = async (req, res) => {
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
    res.status(500).json({ message: 'Loi auto-simulate', error: err.message });
  } finally {
    client.release();
  }
};

// PROCESS CUSTOMER REJECTION — gui don ve Sales
const processCustomerRejection = async (req, res) => {
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

// GET SHIPPING ORDERS
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

// GET RETURN REQUESTS
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

// PROCESS COMPLETED ORDER — xu ly don da giao thanh cong
const processCompletedOrder = async (req, res) => {
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
      await client.query(
        `UPDATE sales_orders SET note = COALESCE(note || E'\n', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [`[Logistics] Xac nhan giao thanh cong: ${note || ''}`, order_id]
      );
    } else {
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
  processOrder, dispatchOrder, rejectOrder,
  triggerDeliverySimulation, simulateAllShipping,
  processCustomerRejection, processCompletedOrder,
  getShippingOrders, getReturnRequests, CARRIERS,
};
```

### File: backend/src/controllers/outbound.controller.js

```javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// GET ALL OUTBOUNDS
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

// GET PENDING OUTBOUND REQUESTS
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
                    FROM sales_order_items soi2 JOIN products p2 ON p2.id = soi2.product_id
                    WHERE soi2.order_id = s.id
                ) AS items,
                (SELECT d.status FROM delivery_requests d WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1) AS delivery_status,
                (SELECT d.logistics_note FROM delivery_requests d WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1) AS delivery_note,
                (SELECT son.warehouse_id FROM stock_outbound_notes son WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1) AS warehouse_id,
                (SELECT w.name FROM stock_outbound_notes son JOIN warehouses w ON w.id = son.warehouse_id WHERE son.order_id = s.id ORDER BY son.id DESC LIMIT 1) AS warehouse_name
            FROM sales_orders s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sales_order_items soi ON s.id = soi.order_id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE s.status IN ('warehouse_processing', 'shipping', 'completed', 'returned', 'canceled', 'waiting_sales', 'customer_rejected', 'return_pending')
                OR EXISTS (SELECT 1 FROM delivery_requests d WHERE d.order_id = s.id AND COALESCE(d.status, '') IN ('warehouse_processing', 'shipping', 'completed', 'waiting_sales', 'customer_rejected', 'return_pending'))
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

// CREATE OUTBOUND FROM PENDING — xuat kho, tru ton, tao phieu xuat
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

        // Kiem tra ton kho
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

// RESPOND OUTBOUND — kho phan hoi xuat/huy
const respondOutbound = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id } = req.params;
        const { action, reason, warehouse_action } = req.body;
        const userId = req.user?.id || null;

        if (action === 'reject') {
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
            res.status(200).json({ message: 'Da tiep nhan don hang.' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cap nhat phan hoi' });
    } finally {
        client.release();
    }
};

// GET WAREHOUSE STOCK
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
    getAllOutbounds, getPendingOutboundRequests, createOutboundFromPending,
    respondOutbound, getWarehouseStock
};
```

### File: backend/src/controllers/return.controller.js

```javascript
const db = require('../config/database');
const { generateCode } = require('../utils/autoCode');

// Ham noi bo: cong ton kho
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

// GET ALL RETURNS
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
                so.order_no, so.expected_delivery_date, so.actual_delivery_date, so.status AS order_status,
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
        res.status(200).json([]);
    }
};

// GET RETURN BY ORDER
const getReturnByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const rr = await db.getOne(`
            SELECT
                rr.*, so.order_no, c.company_name AS customer_name,
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

// GET COMPENSATIONS
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
        res.status(200).json([]);
    }
};

// PROCESS RETURN — xu ly hoan hang 1 buoc (ket hop init + complete)
const processReturn = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { order_id, logistics_action } = req.body;
        const userId = req.user?.id || null;

        if (!order_id) {
            return res.status(400).json({ message: 'Thieu order_id' });
        }

        await client.query('BEGIN');

        // Lay thong tin don hang
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

        // Lay return_request
        const rrRes = await client.query(`SELECT * FROM return_requests WHERE order_id = $1`, [order_id]);
        let rr = rrRes.rows[0];
        if (!rr) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Khong tim thay yeu cau tra hang cho don nay' });
        }
        const finalAction = logistics_action || rr?.logistics_action || 'khong_nhan_hang';

        // Lay items
        const itemsRes = await client.query(`
            SELECT soi.product_id, soi.quantity, p.name, p.sku, COALESCE(soi.unit_price, p.sale_price, 0) AS unit_price
            FROM sales_order_items soi
            JOIN products p ON p.id = soi.product_id
            WHERE soi.order_id = $1
        `, [order_id]);
        const items = itemsRes.rows;

        // Sinh ma phieu nhap
        const receiptNo = await generateCode('PNH', client);

        const result = {
            order_id, order_no: order.order_no,
            logistics_action: finalAction,
            items_restocked: 0, items_to_defective: 0,
            claim_no: null, receipt_no: receiptNo,
            destination: null,
        };

        // === 1. KHONG NHAN HANG → cong ton kho goc + huy don
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

            await client.query(`UPDATE sales_orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);
            await client.query(`UPDATE return_requests SET status = 'return_completed', handling_result = 'khong_nhan_hang', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [rr.id]);

            result.items_restocked = items.length;
            result.destination = 'kho_goc';

        // === 2. LOI DO NHA MAY → kho loi + tao phieu bu nha may
        } else if (finalAction === 'loi_nha_may') {
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

            await client.query(`UPDATE sales_orders SET status = 'return_completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);

            result.items_to_defective = 0;
            result.claim_no = compensationNo;
            result.destination = 'doi_duyet';

            // Gui notification cho Factory
            await client.query(`
                INSERT INTO notifications (recipient_role, title, message, type, reference_type, reference_id)
                VALUES ('Factory', $1, $2, 'error', 'compensation', $3)
            `, [
                `Phieu bu hang — Don ${order.order_no}`,
                `Phat hien loi do nha may tren don ${order.order_no} (${order.customer_name}). Kho loi: ${items.length} loai san pham. Vui long xac nhan va bu hang.`,
                compId,
            ]);

        // === 3. LOI VAN CHUYEN → kho loi + gui ve Sales tao don bu
        } else if (finalAction === 'loi_van_tai') {
            const defectWhRes = await client.query(`SELECT id FROM warehouses WHERE warehouse_code = 'KHO-LOI' LIMIT 1`);
            const defectWarehouseId = defectWhRes.rows[0]?.id || originalWarehouseId;

            await client.query(`
                INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, status, note, responded_by, responded_reason, defect_type)
                VALUES ($1, $2, CURRENT_TIMESTAMP, 'completed', $3, $4, $5, 'loi_van_tai')
            `, [receiptNo, defectWarehouseId, `Hang loi van tai — Don ${order.order_no}`, userId, 'loi_van_tai']);

            const ridRes = await client.query(`SELECT lastval() AS id`);
            const receiptId = ridRes.rows[0].id;

            for (const item of items) {
                await addInventory(client, defectWarehouseId, item.product_id, item.quantity, 'return_receipt', receiptId, `Hang loi van tai - Don ${order.order_no}`);
            }

            await client.query(`
                UPDATE return_requests
                SET status = 'return_to_sales', handling_result = 'loi_van_tai', logistics_note = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [`Hang loi van tai. Kho loi: ${items.length} loai san pham. Vui long tao don moi bu hang cho khach.`, rr.id]);

            await client.query(`UPDATE sales_orders SET status = 'return_to_sales', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [order_id]);

            await client.query(`
                INSERT INTO delivery_requests (order_id, handled_by, status, logistics_note)
                VALUES ($1, $2, 'return_to_sales', $3)
            `, [order_id, userId, `Loi van tai. Hang vao kho loi. Don tra ve Sales de tao don bu hang.`]);

            // Gui notification cho Sales
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
        res.status(500).json({ message: 'Loi xu ly tra hang', error: err.message });
    } finally {
        client.release();
    }
};

// PROCESS COMPENSATION — duyet/tu choi phieu bu (Admin/Nha may)
const processCompensation = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { compensation_id, action, resolution_note } = req.body;

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

        const outboundRes = await client.query(`
            SELECT warehouse_id FROM stock_outbound_notes
            WHERE order_id = $1 ORDER BY id ASC LIMIT 1
        `, [comp.order_id]);
        const warehouseId = outboundRes.rows[0]?.warehouse_id || comp.warehouse_id;
        if (!warehouseId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Khong xac dinh duoc kho goc da xuat hang!' });
        }

        const itemsRes = await client.query(`
            SELECT product_id, defective_qty FROM compensation_items WHERE compensation_id = $1
        `, [compensation_id]);

        // Tao phieu nhap kho bu hang
        const receipt_no = await generateCode('receipt');
        await client.query(`
            INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, note, status, created_at, updated_at)
            VALUES ($1, $2, CURRENT_DATE, $3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [receipt_no, warehouseId, `Bu hang tu phieu bu ${comp.compensation_no} — don ${comp.order_id}`]);

        const receiptDb = await client.query(`SELECT id FROM production_receipts WHERE receipt_no = $1`, [receipt_no]);
        const receiptId = receiptDb.rows[0].id;

        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO production_receipt_items (receipt_id, product_id, quantity)
                VALUES ($1, $2, $3)
            `, [receiptId, item.product_id, item.defective_qty]);

            await client.query(`
                INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (warehouse_id, product_id)
                DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
            `, [warehouseId, item.product_id, item.defective_qty]);

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

        // Gui notification cho Sales + Logistics + Kho
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

// LEGACY
const processReturnInit = async (req, res) => {
    res.status(400).json({ message: 'Dung /api/returns/process (1 buoc) thay vi /init + /complete' });
};

const processReturnComplete = async (req, res) => {
    const { order_id, logistics_action, logistics_note } = req.body;
    return processReturn({ body: { order_id, logistics_action, logistics_note }, user: req.user, userId: req.user?.id });
};

// NOTIFICATIONS
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
    getAllReturns, getReturnByOrder, getCompensations, processReturn,
    processReturnInit, processReturnComplete, processCompensation,
    getNotifications, markNotificationRead, markAllNotificationsRead,
};
```

### File: backend/src/controllers/warehouse.controller.js

```javascript
const db = require('../config/database');

// GET ALL WAREHOUSES
const getAllWarehouses = async (req, res) => {
    try {
        const rows = await db.getAll(`SELECT id, warehouse_code, name, location, warehouse_type FROM warehouses ORDER BY id ASC`);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay danh sach kho', detail: err.message });
    }
};

// GET WAREHOUSES FOR OUTBOUND (loai bo kho loi)
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

// CREATE WAREHOUSE
const createWarehouse = async (req, res) => {
    try {
        const { name, location } = req.body;
        if (!name) return res.status(400).json({ message: 'Ten kho khong duoc de trong' });
        const year = new Date().getFullYear();
        const existing = await db.getAll(`SELECT warehouse_code FROM warehouses WHERE warehouse_code LIKE $1`, [`KHO-${year}-%`]);
        const nextNum = (existing.length + 1).toString().padStart(4, '0');
        const warehouse_code = `KHO-${year}-${nextNum}`;
        const result = await db.run(
            `INSERT INTO warehouses (warehouse_code, name, location) VALUES ($1, $2, $3) RETURNING id, warehouse_code, name, location`,
            [warehouse_code, name, location]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Loi khi them kho moi', detail: err.message });
    }
};

// GET DEFECTIVE ORDERS
const getDefectiveOrders = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT
                rr.id, rr.order_id, rr.logistics_action, rr.handling_result,
                rr.complaint_source, rr.status, rr.created_at, rr.updated_at,
                so.order_no, c.company_name AS customer_name,
                so.expected_delivery_date, so.actual_delivery_date,
                (
                    SELECT COALESCE(
                        (SELECT w.name FROM stock_outbound_notes son JOIN warehouses w ON w.id = son.warehouse_id WHERE son.order_id = so.id ORDER BY son.id DESC LIMIT 1),
                        (SELECT w.name FROM production_receipts pr JOIN warehouses w ON w.id = pr.warehouse_id WHERE pr.note LIKE '%' || so.order_no || '%' ORDER BY pr.id DESC LIMIT 1),
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
        res.status(500).json({ message: 'Loi lay danh sach don loi', error: err.message });
    }
};

// DELETE WAREHOUSE — khong xoa neu con ton kho
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

module.exports = { getAllWarehouses, getWarehousesForOutbound, createWarehouse, deleteWarehouse, getDefectiveOrders };
```

### File: backend/src/controllers/report.controller.js (SUMMARY)

```javascript
// report.controller.js — 879 lines
// Role-based dashboard dispatcher
// GET /reports/dashboard → switch(roleId):
//   case 1: getAdminDashboard(req, res) — tong quan he thong
//   case 2: getSalesDashboard(req, res) — KPI cua Sales
//   case 4: getWarehouseDashboard(req, res) — xuat/nhap kho
//   case 3: getLogisticsDashboard(req, res) — giao hang & hoan hang
//   case 5: getFactoryDashboard(req, res) — san xuat & bu hang

// Report endpoints:
// GET /reports/sales → doanh thu theo thoi gian, top san pham, top khach
// GET /reports/logistics → thong ke giao hang & hoan hang
// GET /reports/warehouse → xuat/nhap kho, ton kho
// GET /reports/factory → phieu nhap & phieu bu
// GET /reports/inventory → ton kho chi tiet

module.exports = {
    getRoleReport, getAdminDashboard, getSalesDashboard,
    getWarehouseDashboard, getLogisticsDashboard, getFactoryDashboard,
    getInventoryReport, getSalesReport, getLogisticsReport,
    getWarehouseReport, getFactoryReport,
};
```

---

## PART 5: FRONTEND — PAGES

### File: frontend/src/pages/LoginPage.jsx

- Trang login co 2 panel: ben trai (branding + stats + testimonial), ben phai (form)
- 5 tai khoan demo: Admin, Sales, Kho, Logistics, Nha may
- Goi POST /api/auth/login, luu token vao localStorage
- Chuyen huong den / sau khi login thanh cong

### File: frontend/src/pages/AdminDashboardPage.jsx

- GOI GET /api/reports/dashboard?period=month
- Hien thi 8 KPI cards: doanh thu, don da xu ly, don cho, ton kho thap, phieu nhap, phieu xuat, yeu cau hoan, nguoi dung
- Bieu do cot: Doanh thu & Don hang theo ngay (Recharts BarChart)
- Bieu do phan bo ton kho (progress bars)
- Bang don hang gan nhat, bang san pham ban chay

### File: frontend/src/pages/SalesOrdersPage.jsx

- Quan ly don hang (CRUD)
- Trang thai: pending, warehouse_processing, shipping, completed, canceled, return_pending, return_to_sales...
- Modal tao/sua don: chon khach hang, ngay, items (san pham + so luong + don gia)
- Nut hanh dong: xu ly logistics, xuat kho, xac nhan giao, hoan tra, tu choi...
- Thanh toan tien VND bang Intl.NumberFormat

### File: frontend/src/pages/ProductsPage.jsx

- Quan ly san pham (CRUD)
- Hien thi: SKU, ten, danh muc, don gia, ton kho, trang thai ton kho (con hang/sap het/het)
- Modal tao/sua: nhap thong tin, dieu chinh ton kho

---

## PART 6: FLOW CHÍNH CỦA HỆ THỐNG

```
1. TAO DON HANG (Sales)
   POST /api/orders
   → Sinh ma SO-YYYY-NNNN trong transaction (FOR UPDATE lock)
   → Insert sales_orders + sales_order_items
   → Status: pending

2. LOGISTICS XU LY (Logistics)
   POST /api/logistics/dispatch {order_id, carrier_code}
   → Sinh ma van don GHN/GR/GHT-YYYY-NNNN (generateCode)
   → Insert shipping_orders
   → Update status = 'warehouse_processing', delivery_step = 1

3. KHO XUAT HANG (Warehouse)
   POST /api/outbounds {order_id, warehouse_id}
   → Kiem tra ton kho
   → Insert stock_outbound_notes
   → UPDATE inventory_balances (tru ton) + INSERT inventory_transactions ('OUT')
   → Update status = 'shipping'

4. GIAO HANG (Logistics)
   POST /api/logistics/simulate hoac /simulate-all
   → Tang delivery_step (1 → 2 → 3 → 4)
   → Neu hoan thanh: status = 'completed'
   → Neu khach tu choi (5%): status = 'return_pending', tao return_request

5. XU LY HOAN HANG (Logistics → Return)
   POST /api/returns/process {order_id, logistics_action}
   → action = 'khong_nhan_hang': cong ton kho goc + cancel
   → action = 'loi_nha_may': tao compensation_request, gui thong bao Factory
   → action = 'loi_van_tai': dua vao kho loi, gui thong bao Sales tao don bu

6. DUYET PHIEU BU (Factory/Admin)
   PUT /api/returns/compensations/:id {action: 'approve'}
   → Tao production_receipt (bu hang)
   → Cong ton kho goc + INSERT inventory_transactions ('IN')
   → Gui thong bao Sales + Logistics + Kho
```

---

## PART 7: PHÂN QUYỀN

| Vai trò | ID | Quyền |
|---------|----|--------|
| Admin   | 1  | Toàn quyền hệ thống |
| Sales   | 2  | Tạo đơn, quản lý khách hàng/sản phẩm, dashboard |
| Logistics | 3 | Xử lý đơn, điều phối vận chuyển, hoàn hàng |
| Kho     | 4  | Xuất/nhập kho, tồn kho, báo cáo kho |
| Nhà máy | 5  | Duyệt phiếu nhập, xử lý phiếu bù |

---

## PART 8: CAC TRANG THAI DON HANG

- `draft` — Nháp (chưa submit)
- `pending` — Chờ Logistics xử lý
- `warehouse_processing` — Kho đang chuẩn bị
- `shipping` — Đang giao hàng
- `completed` — Đã giao thành công
- `waiting_sales` — Chờ Sales xử lý lại
- `return_to_sales` — Hoàn về Sales
- `return_pending` — Đang xử lý hoàn
- `return_completed` — Hoàn xong
- `canceled` — Đã hủy
- `customer_rejected` — Khách từ chối nhận
