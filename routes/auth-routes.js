const router = require('express').Router();
const authController = require('../controllers/auth-controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.delete('/logout', authMiddleware, authController.logout);
router.get('/refresh-token', authController.refreshToken);

module.exports = router;
