var crypto = require('crypto');
var config = require('./config')
var querystring = require('querystring');
var https = require('https');
var path = require('path');
var fs = require("fs");

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

helpers.getTemplate = function(name, data, callback) {
	var templateName = typeof(name) === 'string' && name.length > 0 ? name : false;
	data = typeof(data) === 'object' && data !== null ? data : {};

	if(templateName) {
		var templateDir = path.join(__dirname, "/../templates/");
		fs.readFile(templateDir+templateName+'.html', 'utf8', function(err, str) {
			if(!err && str && str.length > 0) {
				// interpolation on string here before returning
				var newString = helpers.interpolate(str, data)
				callback(false, newString)
			}else {
				callback('No template could be found')
			}
		})
	}else {
		callback('A valid template name was not specified')
	}
}

/**
 * [addUniversalTemplates combine header and footers with the str]
 * @param {[type]}   str      [description]
 * @param {[type]}   data     [description]
 * @param {Function} callback [fals, full string]
 */
helpers.addUniversalTemplates = function(str, data, callback) {
	str = typeof(str) === 'string' && str.length > 0 ? str : '';
	data = typeof(data) === 'object' && data !== null ? data : {};

	helpers.getTemplate('_header', data, function(err, headerString) {
		if(!err && headerString) {
			helpers.getTemplate('_footer', data, function(err, footerString) {
				if(!err && footerString) {
					var fullString = headerString+str+footerString
					callback(false, fullString)
				}
			})
		}else {
			callback('Error: Could not find header template')
		}
	})
}

helpers.interpolate = function(str, data) {
	str = typeof(str) === 'string' && str.length > 0 ? str : '';
	data = typeof(data) === 'object' && data !== null ? data : {};

	// set the global data
	for (var keyName in config.templateGlobals) {
		if(config.templateGlobals.hasOwnProperty(keyName)) {
			data['global.'+keyName] = config.templateGlobals[keyName]
		}
	}


	// set page specific data
	for(var key in data) {
		if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
			var replace = data[key];
			var regExp = new RegExp('{'+key+'}', 'g')
			str = str.replace(regExp, replace)
		}
	}

	return str;
}

// get static assets
helpers.getStaticAsset = function(fileName, callback) {
	fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false
	if(fileName) {
		var publicDir = path.join(__dirname, '/../public/')

		fs.readFile(publicDir+fileName, function(err, data) {
			if(!err && data) {
				callback(false, data)
			}else {
				callback("No file could be found")
			}
		})
	}else {
		callback('Error: a valid filename was not specified')
	}
}


module.exports = helpers;