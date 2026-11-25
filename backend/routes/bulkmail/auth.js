const router = require('express').Router();
const bmAuthController = require('../../controllers/bulkmail/bmAuthController');
const { bmAuthenticate } = require('../../middleware/bmAuth');
const { loginLimiter, registerLimiter } = require('../../middleware/rateLimiter');

router.post('/register', registerLimiter, bmAuthController.register);
router.post('/login', loginLimiter, bmAuthController.login);
router.get('/me', bmAuthenticate, bmAuthController.me);
router.put('/me', bmAuthenticate, bmAuthController.updateProfile);

module.exports = router;
