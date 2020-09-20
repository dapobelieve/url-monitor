// These are worker related tasks

// Dependencies
var path = require("path");
var fs = require("fs");
var _data = require("./data");
var helpers = require("./helpers");
var http = require("http");
var https = require("https");
var url = require("url");
var _logs = require("./logs")


var workers = {}

// alert user by sms
workers.alertUser = function(checkData) {
	var message = `Alert: Your check for ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} is currently ${checkData.state}`;

	helpers.sendTwilioSms(checkData.phone, message, function(err) {
		if(!err) {
			console.log('Success: User was alerted to a status change', message)
		}else {
			console.log("Error sending sms to user: "+checkData.phone)
		}
	})
}

// Perform check and send original validated checkData to the next process
workers.performCheck = function(originalCheckData) {
	// Prepare initial check outcome for this check
	var checkOutcome = {
		'error': false,
		'responseCode': false
	}

	// Mark that the outcome has not been sent yet
	var outcomeSent = false

	// parse hostname and path out of originalCheckData
	var parsedUrl = url.parse(originalCheckData.protocol+"://"+originalCheckData.url, true);
	var hostname = parsedUrl.hostname;
	var path = parsedUrl.path;

	// construct request
	var requestDetails = {
		'protocol': originalCheckData.protocol+":",
		'hostname': hostname,
		'method': originalCheckData.method.toUpperCase(),
		'path': path,
		'timeout': originalCheckData.timeoutSeconds * 1000
	};

	// instantiate request object using users selected protocol
	var _protocolModule = originalCheckData.protocol == "http" ? http : https;

	var req = _protocolModule.request(requestDetails, function(res) {
		// update checkOutcome
		checkOutcome.responseCode = res.statusCode;

		if(!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkOutcome);
			outcomeSent = true;
		}
	});

	// Bind to the error event  so it doesnt get thrown
	req.on('error', function(e) {
		checkOutcome.error = {
			'error': true,
			'value': e
		};

		if(!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkOutcome);
			outcomeSent = true;
		}
	});

	// Bind to the timeout
	req.on('timeout', function(e) {
		checkOutcome.error = {
			'error': true,
			'value': 'timeout'
		};

		if(!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkOutcome);
			outcomeSent = true;
		}
	});

	req.end();
}


// process checkOutcome update checkData as needed
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
	// Decide if check is up or down
	var state = !checkOutcome.error && checkOutcome.responseCode &&  originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

	// check if theres a need to alert user
	var needsAlert = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false

	var timeOfCheck = Date.now();

	// update checkData
	var newCheckData = originalCheckData;
	newCheckData.state = state;
	newCheckData.lastChecked = Date.now();

	// log here
	workers.log(originalCheckData, checkOutcome, state, needsAlert, timeOfCheck)

	// Save updated data
	_data.update('checks', newCheckData.id, newCheckData, function(err) {
		if(!err) {
			if(needsAlert) {
				workers.alertUser(newCheckData)
			}else {
				console.log("Check outcome has not changed no alert needed")
			}
		}else {
			console.log("Error trying to save updates to check: "+originalCheckData.id)
		}
	})
}

workers.gatherAllChecks = function() {
	_data.list("checks", function(err, checks) {
		if(!err && checks && checks.length > 0) {
			checks.forEach(function(check) {
				// get the original check data
				_data.read("checks", check, function(err, originalCheckData) {
					if(!err && originalCheckData) {
						workers.validateCheckData(originalCheckData);
					}else {
						console.log("Error reading one of the checks data")
					}
				})
			})
		}else {
			console.log("Error: Could not find any checks to process")
		}
	})
}

workers.validateCheckData = function(checkData) {
	console.log(typeof(checkData.userPhone) == "number")
	var checkData = typeof(checkData) == 'object' && checkData != null ? checkData : {};
	checkData.id = typeof(checkData.id) == "string" && checkData.id.trim().length == 20 ? checkData.id.trim() : false
	checkData.userPhone = typeof(parseInt(checkData.userPhone)) == "number" && checkData.userPhone.trim().length == 11 ? checkData.userPhone.trim() : false;
	checkData.protocol = typeof(checkData.protocol) == "string" && ['http', 'https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
	checkData.url = typeof(checkData.url) == "string" && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
	checkData.method = typeof(checkData.method) == "string" && ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1 ? checkData.method : false;
	checkData.successCodes = typeof(checkData.successCodes) == "object" && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes : false;
	checkData.timeoutSeconds = typeof(checkData.timeoutSeconds) == "number" && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

	// set keys that may not be set if workers have not seen this check before []
	checkData.state = typeof(checkData.state) == "string" && ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
	checkData.lastChecked = typeof(checkData.lastChecked) == "number" && checkData.lastChecked > 0 ? checkData.lastChecked : false;

	// if all checks pass
	if(checkData.id &&
		checkData.userPhone &&
		checkData.protocol &&
		checkData.url &&
		checkData.method &&
		checkData.successCodes &&
		checkData.timeoutSeconds
		) {
		workers.performCheck(checkData)
	}else {
		console.log("Error: One of the checks is not properly formatted. Skipping it >>>> ;)")
		// console.log(checkData)
	}
}

workers.log = function(originalCheckData, checkOutcome, state, needsAlert, timeOfCheck) {
	// form log data
	var logData = {
		'check': originalCheckData,
		'outcome': checkOutcome,
		'state': state,
		'alert': needsAlert,
		'time': timeOfCheck
	}

	logData = JSON.stringify(logData)

	var logFileName = originalCheckData.id

	_logs.append(logFileName, logData, function(err) {
		if(!err) {
			console.log("Logging to file successful")
		}else {
			console.log("Logging to file failed")
		}
	})
}

// timer to execute worker process once per minute
workers.loop = function() {
	setInterval(function() {
		workers.gatherAllChecks();
	}, 1000 * 5) // run every 6 minutes
}

// init logic
workers.init = function() {
	// Execute all checks
	workers.gatherAllChecks()

	// call loop to run all checks
	workers.loop();
}

module.exports = workers