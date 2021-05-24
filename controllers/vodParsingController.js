const mongoose = require('mongoose');
const VodLog = mongoose.model('VodLog');
const config = require('../config')
const axios = require('axios');
mongoose.set('useFindAndModify', false);	// To turn off findAndModify of Mongoose and use mongo native findOneAndUpdate


let parsedQueue = [];	// Global: A queue for storing all the parsed logs in memory


setInterval(() => { 	// Rate limiting of API calls 
	if (parsedQueue.length !== 0) {
		console.log('Queue items left: ', parsedQueue.length);
		let vod_parsed_log = parsedQueue.shift();

		// Getting video details by file_name
		axios.get(`http://10.3.7.101/video?file_name=${vod_parsed_log.file_name}.m4v`)
		.then( resp => {
			// console.log(resp.data[0]);

			// Check if the result is not found then return
			if (resp.data[0] == undefined) {
				console.log(`Video tuple not found for file: ${vod_parsed_log.file_name}`);
				return;
			}
			
			// Extracting the required fields from video document
			let { _id, title, program, source, duration, category, sub_category, anchor, guests, topics, publish_dtm } =  resp.data[0];

			vod_details = { _id, title, program, source, duration, category, sub_category, anchor, guests, topics, publish_dtm };

			// Preparing Complete docs with required fields
			let conditions = { 
				view_date: vod_parsed_log.view_date, 
				platform: vod_parsed_log.platform, 
				file_name: vod_parsed_log.file_name 
			};	// Every day there should be unique entry for one video(file_name) for each platform

			// Setting update fields
			let update = { 
				$inc: { 
					"chunks.auto": vod_parsed_log.chunks['auto'],
					"chunks.144": vod_parsed_log.chunks[144],
					"chunks.240": vod_parsed_log.chunks[240],
					"chunks.360": vod_parsed_log.chunks[360],
					"chunks.480": vod_parsed_log.chunks[480],
					"chunks.720": vod_parsed_log.chunks[720],
					"chunks.total": vod_parsed_log.chunks.total,
					"view_counts":vod_parsed_log.view_counts
				},
				vod_details
			};

			// Setting Query Options
			let options = { 
				new: true, 
				upsert: true, 
				setDefaultsOnInsert: true
			}		// Adding new doc if not exist

			// Mongoose Query to findOneAndUpdate with upsert true
			VodLog.findOneAndUpdate(conditions, update, options)
				.then(res => console.log(`Log added for: ${res.file_name}`));

		})
		.catch(err => console.log(err));
	}
	else {
		// console.log('nothing in queue');
	}
}, 200)		// Runs after specified time in ms

exports.post = async (req, res) => {

	let postBody = req.body;

	// Pushing the parsed log in queue
	parsedQueue.push(postBody);
    res.send("Added to Queue!");
}

// POST not consumed by any Svc (shifted to stream stats svc)
exports.get = async (req, res) => {

	const { platform, file_name, startDate, endDate } = req.query;
	let query = {};
	console.log(req.query);

	if (file_name) query.file_name = file_name;
	if (platform) query.platform = platform;
	if (startDate) query.view_date = { $gte: startDate };
	if (endDate) query.view_date.$lte = endDate;
	
	console.log(query);

	let result = await VodLog.find(
		query
	);

	res.send(result);
}


// Get recommended videos by file name
exports.getRecommended = async (req, res) => {
	let query = req.query;

	let recommended = [], userWatchRelatedVideos = undefined;
	let result = await VodLog.findOne({file_name: query.file_name} );
	if (result){
		if (result.vod_details){

			if (result.vod_details.category){
				let queryParams = {};
				let category = result.vod_details.category;

				queryParams.category = category;
				if(category === 'featured' || category === 'viral' || category === 'corona'){
					//queryParams.category = category;
				}
				else if (category === 'comedy' || category === 'news' || category === 'sports' || category === 'education' || category === 'premium' || category === 'entertainment'){
					queryParams.source = result.vod_details.source;
				}
				else if (category === 'programs' || category === 'food'){
					queryParams.source = result.vod_details.source;
					queryParams.program = result.vod_details.program;
					queryParams.anchor = result.vod_details.anchor;
				}
				else if (category === 'drama'){
					queryParams.source = result.vod_details.source;
					queryParams.program = result.vod_details.program;
				}

				userWatchRelatedVideos = await VodLog.aggregate([
					{
						$match: { queryParams }
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
					{ $limit: 10 }
				]);

			}

			// Add in queue user related content
			if (userWatchRelatedVideos) recommended.push(userWatchRelatedVideos);
		}
	}

	let ids = getIds(userWatchRelatedVideos);

	let endDate = new Date();
	let startDate = endDate.setDate(endDate.getDate() - 10);
	let otherRecommendedVideos = await VodLog.aggregate([
		{
			$match: {
				_id: {$nin: ids},
				$and: [{view_date: {$gte: new Date(startDate)}}, {view_date: {$lte: new Date(endDate)}}]
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
		{ $sort: { view_counts:-1 }}
	]);

	// Add other most popular content
	if (otherRecommendedVideos) recommended.push(otherRecommendedVideos);

	res.send({code: 1, recommended: recommended, message: 'Recommended videos'});
}


function getIds(records){
	let ids = [];
	if (records) for (const record of records) ids.push(record._id);
	return ids;
}