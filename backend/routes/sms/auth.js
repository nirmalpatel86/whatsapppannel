const router = require('express').Router();
const smsAuthController = require('../../controllers/sms/smsAuthController');
const { smsAuthenticate } = require('../../middleware/smsAuth');
const { loginLimiter, registerLimiter } = require('../../middleware/rateLimiter');

router.post('/register', registerLimiter, smsAuthController.register);
router.post('/login', loginLimiter, smsAuthController.login);
router.get('/me', smsAuthenticate, smsAuthController.me);
router.put('/me', smsAuthenticate, smsAuthController.updateProfile);

module.exports = router;
