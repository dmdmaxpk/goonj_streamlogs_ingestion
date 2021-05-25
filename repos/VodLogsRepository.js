const mongoose = require('mongoose');
const VodLog = mongoose.model('VodLog');

class VodLogsRepository {
    async getViewerInterestedData (query, limit) {
        return await VodLog.aggregate([
            {
                $match: query
            },
            {
                $project: {
                    file_name: "$file_name",
                    platform: "$platform",
                    view_counts: "$view_counts",
                    view_date: "$view_date",
                    vod_details: "$vod_details",
                }
            },
            { $sort: { view_counts:-1 }},
            { $limit: limit }
        ]);
    }

    async getOtherHighRecommendedData (today, ids, limit) {
        return await VodLog.aggregate([
            {
                $match: {
                    _id: {$nin: ids},
                    view_date: {$lte: new Date(today)}
                }
            },
            {
                $project: {
                    file_name: "$file_name",
                    platform: "$platform",
                    view_counts: "$view_counts",
                    view_date: "$view_date",
                    vod_details: "$vod_details",
                }
            },
            { $sort: { view_counts:-1 }},
            { $limit: limit }
        ]);
    }
}

module.exports = VodLogsRepository;
