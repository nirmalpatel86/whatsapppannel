const router = require('express').Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', authorize('super_admin'), companyController.list);
router.get('/:id', authorize('super_admin', 'reseller'), companyController.get);
router.post('/', authorize('super_admin'), companyController.create);
router.put('/:id', authorize('super_admin'), companyController.update);

module.exports = router;
