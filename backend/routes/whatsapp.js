const router = require('express').Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/accounts', whatsappController.listAccounts);
router.post('/accounts', whatsappController.createAccount);
router.post('/accounts/:id/connect', whatsappController.connectAccount);
router.post('/accounts/:id/disconnect', whatsappController.disconnectAccount);
router.get('/accounts/:id/status', whatsappController.getStatus);
router.delete('/accounts/:id', whatsappController.deleteAccount);

module.exports = router;
