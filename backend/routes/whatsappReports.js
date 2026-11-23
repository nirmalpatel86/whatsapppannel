const router = require('express').Router();
const ctrl = require('../controllers/whatsappReportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/delivery', ctrl.deliveryReport);
router.get('/usage', ctrl.usageReport);
router.get('/connections', ctrl.connectionReport);

module.exports = router;
