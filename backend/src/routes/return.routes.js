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
