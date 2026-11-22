const router = require('express').Router();
const smsGroupController = require('../../controllers/sms/smsGroupController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsGroupController.list);
router.post('/', smsGroupController.create);
router.get('/:id', smsGroupController.get);
router.put('/:id', smsGroupController.update);
router.delete('/:id', smsGroupController.delete);
router.get('/:id/members', smsGroupController.getMembers);
router.post('/:id/members', smsGroupController.addMembers);
router.delete('/:id/members', smsGroupController.removeMembers);

module.exports = router;
