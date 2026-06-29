const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logistics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/process', verifyToken, logisticsController.processOrder);

module.exports = router;