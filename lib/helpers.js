var crypto = require('crypto');
var config = require('./config')
var querystring = require('querystring');
var https = require('https');

var helpers = {};

helpers.hash = function(str) {
	if(typeof(str) == 'string' && str.length > 0) {
		return hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
	}else {
		return false;
	}
}

helpers.createRandomString = function(size) {
	size = typeof(size) == 'number' && size > 0 ? size : false;
	if(size) {
		var possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

		var str = '';
		for(var i=1; i<=size; i++) {
			var randomCharacter = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));

			str+=randomCharacter;
		}

		return str;
	}else {
		return false;
	}
}


// parse JSON string to object in all cases without throwing error
helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
		return obj
	}catch(e) {
		return {};
	}
}


helpers.sendTwilioSms = function(phone, message, callback) {
	phone = typeof(phone) == 'string' && phone.trim().length == 11 ? phone.trim() : false;
	message = typeof(message) == "string" && message.trim().length > 0 && message.trim().length <= 160 ? message : false;

	console.log(phone, message);

	if(phone && message){
		var payload = {
			'From': config.twilio.fromPhone,
			'To': '+234'+phone,
			'Body': message
		};

		var stringPayload = querystring.stringify(payload);

		// configure request details
		var requestDetails = {
			'protocol': 'https:',
			'hostname': 'api.twilio.com',
			'method': 'POST',
			'path': '/2010-04-01/Accounts/'+config.twilio.accountId+'/Messages.json',
			'auth': config.twilio.accountId+":"+config.twilio.authToken,
			'headers': {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		}


		// Instantiate request
		var req = https.request(requestDetails, function(res) {
			var status = res.statusCode;

			if(status == 200 || status == 201){
				callback(false);
			}else{
				callback('Status code returned was '+status)
			}
		});

		//Bind to error event so nothing gets thrown and kills the thread
		req.on('error', function(e) {
			callback(e);
		});

		// add payload to the request
		req.write(stringPayload);

		//send request
		req.end();


	}else{
		callback('Given parameters were missing or invalid');
	}
}


module.exports = helpers;