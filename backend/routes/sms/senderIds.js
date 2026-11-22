const router = require('express').Router();
const smsSenderIdController = require('../../controllers/sms/smsSenderIdController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsSenderIdController.list);
router.get('/:id', smsSenderIdController.get);
router.post('/', smsAuthorize('super_admin', 'admin', 'reseller'), smsSenderIdController.create);
router.put('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsSenderIdController.update);
router.delete('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsSenderIdController.remove);

module.exports = router;
