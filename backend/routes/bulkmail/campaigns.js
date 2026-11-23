const router = require('express').Router();
const bmCampaignController = require('../../controllers/bulkmail/bmCampaignController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

// Public tracking routes (no auth)
router.get('/track/open/:trackingCode', bmCampaignController.trackOpen);
router.get('/track/click/:trackingCode', bmCampaignController.trackClick);
router.get('/unsubscribe/:trackingCode', bmCampaignController.unsubscribe);

router.use(bmAuthenticate);
router.get('/', bmCampaignController.list);
router.get('/:id', bmCampaignController.get);
router.get('/:id/stats', bmCampaignController.stats);
router.post('/', bmCampaignController.create);
router.post('/:id/start', bmCampaignController.start);
router.post('/:id/pause', bmCampaignController.pause);
router.delete('/:id', bmCampaignController.delete);

module.exports = router;
