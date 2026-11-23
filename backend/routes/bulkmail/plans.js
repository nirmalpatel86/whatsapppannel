const router = require('express').Router();
const bmPlanController = require('../../controllers/bulkmail/bmPlanController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmPlanController.list);
router.get('/:id', bmPlanController.get);
router.post('/', bmAuthorize('super_admin', 'admin'), bmPlanController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin'), bmPlanController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin'), bmPlanController.remove);

module.exports = router;
