const router = require('express').Router();
const bmSmtpController = require('../../controllers/bulkmail/bmSmtpController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmSmtpController.list);
router.get('/:id', bmSmtpController.get);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmSmtpController.create);
router.post('/:id/test', bmSmtpController.test);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSmtpController.update);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmSmtpController.remove);

module.exports = router;
