const express = require('express');
const router = express.Router();
const msisdnVodController = require('../controllers/msisdnStreamController')


router.route('/')
    .get(msisdnVodController.get)
    .post(msisdnVodController.post);   // POST not consumed by any Svc (shifted to stream stats svc)

router.route('/update-date-string-to-iosdate')
    .get(msisdnVodController.updateDateStringToDatePart)

router.route('/get-by-date-range')
    .get(msisdnVodController.getByDateRange)


router.route('/compute-dou-from-list-of-msisdn')
    .get(msisdnVodController.getDou)

module.exports = router;
