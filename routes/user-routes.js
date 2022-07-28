const router = require('express').Router();
const userController = require('../controllers/user-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.patch('/info', authMiddleware, userController.updatePersonalInfo);
router.patch('/update-password', authMiddleware, userController.changePassword);
router.delete('/delete-account', authMiddleware, userController.deleteAccount);
router.post('/request-reset-password', userController.sendPasswordResetMail);
router.post('/verify-reset-password', userController.verifyOTP);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
