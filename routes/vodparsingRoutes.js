const express = require('express');
const router = express.Router();
const vodParsingController = require('../controllers/vodParsingController')


router.route('/')
    .get(vodParsingController.get)
    .post(vodParsingController.post);   // POST not consumed by any Svc (shifted to stream stats svc)

router.route('/recommended')
    .get(vodParsingController.getRecommended)

module.exports = router;
