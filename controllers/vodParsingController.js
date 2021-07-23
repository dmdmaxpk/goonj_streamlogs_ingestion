const mongoose = require('mongoose');
const VodLog = mongoose.model('VodLog');
const config = require('../config')
const axios = require('axios');
mongoose.set('useFindAndModify', false);	// To turn off findAndModify of Mongoose and use mongo native findOneAndUpdate
const VodLogsRepository = require('../repos/VodLogsRepository');
vodLogsRepository = new VodLogsRepository();

let parsedQueue = [];	// Global: A queue for storing all the parsed logs in memory


setInterval(() => { 	// Rate limiting of API calls 
	if (parsedQueue.length !== 0) {
		console.log('Queue items left: ', parsedQueue.length);
		let vod_parsed_log = parsedQueue.shift();
		console.log('vod_parsed_log: ', vod_parsed_log);

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

			let vod_details = { _id, title, program, source, duration, category, sub_category, anchor, guests, topics, publish_dtm };
			console.log('vod_details: ', vod_details);

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
					"view_counts":vod_parsed_log.view_counts,
				},
				"msisdn":vod_parsed_log.msisdn,
				vod_details
			};

			console.log('update: ', update)
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

	console.log('query: ', query);
	let result = await VodLog.find( query );
	res.send(result);
}

// POST not consumed by any Svc (shifted to stream stats svc)
exports.filterVideos = async (req, res) => {
	const { _id, v_id, msisdn, category, source, program, platform, file_name, startDate, endDate, limit, dataRequestType } = req.query;
	let query = {};

	if (_id) query._id = _id;
	if (msisdn) query.msisdn = msisdn;
	if (file_name) query.file_name = file_name;
	if (platform) query.platform = platform;
	if (startDate) query.view_date = { $gte: startDate };
	if (endDate) query.view_date.$lte = endDate;

	if (v_id) query['vod_details._id'] = v_id;
	if (category) query['vod_details.category'] = category;
	if (source) query['vod_details.source'] = source;
	if (program) query['vod_details.program'] = program;

	if (dataRequestType === 'collaborativeItems'){
		if (category) query['vod_details.category'] = {$ne: category};
		if (source) query['vod_details.source'] = {$ne: source};
		if (program) query['vod_details.program'] = {$ne: program};
	}

	console.log('query: ', query);

	let result;
	if (dataRequestType === 'perDay'){
		result = await VodLog.find( query ).sort({insert_time: -1});
	}
	else if(dataRequestType === 'collaborativeUsers'){
		query['msisdn'] = {"$exists" : true, "$ne" : ''};
		result = await VodLog.aggregate([
			{$match: query},
			{$group: { _id: '$msisdn'}},
			{$limit: Number(limit) || 3}
		]);
	}
	else{
		result = await VodLog.find( query ).sort({insert_time: -1}).limit(Number(limit) || 30);
	}

	res.send(result);
}


// Get recommended videos by file name
exports.getRecommended = async (req, res) => {
	let query = req.query;
	let recommended = [], alreadyFetchedIds = [];
	let result = await VodLog.findOne({file_name: query.file_name});
	if (result){
		if (result.vod_details){
			if (result.vod_details.category){
				let queryParams = {};
				let category = result.vod_details.category;

				queryParams['vod_details.category'] = category;
				if(category === 'featured' || category === 'viral' || category === 'corona'){
					//
				}
				else if (category === 'comedy' || category === 'news' || category === 'sports' || category === 'education' || category === 'premium' || category === 'entertainment'){
					queryParams['vod_details.source'] = result.vod_details.source;
				}
				else if (category === 'programs' || category === 'food'){
					queryParams['vod_details.source'] = result.vod_details.source;
					queryParams['vod_details.program'] = result.vod_details.program;
					queryParams['vod_details.anchor'] = result.vod_details.anchor;
				}
				else if (category === 'drama'){
					queryParams['vod_details.source'] = result.vod_details.source;
					queryParams['vod_details.program'] = result.vod_details.program;
				}

				//Fetch Last Two Records
				queryParams['vod_details.publish_dtm'] = {$lte: new Date(result.vod_details.publish_dtm)};
				let lastTwoRecords = await vodLogsRepository.getViewerInterestedData( queryParams, 2 );
				if (lastTwoRecords && Array.isArray(lastTwoRecords)){
					recommended = recommended.concat(lastTwoRecords);

					let ids = getIds(lastTwoRecords);
					alreadyFetchedIds = alreadyFetchedIds.concat(ids);
				}

				//Fetch Next Two Records
				queryParams['vod_details.publish_dtm'] = {$gte: new Date(result.vod_details.publish_dtm)};
				let nextTwoRecords = await vodLogsRepository.getViewerInterestedData( queryParams, 2 );
				if (nextTwoRecords && Array.isArray(nextTwoRecords)){
					recommended = recommended.concat(nextTwoRecords);

					let ids = getIds(nextTwoRecords);
					alreadyFetchedIds = alreadyFetchedIds.concat(ids);
				}
			}
		}
	}

	//Fetch Next Ten Days Other High Recommended Data
	let today = new Date();
	let otherRecommendedVideos = await vodLogsRepository.getOtherHighRecommendedData( today, alreadyFetchedIds, 50);
	if (otherRecommendedVideos && Array.isArray(otherRecommendedVideos))
		recommended = recommended.concat(otherRecommendedVideos);

	res.send({code: 1, recommended: recommended, message: 'Recommended VODs'});
}


function getIds(records){
	let ids = [];
	if (records) for (const record of records) ids.push(record._id);
	return ids;
}