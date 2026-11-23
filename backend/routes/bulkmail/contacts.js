const router = require('express').Router();
const multer = require('multer');
const bmContactController = require('../../controllers/bulkmail/bmContactController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(bmAuthenticate);
router.get('/', bmContactController.list);
router.get('/:id', bmContactController.get);
router.post('/', bmContactController.create);
router.post('/import', upload.single('file'), bmContactController.bulkImport);
router.put('/:id', bmContactController.update);
router.delete('/:id', bmContactController.remove);

module.exports = router;
