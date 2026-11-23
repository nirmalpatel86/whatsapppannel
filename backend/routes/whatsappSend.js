const router = require('express').Router();
const { waApiKeyAuth } = require('../middleware/apiKeyAuth');
const ctrl = require('../controllers/whatsappSendController');

router.post('/', waApiKeyAuth, ctrl.sendMessage);

module.exports = router;
