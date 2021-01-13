const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;

const MsdnStreamSchema = new Schema({
    _id: { 'type': String, 'default': shortid.generate },
    platform: String, // Web OR Android
    source: String,   // live channel OR Vod
    msdn: String, // user msdn
    computeSource: String, // channelName or fileName
    logDate: String, // Date from log file
    logHour: String, // Hour from log file
    bitrateCount: Number, // Total bitrate count
    viewCount: Number, // Total view count
    filename: String, // Parsed log file name
    insertTime: { type: Date, default: Date.now }
}, { strict: true })

module.exports = mongoose.model('MsdnStreamLog', MsdnStreamSchema);