const router = require('express').Router();
const multer = require('multer');
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/', contactController.list);
router.post('/', contactController.create);
router.post('/bulk-import', upload.single('file'), contactController.bulkImport);
router.post('/bulk-delete', contactController.bulkDelete);
router.get('/:id', contactController.get);
router.put('/:id', contactController.update);
router.delete('/:id', contactController.remove);

module.exports = router;
