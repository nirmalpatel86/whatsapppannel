const router = require('express').Router();
const smsUserController = require('../../controllers/sms/smsUserController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsAuthorize('super_admin', 'admin', 'reseller'), smsUserController.list);
router.post('/', smsAuthorize('super_admin', 'admin', 'reseller'), smsUserController.create);
router.put('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsUserController.update);
router.delete('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsUserController.remove);

module.exports = router;
