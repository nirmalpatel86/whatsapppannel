const router = require('express').Router();
const { bmApiKeyAuth } = require('../../middleware/apiKeyAuth');
const ctrl = require('../../controllers/bulkmail/bmSendController');

router.post('/', bmApiKeyAuth, ctrl.sendEmail);

module.exports = router;
