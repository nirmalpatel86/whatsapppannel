const router = require('express').Router();
const bmSenderGroupController = require('../../controllers/bulkmail/bmSenderGroupController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmSenderGroupController.list);
router.get('/:id', bmSenderGroupController.get);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderGroupController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderGroupController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderGroupController.remove);

module.exports = router;
