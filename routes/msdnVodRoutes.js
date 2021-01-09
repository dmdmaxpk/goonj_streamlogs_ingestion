const express = require('express');
const router = express.Router();
const msdnVodController = require('../controllers/msdnVodController')


router.route('/')
    .get(msdnVodController.get)
    .post(msdnVodController.post);   // POST not consumed by any Svc (shifted to stream stats svc)

module.exports = router;
