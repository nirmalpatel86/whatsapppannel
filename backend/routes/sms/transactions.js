const router = require('express').Router();
const smsTransactionController = require('../../controllers/sms/smsTransactionController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsTransactionController.list);

module.exports = router;
