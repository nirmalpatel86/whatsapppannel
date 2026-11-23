const router = require('express').Router();
const bmTemplateController = require('../../controllers/bulkmail/bmTemplateController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmTemplateController.list);
router.get('/:id', bmTemplateController.get);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmTemplateController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmTemplateController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmTemplateController.remove);

module.exports = router;
