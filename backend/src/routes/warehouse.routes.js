const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, warehouseController.getAllWarehouses);
router.post('/', verifyToken, warehouseController.createWarehouse);
router.delete('/:id', verifyToken, warehouseController.deleteWarehouse);

module.exports = router;