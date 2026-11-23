const router = require('express').Router();
const bmContactGroupController = require('../../controllers/bulkmail/bmContactGroupController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmContactGroupController.list);
router.get('/:id', bmContactGroupController.get);
router.post('/', bmContactGroupController.create);
router.put('/:id', bmContactGroupController.update);
router.delete('/:id', bmContactGroupController.remove);

module.exports = router;
