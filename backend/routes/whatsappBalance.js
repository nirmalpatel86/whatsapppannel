const router = require('express').Router();
const { waApiKeyAuth } = require('../middleware/apiKeyAuth');
const ctrl = require('../controllers/whatsappSendController');

router.get('/', waApiKeyAuth, ctrl.getBalance);

module.exports = router;
