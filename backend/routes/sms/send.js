const router = require('express').Router();
const { smsApiKeyAuth } = require('../../middleware/apiKeyAuth');
const ctrl = require('../../controllers/sms/smsSendController');

router.post('/', smsApiKeyAuth, ctrl.sendMessage);

module.exports = router;
