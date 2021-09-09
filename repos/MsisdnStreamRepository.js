const mongoose = require('mongoose');
const msisdnStreamLog = mongoose.model('MsisdnStreamLog');

class MsisdnStreamRepository {
    async get (query) {
        return await msisdnStreamLog.find( query ).sort({logDate: -1}).limit( 2000 );
    }

    async getAll () {
        return await msisdnStreamLog.find({} );
    }

    async getByCondition (query) {
        return await msisdnStreamLog.findOne( query );
    }

    async updateById (query, bitrateCount, viewCount) {
        return await msisdnStreamLog.updateOne(query,{$set:{bitrateCount: bitrateCount, viewCount: viewCount}});
    }

    async updateDateById (query, logDate) {
        return await msisdnStreamLog.updateOne(query,{$set:{logDate: logDate}});
    }

    async save (record) {
        let msisdnStreamLogObj = new msisdnStreamLog(record);
        return await msisdnStreamLogObj.save();
    }

    async getBitRates (msisdn) {
        console.log('getBitRates: ', msisdn);
        try {
            let result = await msisdnStreamLog.aggregate([
                {
                    $match: {
                        msisdn: msisdn
                    }
                },
                { $group: {
                        _id: "bitrates",
                        totalBitRates: { $sum: "$bitrateCount" }
                    }
                }
            ]);

            console.log('result: ', result);
            return result;

        }catch (e) {
            console.log('getBitRates - error: ', e.message);
            return [];
        }
    }
}

module.exports = MsisdnStreamRepository;
