const router = require('express').Router();
const ctrl = require('../../controllers/bulkmail/bmSendController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.post('/', bmAuthenticate, ctrl.quickSend);

module.exports = router;
