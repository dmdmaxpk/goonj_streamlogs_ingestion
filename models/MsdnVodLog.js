const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;

const MsdnVodSchema = new Schema({
    _id: { 'type': String, 'default': shortid.generate },
    filename: String,
    platform: String,   // Web OR Android
    source: String,   // live channel OR Vod
    data: Array,
    insert_time: { type: Date, default: Date.now }
}, { strict: true })

module.exports = mongoose.model('MsdnVodLog', MsdnVodSchema);