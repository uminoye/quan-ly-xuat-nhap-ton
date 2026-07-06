const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Các đường dẫn API cho sản phẩm
router.get('/', verifyToken, productController.getAllProducts);
router.get('/next-code', verifyToken, productController.getNextSku);
router.post('/', verifyToken, productController.createProduct);

router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);
module.exports = router;