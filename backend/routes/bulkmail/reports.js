const router = require('express').Router();
const bmReportController = require('../../controllers/bulkmail/bmReportController');
const { bmAuthenticate } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmReportController.getReport);

module.exports = router;
