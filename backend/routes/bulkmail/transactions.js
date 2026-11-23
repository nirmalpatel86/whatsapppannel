const router = require('express').Router();
const bmTransactionController = require('../../controllers/bulkmail/bmTransactionController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmTransactionController.list);

module.exports = router;
