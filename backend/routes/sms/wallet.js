const router = require('express').Router();
const smsWalletController = require('../../controllers/sms/smsWalletController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/me', smsWalletController.getMyWallet);
router.get('/check-balance', smsWalletController.checkBalance);
router.get('/rechargeable-users', smsAuthorize('super_admin', 'admin', 'reseller'), smsWalletController.getRechargeableUsers);
router.post('/recharge', smsAuthorize('super_admin', 'admin', 'reseller'), smsWalletController.recharge);
router.get('/:userId', smsAuthorize('super_admin', 'admin', 'reseller'), smsWalletController.getWallet);

module.exports = router;
