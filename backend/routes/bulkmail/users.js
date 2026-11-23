const router = require('express').Router();
const bmUserController = require('../../controllers/bulkmail/bmUserController');
const { bmAuthenticate, bmAuthorize } = require('../../middleware/bmAuth');

router.use(bmAuthenticate);
router.get('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmUserController.list);
router.post('/', bmAuthorize('super_admin', 'admin', 'reseller'), bmUserController.create);
router.put('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmUserController.update);
router.post('/:id/impersonate', bmAuthorize('super_admin', 'admin', 'reseller'), bmUserController.impersonate);
router.delete('/:id', bmAuthorize('super_admin', 'admin', 'reseller'), bmUserController.remove);

module.exports = router;
