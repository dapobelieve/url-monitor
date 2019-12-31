/**
 * Handlers aka Controllers to handle requests
 */
// Dependencies
var _data = require('./data');
var helpers = require('./helpers');


var handlers = {};

handlers.ping = function (data, callback) {
	callback(200, {});
}

handlers.notFound = function (data, callback) {
	callback(404, {});
}

handlers.users = function(data, callback) {
	// figure out method being requested
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	}else {
		callback(405);
	}
}

handlers._users = {};

handlers._users.post = function(data, callback){
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName  = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var phone  = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if(firstName && lastName && phone && tosAgreement && password) {
		//read data containing users phone if it exists
		_data.read('users', phone, function(err, data) {
			if(err) {
				var hashedPassword = helpers.hash(password);

				if(hashedPassword) {
					var userObj = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'hashedPassword': hashedPassword,
						'tos': tosAgreement
					}

					_data.create('users', phone, userObj, function(err) {
						if(!err) {
							callback(200, {'Success': 'User created successfully'});
						}else {
							console.log
							callback(500, {'Error': 'Could not create new user'});
						}
					})
				}else {
					callback(500, {'Error': 'Could not hash password'});
				}

			}else {
				callback(400, {'Error': 'A user with that phone number already exists'});
			}
		})
	}else {
		callback(400, {'Error': 'Missing required fields'});
	}
};

handlers._users.get = function(data, callback){
	console.log('getting all user...');
};
handlers._users.put = function(data, callback){

};
handlers._users.delete = function(data, callback){

};


module.exports = handlers