const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;


const liveLogSchema = new Schema({
    _id: {
        'type': String,
        'default': shortid.generate
    },
    channel: String,
    platform: String,
    category: String,   // Category of channel
    chunks: {
        144: { type: Number, default: 0 },
        240: { type: Number, default: 0 },
        360: { type: Number, default: 0 },
        480: { type: Number, default: 0 },
        720: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    view_counts: Number,
    view_date: Date,
    insert_time: { type: Date, default: Date.now }


}, { strict: true })

module.exports = mongoose.model('LiveLog', liveLogSchema);