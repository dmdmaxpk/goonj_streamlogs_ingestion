const mongoose = require('mongoose');
const shortid = require('shortid');
const {Schema} = mongoose;


const vodLogSchema = new Schema({
    _id: {
        'type': String,
        'default': shortid.generate
    },
    platform: String,   // sent by parser
    file_name: String,  // sent by parser
    chunks: {           // sent by parser
        auto: { type: Number, default: 0 },
        144: { type: Number, default: 0 },
        240: { type: Number, default: 0 },
        360: { type: Number, default: 0 },
        480: { type: Number, default: 0 },
        720: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    msisdn: String,
    view_counts: Number,    // sent by parser
    view_date: Date,        // sent by parser
    vod_details: {          // These details are fetched from Video Svc and then saved here
        _id: String,
        title: String,
        program: String,
        source: String,
        duration: Number,
        category: String,
        anchor: String,
        guests: Array,
        topics: Array,
        publish_dtm: Date,
    },
    insert_time: { type: Date, default: Date.now }


}, { strict: true })

module.exports = mongoose.model('VodLog', vodLogSchema);