const router = require('express').Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', templateController.list);
router.post('/', authorize('super_admin', 'admin', 'reseller'), templateController.create);
router.put('/:id', authorize('super_admin', 'admin', 'reseller'), templateController.update);
router.delete('/:id', authorize('super_admin', 'admin', 'reseller'), templateController.delete);

module.exports = router;
