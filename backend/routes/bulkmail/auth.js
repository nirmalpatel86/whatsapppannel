const router = require('express').Router();
const bmAuthController = require('../../controllers/bulkmail/bmAuthController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.post('/register', bmAuthController.register);
router.post('/login', bmAuthController.login);
router.get('/me', bmAuthenticate, bmAuthController.me);

module.exports = router;
