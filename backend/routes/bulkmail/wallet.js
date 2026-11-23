const router = require('express').Router();
const bmWalletController = require('../../controllers/bulkmail/bmWalletController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/me', bmWalletController.getMyWallet);
router.get('/rechargeable-users', bmAuthorize('super_admin', 'admin', 'reseller'), bmWalletController.getRechargeableUsers);
router.post('/recharge', bmAuthorize('super_admin', 'admin', 'reseller'), bmWalletController.recharge);
router.get('/:userId', bmAuthorize('super_admin', 'admin', 'reseller'), bmWalletController.getWallet);

module.exports = router;
