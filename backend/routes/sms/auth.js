const router = require('express').Router();
const smsAuthController = require('../../controllers/sms/smsAuthController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

router.post('/register', smsAuthController.register);
router.post('/login', smsAuthController.login);
router.get('/me', smsAuthenticate, smsAuthController.me);

module.exports = router;
