// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const tyreController = require('../controllers/tyreController');
const auth = require('../middlewares/jwtAuth')
const upload = require('..//middlewares/upload');

router.post('/addTyre', 
    // auth,
     upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'secondImage', maxCount: 1 },
    { name: 'thirdImage', maxCount: 1 }
  ]), tyreController.addTyre);
router.get('/allTyres', tyreController.getAllTyres);
router.get('/filterTyres', tyreController.getFilteredTyres);
router.get('/filterByRegular', tyreController.getFilteredByRegular);
router.get('/filterBySize', tyreController.getBySize);
router.delete('/removeTyre',auth, tyreController.removeTyre);


router.get('/tyreWidths', tyreController.getTyreWidths);
router.get('/tyreProfiles', tyreController.getTyreProfiles);
router.get('/rimsizes', tyreController.getRimSizes);

module.exports = router;
