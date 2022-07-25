const router = require('express').Router();
const authController = require('./controllers/auth-controller');
const cartController = require('./controllers/cart-controller');
const productsController = require('./controllers/products-controller');
const userController = require('./controllers/user-controller');
const authMiddleware = require('./middlewares/auth-middleware');

/* --------- AUTH ---------- */
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authMiddleware, authController.logout);
router.get('/refresh-token', authController.refreshToken);

/* --------- Product ---------- */
router.get('/products', productsController.allProducts);

/* --------- Cart ---------- */
router.get('/cart', authMiddleware, cartController.getCart);
router.post('/add-to-cart', authMiddleware, cartController.addToCart);
router.patch('/update-cart', authMiddleware, cartController.updateCart);
router.delete('/remove', authMiddleware, cartController.removeCartItem);
router.delete('/clear-cart', authMiddleware, cartController.clearCart);

/* --------- User ---------- */
router.patch(
  '/personal-info',
  authMiddleware,
  userController.updatePersonalInfo
);
router.patch('/update-password', authMiddleware, userController.changePassword);
router.delete('/delete-account', authMiddleware, userController.deleteAccount);
module.exports = router;
