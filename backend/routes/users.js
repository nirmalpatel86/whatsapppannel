const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', authorize('super_admin', 'admin', 'reseller'), userController.list);
router.post('/', authorize('super_admin', 'admin', 'reseller'), userController.create);
router.put('/:id', authorize('super_admin', 'admin', 'reseller'), userController.update);
router.delete('/:id', authorize('super_admin', 'admin', 'reseller'), userController.remove);

module.exports = router;
