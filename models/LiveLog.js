const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;


const liveLogSchema = new Schema({
    _id: {
        'type': String,
        'default': shortid.generate
    },
    channel: String,
    platform: String,   // Web OR Android
    category: String,   // Category of channel
    video_category: String,
    user_id: String,
    msisdn: String,
    video_id: String,
    chunks: {
        144: { type: Number, default: 0 },
        240: { type: Number, default: 0 },
        360: { type: Number, default: 0 },
        480: { type: Number, default: 0 },
        720: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    view_counts: Number,    // Total number of clicks on channel
    view_date: Date,
    hour: Number,           // 24 hours of data for each channel
    view_timestamp: Date,
    insert_time: { type: Date, default: Date.now }


}, { strict: true })

module.exports = mongoose.model('LiveLog', liveLogSchema);