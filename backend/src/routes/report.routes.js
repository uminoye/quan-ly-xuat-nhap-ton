const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/dashboard', reportController.getDashboardStats);
router.get('/inventory', verifyToken, reportController.getInventoryReport);

module.exports = router;
