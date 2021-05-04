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

    async dou (msisdn, startDate, endDate) {
        return await msisdnStreamLog.aggregate([
            { $match: {
                    msisdn: msisdn,
                    $or: [{platform: 'web'}, {platform: 'android'}],
                    $and:[{logDate:{$gte:new Date(startDate)}}, {logDate:{$lte:new Date(endDate)}}]
            }},
            { $project: {
                    bitrate: "$bitrateCount",
                    logMonth: { $month: "$logDate" },
                }
            },
            { $group: {
                    _id: {logMonth: "$logMonth"},
                    totalBitRates: { $sum: "$bitrate" }
                }
            }
        ]);
    }
}

module.exports = MsisdnStreamRepository;
