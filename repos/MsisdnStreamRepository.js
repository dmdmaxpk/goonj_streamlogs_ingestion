const mongoose = require('mongoose');
const msisdnStreamLog = mongoose.model('MsisdnStreamLog');

class MsisdnStreamRepository {
    async get (query) {
        return await msisdnStreamLog.find( query );
    }

    async getByCondition (query) {
        return await msisdnStreamLog.findOne( query );
    }

    async updateById (query, bitrateCount, viewCount) {
        return await msisdnStreamLog.updateOne(query,{$set:{bitrateCount: bitrateCount, viewCount: viewCount}});
    }

    async save (record) {
        let msisdnStreamLogObj = new msisdnStreamLog(record);
        return await msisdnStreamLogObj.save();
    }
}

module.exports = MsisdnStreamRepository;
