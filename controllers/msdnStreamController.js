const MsdnStreamRepository = require('../repos/MsdnStreamRepository');
msdnStreamRepo = new MsdnStreamRepository();

exports.get = async (req, res) => {
	const { platform, file_name } = req.query;
	let query = {};
	if (file_name) query.file_name = file_name;
	if (platform) query.platform = platform;

	let result = await msdnStreamRepo.get( query );
	if (result)
		res.send({status: 200, result: result});
	else
		res.send({status: 404, message: 'Data not found'});
}

exports.post = async (req, res) => {

	let body = req.body;
	let records, objKey, channels, channel, counter = 0 ;
	for (records of body.data) {
		for (objKey in records) {
			if (records.hasOwnProperty(objKey) && objKey !== 'msdn') {
				channels = records[objKey];
				if (channels.length > 0){
					for (channel of channels){
						await this.insertOrUpdateRecord(req, objKey, records['msdn'], channel);
						counter = counter + 1;
					}
				}
			}
		}
	}

	console.log('counter: ', counter)
	res.send("Log file parsed is done!");
}

exports.insertOrUpdateRecord = async (req, objKey, msdn, record) =>{

	let body = req.body;
	let platform = body.platform;
	let source = body.source;
	let filename = body.filename;

	// Condition for update or insert a record
	let condition = {"msdn": msdn, "logDate": record.date, "logHour": record.hour, "platform": platform, "source": source, "computeSource": objKey}

	let postBody = {
		platform: platform, // Web OR Android
		source: source,   // live channel OR Vod
		msdn: msdn, // user msdn
		computeSource: objKey, // channelName or fileName
		logDate: record.date, // Date from log file
		logHour: record.hour, // Hour from log file
		bitrateCount: record.bitrateCount, // Total bitrate count
		viewCount: record.viewCount, // Total view count
		filename: filename, // Parsed log file name
	};

	let result = await this.show(condition);
	if (result){
		await this.update(result, postBody);
		return;
	}

	return await this.save(postBody);
}

exports.show = async (query) => {

	return await msdnStreamRepo.getByCondition( query );
}

exports.update = async (result, postBody) => {

	let bitrateCount = Number(postBody.bitrateCount) + Number(result.bitrateCount);
	let viewCount = Number(postBody.viewCount) + Number(result.viewCount);
	return await msdnStreamRepo.updateById( {"_id": result._id}, bitrateCount, viewCount);
}

exports.save = async (postBody) => {

	return await msdnStreamRepo.save( postBody );
}

