const router = require('express').Router();
const ctrl = require('../../controllers/sms/smsApiKeyController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

router.use(smsAuthenticate);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
