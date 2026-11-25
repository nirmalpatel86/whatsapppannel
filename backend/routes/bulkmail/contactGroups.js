const router = require('express').Router();
const bmContactGroupController = require('../../controllers/bulkmail/bmContactGroupController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmContactGroupController.list);
router.get('/:id', bmContactGroupController.get);
router.post('/', bmContactGroupController.create);
router.put('/:id', bmContactGroupController.update);
router.delete('/:id', bmContactGroupController.remove);
router.get('/:id/members', bmContactGroupController.getMembers);
router.post('/:id/members', bmContactGroupController.addMembers);
router.delete('/:id/members', bmContactGroupController.removeMembers);

module.exports = router;
