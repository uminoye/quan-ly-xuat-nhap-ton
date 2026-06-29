const express = require('express');
const cors = require('cors');
const path = require('path');

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
app.use('/api/reports', reportRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// --- ERROR HANDLING ---
app.use((err, _req, res, _next) => {
    console.error('LOI HE THONG:', err.stack);
    res.status(500).json({ message: 'Da co loi xay ra tren server!', error: err.message });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chay tai: http://localhost:${PORT}`);
    console.log(`API Test: http://localhost:${PORT}/api/test`);
});
