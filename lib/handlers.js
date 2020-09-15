/**
 * Handlers aka Controllers to handle requests
 */
// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');


var handlers = {};

handlers.ping = function (data, callback) {
	// console.log(__dirname, __filename)
	callback(200, {});
}

handlers.notFound = function (data, callback) {
	callback(404, {});
}

handlers.users = function(data, callback) {
	// figure out method being requested and call it with the required arguments
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

// @TODO Only let authenticated users access their own object
handlers._users.get = function(data, callback){
	//check phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ? data.queryStringObject.phone.trim() : false;

	if(phone) {
		// grab token
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		//verify token
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if(tokenIsValid) {
				//lookup user
				_data.read('users', phone, function(err, data) {
					if(!err && data) {
						//remove password from the returned data
						delete data.hashedPassword
						callback(200, data);
					}else {
						callback(404, {'Error': 'User not found'});
					}
				})
			}else {
				callback(403, {'Error': 'Missing required token or token invalid'});
			}
		})

		
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};


handlers._users.put = function(data, callback){
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;

	//check optional fields
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName  = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

	if(phone) {
		if(firstName || lastName || password) {
			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			//verify token
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
				if(tokenIsValid) {
					_data.read('users', phone, function(err, userData) {
						if(!err && userData) {
							// update fields 
							if(firstName){
								userData.firstName = firstName
							}
							if(lastName){
								userData.lastName = lastName
							}
							if(password){
								userData.password = helpers.hash(password);
							}

							_data.update('users', phone, userData, function(err) {
								if(!err) {
									callback(204, {'Success': 'User data updated'});
								}else {
									callback(500, {'Error': 'Could not update user record'});
								}
							})
						}else {
							callback(400, {'Error': 'Specified user does not exist'});
						}
					})
				}else {
					callback(403, {'Error': 'Missing required token or token invalid'});
				}
			})
			
		}else {
			callback(400, {'Error': 'Missing required fields to update'});
		}
	}else {
		callback(400, {'Error': 'Missing required field'});
	}
};


// delete all files associated with the user (checks)
handlers._users.delete = function(data, callback){
	//check phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ? data.queryStringObject.phone.trim() : false;
	if(phone) {
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		//verify token
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if(tokenIsValid) {
				//lookup user
				_data.read('users', phone, function(err, data) {
					if(!err && data) {
						_data.delete('users', phone, function(err) {
							if(!err) {
								// Delete checks associated with the user
								var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
								var checksToDelete = userChecks.length;

								if(checksToDelete > 0){
									var checksDeleted = 0;
									var deletingErrors = false;
									userChecks.forEach(function(checkId) {
										_data.delete('checks', checkId, function(err) {
											if(err){
												deletingErrors = true
											}
											checksDeleted++;
											if(checksDeleted == checksToDelete){
												if(!deletingErrors){
													callback(200);
												}else{
													callback(500, {'Error': 'Errors encountered while deleting user checks, all checks might not have been deleted'});
												}
											}
										})
									})
								}else {
									callback(200);
								}
							}else {
								callback(500, {'Error': 'Could not delete Specified user'});
							}
						})
					}else {
						callback(404, {'Error': 'Could not find Specified user'});
					}
				})
			}else {
				callback(403, {'Error': 'Missing required token or token invalid'});
			}
		})
		
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};

/**
 * Tokens CRUD
 */

handlers.tokens = function(data, callback) {
	// figure out method being requested
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	}else {
		callback(405);
	}
}


handlers._tokens = {};


handlers._tokens.post = function (data, callback) {
	var phone  = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
	if(phone && password) {
		//look up user with that phone number
		_data.read('users', phone, function(err, userData) {
			if(!err && userData) {
				// hash password and compare to password stored in user object
				var hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword) {
					// create a new token, set expiration date to 1hour in the future
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};

					// store token
					_data.create('tokens', tokenId, tokenObject, function (err) {
						if(!err) {
							callback(200, tokenObject);
						}else {
							callback(500, {'Error': 'Could not create new token'});
						}
					})
				}else {
					callback(400, {'Error': 'No match for user password'});
				}
			}else {
				callback(400, {'Error': 'Could not find specified user'});
			}
		})
		//
	}else {
		callback(400, {'Error': 'Missing required fields'});
	}
};


handlers._tokens.get = function(data, callback) {
	//check phone number is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		//lookup id
		_data.read('tokens', id, function(err, tokenData) {
			if(!err && tokenData) {
				//remove password from the returned tokenData
				callback(200, tokenData);
			}else {
				callback(404, {'Error': 'Token not found'});
			}
		})
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};

// allow token to be extended
// they can pass an extend variable
handlers._tokens.put = function(data, callback) {
	var id  = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	var extend  = typeof(data.payload.extend) == 'boolean' ? true : false;

	if(id && extend) {
		//look up token by id
		_data.read('tokens', id, function(err, data) {
			if(!err && data) {
				// check if token isn't already expired
				if(data.expires > Date.now()) {
					//set expiration to 1hour from now
					data.expires = Date.now() + 1000 *  60 * 60;
					_data.update('tokens', id, data, function(err) {
						if(!err) {
							callback(200, {})
						}else {
							callback(500, {'Error': 'could not update token expiration'});
						}
					})
				}else {
					callback(400, {'Error': 'Token expired'});
				}
			}else {
				callback(400, {'Error': 'Token does not exists'});
			}
		})
	}else {
		callback(400, {'Error': 'Missing required fields'});
	}
};


handlers._tokens.delete = function(data, callback) {
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		//lookup user
		_data.read('tokens', id, function(err, data) {
			if(!err && data) {
				_data.delete('tokens', id, function(err) {
					if(!err) {
						callback(200, {});
					}else {
						callback(500, {'Error': 'Could not delete token'});
					}
				})
			}else {
				callback(404, {'Error': 'Could not find Specified user'});
			}
		})
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};


handlers._tokens.verifyToken = function(id, phone, callback) {
	//lookup token 
	_data.read('tokens', id, function(err, data) {
		if(!err && data) {
			//check if token is for the phone number, user and has not expired
			if(data.phone == phone && data.expires > Date.now()) {
				callback(true);
			}else {
				callback(false);
			}

		}else {
			callback(false);
		}
	})
}


/**
 * Checks CRUD
 */
handlers.checks = function(data, callback) {
	// figure out method being requested
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	}else {
		callback(405);
	}
}

handlers._checks = {};

// Checks - post
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback) {
	var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
	
	if(protocol && url && method && successCodes && timeoutSeconds) {
		//get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		_data.read('tokens', token, function(err, tokenData) {
			if(!err && tokenData) {
				var userPhone = tokenData.phone;

				// look up userData using rhe phone
				_data.read('users', userPhone, function(err, userData) {
					if(!err && userData) {
						var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
						// verify user has less than number of max checks per user
						if(userChecks.length < config.maxChecks) {
							var checkId = helpers.createRandomString(20);

							//create check object and include users phone
							var checkObject = {
								'id': checkId,
								'userPhone': userPhone,
								'protocol': protocol,
								'url': url,
								'method': method,
								'successCodes': successCodes,
								'timeoutSeconds': timeoutSeconds
							}

							// persist new object to disk
							_data.create('checks', checkId, checkObject, function(err) {
								if(!err) {
									//add check id to usersObject
									userData.checks = userChecks;
									userData.checks.push(checkId);

									//update userdata
									_data.update('users', userPhone, userData, function(err) {
										if(!err) {
											callback(200, checkObject);
										}else {
											callback(500, {'Error': 'could not update user with new check '});
										}
									})
								}else {
									callback(500, {'Error': 'Error saving check'});
								}
							})
						}else {
							callback(400, {'Error': 'Maximum number of checks reached ('+config.maxChecks+')'});
						}
					}else {
						callback(403);
					}
				})
			}else {
				callback(403, {'Error': 'user not found'})
			}
		})
	}else {
		callback(400, {'Error': 'Missing required fields'});
	}
}


handlers._checks.get = function(data, callback){
	//check phone number is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

	if(id) {
		//look for the checkData
		_data.read('checks', id, function(err, checkData) {
			if(!err && checkData){
				// grab token from headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				//verify token
				handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
					if(tokenIsValid) {
						callback(200, checkData);
					}else {
						callback(403, {'Error': 'Token missing or invalid'});
					}
				})
			}else{
				callback(404);
			}
		})
		
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};

handlers._checks.put = function(data, callback) {
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

	// check for optional fields
	var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

	if(id) {
		if(protocol || url || method || successCodes || timeoutSeconds){
			// lookup the check
			_data.read('checks', id, function(err, checkData) {
				if(!err && checkData){
					// verify token
					var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
					//verify token
					handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
						if(tokenIsValid){
							if(protocol){
								checkData.protocol = protocol
							}
							if(url){
								checkData.url = url
							}
							if(method){
								checkData.method = method
							}
							if(successCodes){
								checkData.successCodes = successCodes
							}
							if(timeoutSeconds){
								checkData.timeoutSeconds = timeoutSeconds
							}

							_data.update('checks', id, checkData, function(err) {
								if(!err){
									callback(200);
								}else{
									callback(500, {'Error': 'error updating check'})
								}
							})
						}else{
							callback(403, {'Error': 'Token missing or invalid'});
						}					
					})
				}else{
					callback(400, {'Error':'Check ID not found'});
				}
			})
		}else {
			callback(400, {'Error': 'Missing required fields'});
		}
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
}


handlers._checks.delete = function(data, callback) {
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		//lookup user
		_data.read('checks', id, function(err, checkData) {
			if(!err && data) {
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

				//verify token
				handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
					if(tokenIsValid) {
						//lookup user
						_data.delete('checks', id, function(err) {
						if(!err) {
							_data.read('users', checkData.userPhone, function(err, userData) {
								if(!err && userData){
									// grab user checks
									var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

									var checkPosition = userChecks.indexOf(id);

									if(checkPosition > -1){
										userChecks.splice(checkPosition, 1);
										userData.checks = userChecks
										_data.update('users', checkData.userPhone, userData, function(err) {
											if(!err){
												callback(200);
											}else{
												callback(500, {'Error': 'Could not update user'});
											}
										})
									}else {
										callback(500, {'Error': 'Could not find check on users object'});
									}
								}else{
									callback(500, {'Error': 'could not find user'})
								}
							})
						}else {
							callback(500, {'Error': 'Could not delete check'});
						}
					})
					}else {
						callback(403, {'Error': 'Missing required token or token invalid'});
					}
				});
			}else {
				callback(404, {'Error': 'Could not find Specified check id'});
			}
		})
	}else {
		callback(400, {'Error': 'Missing required field'})
	}
};

module.exports = handlers