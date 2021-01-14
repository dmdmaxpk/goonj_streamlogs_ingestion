const mongoose = require('mongoose');
const logFile = mongoose.model('LogFile');

class LogFileRepository {
    async get (query) {
        return await logFile.findOne( query );
    }

    async save (record) {
        let logFileObj = new logFile(record);
        return await logFileObj.save();
    }
}

module.exports = LogFileRepository;
