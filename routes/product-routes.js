const router = require('express').Router();
const productsController = require('../controllers/products-controller');

router.get('/', productsController.allProducts);

module.exports = router;
