const mongoose = require('mongoose');
const LiveLog = mongoose.model('LiveLog');
const axios = require('axios');
const config = require('../config');
mongoose.set('useFindAndModify', false);	// To turn off findAndModify of Mongoose and use mongo native findOneAndUpdate

// Move these channels and their categories to config file (This can also be fetched from channels API every day and then saved to DB for updated values)
let catsOfChannels = {
	'ptvsportsweb': 'sports',
	'expressnewsweb': 'news',
	'samaaweb': 'news',
	'aljazeeraweb': 'news',
	'dawnnewsweb': 'news',
	'arymusic': 'entertainment',
	'8xmweb': 'entertainment',
	'publicnewsweb': 'news',
	'aplusweb': 'entertainment',
	'makkahweb': 'islamic',
	'madinaweb': 'islamic',
	'aryqtv': 'islamic',
	'madnitvweb': 'islamic',
	'expressentweb': 'entertainment',
	'aajentweb': 'entertainment',
	'humsitarayweb': 'entertainment',
	'hummasalaweb': 'entertainment',
	'aajtvweb': 'news',
	'playtvweb': 'entertainment',
	'abbtakkweb': 'news',
	'newsoneweb': 'news',
	'capitaltvweb': 'news',
	'tvoneweb': 'entertainment',
	'apnatvweb': 'entertainment',
	'dbtvlive': 'news',
	'mashriqtv': 'news',
	'mashriqtv': 'news',
	'khybernewsweb': 'news',
	'khybertvweb': 'entertainment',
	'pashtutvweb': 'entertainment',
	'channelfiveweb': 'news',
}

exports.post = async (req, res) => {

	let {view_date, platform, channel,hour} = req.body;
	view_date = new Date(view_date).setHours(hour);
	let postBody = req.body;
	console.log("req.body",req.body)

	// Setting Conditions
	let conditions = { view_date , platform, channel };
	console.log("conditions",conditions)
	axios.get(`${config.goonj_video_service}/channel/getchannelcats`).then(async (data) => {
		catsOfChannels = data.data;

		// Setting update values
		let update = { $inc: { 
			"chunks.144": postBody.chunks[144],
			"chunks.240": postBody.chunks[240],
			"chunks.360": postBody.chunks[360],
			"chunks.480": postBody.chunks[480],
			"chunks.720": postBody.chunks[720],
			"chunks.total": postBody.chunks.total,
			"view_counts": postBody.view_counts
			},
			"category": catsOfChannels[postBody.channel],
			"video_category": postBody.category,
			"msisdn": postBody.msisdn,
			"user_id": postBody.user_id,
			"video_id": postBody.video_id
		};

		console.log('update: ', update);

		// Setting Query Options
		let options = { new: true, upsert: true, setDefaultsOnInsert: true }

		// Final Query
		let result = await LiveLog.findOneAndUpdate(conditions, update, options)

		console.log(`Log Added: ${result._id}`);
		res.send("Posted!");
	}).catch(err => {	
		console.log(`Error while getting categories:`,err);
		res.status(501).send(err);
	});	
}

// POST not consumed by any Svc (shifted to stream stats svc)
exports.get = async (req, res) => {

	const { channel, platform, startDate, endDate } = req.query;
	let query = {};
	console.log(req.query);

	if (channel) query.channel = channel;
	if (platform) query.platform = platform;	
	if (startDate) query.view_date = { $gte: startDate };
	if (endDate) query.view_date.$lte = endDate;
	
	console.log(query);

	let result = await LiveLog.find(query);

	res.send(result);
}