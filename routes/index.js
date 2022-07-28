const router = require('express').Router();

router.use('/', require('./auth-routes'));
router.use('/products', require('./product-routes'));
router.use('/cart', require('./cart-routes'));
router.use('/user', require('./user-routes'));

module.exports = router;
