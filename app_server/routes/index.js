var express = require('express');
var router = express.Router();
var ctrlOthers = require('../controllers/others');
var ctrlLocations = require('../controllers/locations');

/* Location pages */
router.get('/', ctrlLocations.homelist);
router.get('/location/:locationid', ctrlLocations.locationInfo);
router.get('/location/:locationid/reviews/new', ctrlLocations.addReview);
router.post('/location/:locationid/reviews/new', ctrlLocations.doAddReview);

/* Other pages */
router.get('/about', ctrlOthers.about);

module.exports = router;
