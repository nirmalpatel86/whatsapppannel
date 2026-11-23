const router = require('express').Router();
const bmCompanyController = require('../../controllers/bulkmail/bmCompanyController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.use(bmAuthorize('super_admin'));
router.get('/', bmCompanyController.list);
router.get('/:id', bmCompanyController.get);
router.post('/', bmCompanyController.create);
router.put('/:id', bmCompanyController.update);
router.delete('/:id', bmCompanyController.remove);

module.exports = router;
