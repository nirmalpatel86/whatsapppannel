const router = require('express').Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mp3|ogg|wav|pdf|doc|docx|xls|xlsx|txt|csv|zip/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

router.use(authenticate);
router.get('/', chatController.listChats);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.post('/:chatId/messages/attachment', upload.single('file'), chatController.sendAttachment);
router.post('/send', chatController.sendNewMessage);
router.post('/send/attachment', upload.single('file'), chatController.sendNewAttachment);

module.exports = router;
