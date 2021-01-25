const mongoose = require('mongoose');
const msisdnStreamLog = mongoose.model('MsisdnStreamLog');

class MsisdnStreamRepository {
    async get (query) {
        return await msisdnStreamLog.find( query );
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
}

module.exports = MsisdnStreamRepository;