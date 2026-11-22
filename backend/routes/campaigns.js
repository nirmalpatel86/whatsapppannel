const router = require('express').Router();
const campaignController = require('../controllers/campaignController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', campaignController.list);
router.get('/:id', campaignController.get);
router.post('/', authorize('super_admin', 'admin', 'reseller', 'user'), campaignController.create);
router.post('/:id/start', campaignController.start);
router.post('/:id/pause', campaignController.pause);
router.delete('/:id', campaignController.delete);

module.exports = router;
