const router = require('express').Router();
const smsRouteController = require('../../controllers/sms/smsRouteController');
const { smsAuthenticate, smsAuthorize } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', smsRouteController.list);
router.get('/:id', smsRouteController.get);
router.post('/', smsAuthorize('super_admin', 'admin'), smsRouteController.create);
router.put('/:id', smsAuthorize('super_admin', 'admin'), smsRouteController.update);
router.delete('/:id', smsAuthorize('super_admin', 'admin'), smsRouteController.remove);

module.exports = router;
