const router = require('express').Router();
const walletController = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', walletController.getMyWallet);
router.get('/pricing', walletController.getPricing);
router.get('/check-balance', walletController.checkBalance);
router.get('/rechargeable-users', authorize('super_admin', 'admin', 'reseller'), walletController.getRechargeableUsers);
router.post('/recharge', authorize('super_admin', 'admin', 'reseller'), walletController.recharge);
router.get('/transactions', walletController.getTransactions);
router.get('/transactions/:userId', authorize('super_admin', 'admin', 'reseller'), walletController.getTransactions);
router.get('/:userId', authorize('super_admin', 'admin', 'reseller'), walletController.getWallet);

module.exports = router;
