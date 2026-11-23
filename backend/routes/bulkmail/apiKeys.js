const router = require('express').Router();
const bmApiKeyController = require('../../controllers/bulkmail/bmApiKeyController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmApiKeyController.list);
router.get('/:id', bmApiKeyController.get);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmApiKeyController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmApiKeyController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmApiKeyController.remove);

module.exports = router;
