const MsisdnStreamRepository = require('../repos/MsisdnStreamRepository');
const LogFileRepository = require('../repos/LogFileRepository');
msisdnStreamRepo = new MsisdnStreamRepository();
logFileRepo = new LogFileRepository();

exports.get = async (req, res) => {
	const { platform, file_name } = req.query;
	let query = {};
	if (file_name) query.file_name = file_name;
	if (platform) query.platform = platform;

	let result = await msisdnStreamRepo.get( query );
	if (result)
		res.send({status: 200, result: result});
	else
		res.send({status: 404, message: 'Data not found'});
}

exports.post = async (req, res) => {
	let body = req.body;

	// Check file is already parsed
	let logFileData = {'platform': body.platform, 'source': body.source, 'filename': body.filename};
	let result = await this.checkLogFileRecord(logFileData);
	if (!result){
		let records, objKey, channels, channel, counter = 0 ;
		for (records of body.data) {
			for (objKey in records) {
				if (records.hasOwnProperty(objKey) && objKey !== 'msisdn') {
					channels = records[objKey];
					if (channels.length > 0){
						for (channel of channels){
							await this.insertOrUpdateRecord(req, objKey, records['msisdn'], channel);
							counter = counter + 1;
						}
					}
				}
			}
		}

		// save log file information in db
		await this.updateLogFileRecord(logFileData);

		console.log('counter: ', counter);
		res.send({status: '200', message: 'Log file parsed is done!'});
	}
	else{
		console.log('This Log file is already parsed: ');
		res.send({status: '200', message: 'This Log file is already parsed'});
	}
}

exports.insertOrUpdateRecord = async (req, objKey, msisdn, record) =>{

	let body = req.body;
	let platform = body.platform;
	let source = body.source;
	let filename = body.filename;

	// Condition for update or insert a record
	let condition = {"msisdn": msisdn, "logDate": record.date, "logHour": record.hour, "platform": platform, "source": source, "computeSource": objKey}

	let postBody = {
		platform: platform, // Web OR Android
		source: source,   // live channel OR Vod
		msisdn: msisdn, // user msisdn
		computeSource: objKey, // channelName or fileName
		logDate: record.date, // Date from log file
		logHour: record.hour, // Hour from log file
		bitrateCount: record.bitrateCount, // Total bitrate count
		minutes: record.minutes, // Array of watching minutes
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

	return await msisdnStreamRepo.getByCondition( query );
}

exports.update = async (result, postBody) => {

	let bitrateCount = Number(postBody.bitrateCount) + Number(result.bitrateCount);
	let minutes = Number(postBody.minutes) + Number(result.minutes);
	return await msisdnStreamRepo.updateById( {"_id": result._id}, bitrateCount, minutes);
}

exports.save = async (postBody) => {

	return await msisdnStreamRepo.save( postBody );
}

exports.checkLogFileRecord = async (query) => {

	return await logFileRepo.get(query);
}

exports.updateLogFileRecord = async (postBody) => {

	return await logFileRepo.save(postBody);
}

