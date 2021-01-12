const mongoose = require('mongoose');
const msdnStreamLog = mongoose.model('MsdnStreamLog');
mongoose.set('useFindAndModify', false);	// To turn off findAndModify of Mongoose and use mongo native findOneAndUpdate
const helper = require('../helper/helper');


exports.post = async (req, res) => {

	let postBody = req.body;

	// Mongoose Query to findOneAndUpdate with upsert true
	let options = { new: true, upsert: true, setDefaultsOnInsert: true }

	// Mongoose Query to findOneAndUpdate condition
	let insert_time = new Date(helper.setDate(new Date()).toString());
	let condition = {"insert_time": insert_time, "platform": postBody.platform, "source": postBody.source}
	console.log("condition: ", condition);

	msdnStreamLog.findOneAndUpdate(condition, postBody, options)
		.then(res => console.log(`Log added for: ${postBody.filename}`));

	res.send("Log file parsed is done!");
}

// POST not consumed by any Svc (shifted to stream stats svc)
exports.get = async (req, res) => {

	const { platform, file_name } = req.query;
	let query = {};
	console.log(req.query);

	if (file_name) query.file_name = file_name;
	if (platform) query.platform = platform;

	console.log(query);

	let result = await msdnStreamLog.find( query );

	if (result)
		res.send(result.data);
	else
		res.send({status: 404, message: 'Data not found'});
}