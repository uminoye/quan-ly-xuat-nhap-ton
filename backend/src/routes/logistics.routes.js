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
