const express = require('express');
const router = express.Router();
const msisdnVodController = require('../controllers/msisdnStreamController')


router.route('/')
    .get(msisdnVodController.get)
    .post(msisdnVodController.post);   // POST not consumed by any Svc (shifted to stream stats svc)

module.exports = router;
