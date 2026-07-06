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
