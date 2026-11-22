const router = require('express').Router();
const multer = require('multer');
const smsContactController = require('../../controllers/sms/smsContactController');
const { smsAuthenticate } = require('../../middleware/smsAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(smsAuthenticate);
router.get('/', smsContactController.list);
router.post('/', smsContactController.create);
router.post('/bulk-import', upload.single('file'), smsContactController.bulkImport);
router.post('/bulk-delete', smsContactController.bulkDelete);
router.get('/blocklist', smsContactController.getBlocklist);
router.post('/blocklist', smsContactController.addToBlocklist);
router.delete('/blocklist/:id', smsContactController.removeFromBlocklist);
router.get('/:id', smsContactController.get);
router.put('/:id', smsContactController.update);
router.delete('/:id', smsContactController.remove);

module.exports = router;
