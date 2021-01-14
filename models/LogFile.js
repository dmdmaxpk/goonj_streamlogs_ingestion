const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;

const LogFileSchema = new Schema({
    _id: { 'type': String, 'default': shortid.generate },
    platform: String, // Web OR Android
    source: String,   // live channel OR Vod
    filename: String, // Parsed log file name
    insertTime: { type: Date, default: Date.now }
}, { strict: true })

module.exports = mongoose.model('LogFile', LogFileSchema);