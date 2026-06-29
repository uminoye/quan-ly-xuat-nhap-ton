const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các route cơ bản cho Sales
router.get('/', verifyToken, orderController.getAllOrders);
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
// QUAN TRỌNG: Export trực tiếp biến router
module.exports = router;