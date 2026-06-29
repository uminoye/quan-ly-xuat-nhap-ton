const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', receiptController.getAllReceipts);
router.post('/', verifyToken, receiptController.createRequest);
router.put('/:id/respond', receiptController.factoryRespond);
router.put('/:id/confirm', receiptController.confirmReceipt);

module.exports = router;
