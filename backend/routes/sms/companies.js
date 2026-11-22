const router = require('express').Router();
const smsCompanyController = require('../../controllers/sms/smsCompanyController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.use(smsAuthorize('super_admin'));
router.get('/', smsCompanyController.list);
router.get('/:id', smsCompanyController.get);
router.post('/', smsCompanyController.create);
router.put('/:id', smsCompanyController.update);

module.exports = router;
