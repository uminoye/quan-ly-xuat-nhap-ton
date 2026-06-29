const express = require('express');
const router = express.Router();
const outboundController = require('../controllers/outbound.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, outboundController.getAllOutbounds);
router.get('/pending', verifyToken, outboundController.getPendingOutboundRequests);
router.post('/', verifyToken, outboundController.createOutboundFromPending);
router.put('/:order_id/respond', verifyToken, outboundController.respondOutbound);

module.exports = router;