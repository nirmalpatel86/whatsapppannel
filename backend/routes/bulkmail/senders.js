const router = require('express').Router();
const bmSenderController = require('../../controllers/bulkmail/bmSenderController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmSenderController.list);
router.get('/:id', bmSenderController.get);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSenderController.remove);

module.exports = router;
