const readline = require('readline');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
var nodemailer = require('nodemailer');
const path = require('path');
const csvParser = require('csv-parser');

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

exports.getByDateRange = async (req, res) => {
	const { source, startDate, endDate, msisdn } = req.query;
	console.log('req.query: ', req.query);

	let query = {};
	if (startDate) query.logDate = { $gte: new Date(startDate) };
	if (endDate) query.logDate.$lte = new Date(endDate);
	if (source) query.source = source;
	if (msisdn !== '') query.msisdn = msisdn;

	console.log('query: ', query);
	let result = await msisdnStreamRepo.get( query );
	if (result)
		res.send({status: 200, result: result});
	else
		res.send({status: 404, message: 'Data not found'});
}

exports.updateDateStringToDatePart = async (req, res) => {

	let result = await msisdnStreamRepo.getAll( );
	for (const record of result) {
		console.log('record: ', record);
		if (record)
			await msisdnStreamRepo.updateDateById( {_id: record._id}, record.logDate );
	}

	res.send({status: 200, message: 'Operation is done'});
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
				if (records.hasOwnProperty(objKey) && (objKey !== 'msisdn' && objKey !== 'uid' && objKey !== 'category' && objKey !== 'video_id')) {
					channels = records[objKey];
					if (channels.length > 0){
						for (channel of channels){
							await this.insertOrUpdateRecord(req, objKey, records['msisdn'], records['uid'], records['category'], records['video_id'], channel);
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

exports.insertOrUpdateRecord = async (req, objKey, msisdn, uid, category, video_id, record) =>{

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
		user_id: uid, // user msisdn
		category: category, // user msisdn
		video_id: video_id, // user msisdn
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



let currentDate = null;
currentDate = getCurrentDate();

let randomReport = currentDate+"_RandomReport.csv";
let randomReportFilePath = `./${randomReport}`;

const loggerMsisdnWiseReportWriter = createCsvWriter({
	path: randomReportFilePath,
	header: [
		{id: 'msisdn', title: 'Msisdn'},
		{id: 'watchTime', title: 'Watch Time (SEC)'}
	]
});

function getCurrentDate(){
	var dateObj = new Date();
	var month = dateObj.getMonth() + 1; //months from 1-12
	var day = dateObj.getDate();
	var year = dateObj.getFullYear();
	let newdate = day + "-" + month + "-" + year;
	return newdate;
}

var transporter = nodemailer.createTransport({
	host: "mail.dmdmax.com.pk",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: 'reports@goonj.pk', // generated ethereal user
		pass: 'YiVmeCPtzJn39Mu' // generated ethereal password
	}
});

exports.getWatchTime = async (req, res) => {
	console.log("=> getWatchTime");

	let finalResult = [];
	try {
		var jsonPath = path.join(__dirname, '..', 'msisdn.txt');
		let inputData = await readFileSync(jsonPath);
		console.log("### Input Data Length: ", inputData.length);

		for(let i = 0; i < inputData.length; i++){

			let singObject = { msisdn: inputData[i] };
			singObject.watchTime = 0;
			if(inputData[i] && inputData[i].length === 11){

				console.log("### Request for msisdn: ", inputData[i], i);
				let records = await msisdnStreamRepo.getBitRates(inputData[i]);
				console.log('### records: ', records);
				if(records.length > 0){
					for (let record of records) {
						console.log('record.totalBitRates: ', record.totalBitRates);
						singObject.watchTime = Number((Number(record.totalBitRates) * 5)) + Number(singObject.watchTime);
					}
				}
				else{
					console.log("### Data not found: ");
					singObject.watchTime = 0;
				}
			}else{
				console.log("### Invalid number or number length: ");
				singObject.watchTime = 0;
			}

			finalResult.push(singObject);
			console.log('### Done: ')
		}

		console.log("### Finally: ", finalResult.length);

		if (finalResult.length > 0){

			console.log("### Sending email");
			await loggerMsisdnWiseReportWriter.writeRecords(finalResult);
			let info = await transporter.sendMail({
				from: 'paywall@dmdmax.com.pk',
				to:  ["taha@dmdmax.com"],
				subject: `Complaint Data`, // Subject line
				text: `This report contains the details of msisdns being sent us over email from Zara`,
				attachments:[
					{
						filename: randomReport,
						path: randomReportFilePath
					}
				]
			});
		}

		fs.unlink(randomReportFilePath,function(err,data) {
			if (err) {
				console.log("###  File not deleted[randomReport]");
			}

			res.send({status: 200, message: "Operation is done"});
		});

	}catch (e) {
		console.log("### error - ", e);
	}
}

readFileSync = async (jsonPath) => {
	return new Promise((resolve, reject) => {
		try{
			const readInterface = readline.createInterface({
				input: fs.createReadStream(jsonPath)
			});
			let inputData = [];
			let counter = 0;
			readInterface.on('line', function(line) {
				if(line.startsWith("92")){
					line = line.replace('92', '0');
				}else if(line.startsWith("3")){
					line = "0" + line;
				}

				inputData.push(line);
				counter += 1;
				console.log("### read", counter);
			});

			readInterface.on('close', function(line) {
				resolve(inputData);
			});
		}catch(e){
			reject(e);
		}
	});
}