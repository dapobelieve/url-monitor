var crypto = require('crypto');
var config = require('./config')

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


module.exports = helpers;