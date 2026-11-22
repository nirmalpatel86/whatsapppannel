const router = require('express').Router();
const smsTemplateController = require('../../controllers/sms/smsTemplateController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsTemplateController.list);
router.get('/:id', smsTemplateController.get);
router.post('/', smsAuthorize('super_admin', 'admin', 'reseller'), smsTemplateController.create);
router.put('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsTemplateController.update);
router.delete('/:id', smsAuthorize('super_admin', 'admin', 'reseller'), smsTemplateController.remove);

module.exports = router;
