const router = require('express').Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', groupController.list);
router.get('/:id', groupController.get);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.delete);
router.post('/:id/members', groupController.addMembers);
router.delete('/:id/members', groupController.removeMembers);
router.get('/:id/members', groupController.getMembers);

module.exports = router;
