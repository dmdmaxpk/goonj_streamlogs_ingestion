const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;

const MsisdnStreamSchema = new Schema({
    _id: { 'type': String, 'default': shortid.generate },
    platform: String, // Web OR Android
    source: String,   // live channel OR Vod
    msisdn: String, // user msisdn
    user_id: String, // user user id
    category: String, // video category
    video_id: String, // video id
    computeSource: String, // channelName or fileName
    logDate: { type: Date, default: Date.now }, // Date from log file
    logHour: String, // Hour from log file
    bitrateCount: Number, // Total bitrate count
    minutes: Array, // Array of watching minutes
    filename: String, // Parsed log file name
    insertTime: { type: Date, default: Date.now }
}, { strict: true })

module.exports = mongoose.model('MsisdnStreamLog', MsisdnStreamSchema);