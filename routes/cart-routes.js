const router = require('express').Router();
const cartController = require('../controllers/cart-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.get('/', authMiddleware, cartController.getCart);
router.post('/add', authMiddleware, cartController.addToCart);
router.patch('/update-item', authMiddleware, cartController.updateCart);
router.delete('/remove-item', authMiddleware, cartController.removeCartItem);
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;
