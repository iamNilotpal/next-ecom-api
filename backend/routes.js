const router = require('express').Router();
const authController = require('./controllers/auth-controller');
const productsController = require('./controllers/products-controller');
const authMiddleware = require('./middlewares/auth-middleware');

/* --------- AUTH ---------- */
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authMiddleware, authController.logout);
router.get('/refresh-token', authController.refreshToken);

/* --------- Product ---------- */
router.get('/products', productsController.allProducts);
router.post('/add-to-cart', authMiddleware, productsController.addToCart);

module.exports = router;
