const router = require('express').Router();
const smsCampaignController = require('../../controllers/sms/smsCampaignController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsCampaignController.list);
router.get('/:id', smsCampaignController.get);
router.post('/', smsCampaignController.create);
router.post('/calculate-sms', smsCampaignController.calculateSmsCount);
router.post('/:id/start', smsCampaignController.start);
router.post('/:id/pause', smsCampaignController.pause);
router.delete('/:id', smsCampaignController.delete);

module.exports = router;
