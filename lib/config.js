/**
 * Create and export cobfiguration variables
 */

var enviroments = {};

//Staging enviroments
enviroments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging',
	'hashingSecret': 'thisIsASecret',
	'maxChecks': 5,
	'twilio': {
		'accountId': 'AC64c4ad0f98164a5b2293f3265ec51fb4',
		'authToken': '5fadd3e8e5b1d6c50b2febc3a97d599a',
		'fromPhone': '+15005550006'
	},
	'templateGlobals': {
		'appName': 'Believe Inc.',
		'year': 2020,
		'developer': 'Dapo Believe',
		'baseUrl': 'http://localhost:3000/'
	}
}

enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'envName': 'production',
	'hashingSecret': 'thisIsASecret',
	'maxChecks': 5,
	'twilio': {
		'accountId': 'AC64c4ad0f98164a5b2293f3265ec51fb4',
		'authToken': '5fadd3e8e5b1d6c50b2febc3a97d599a',
		'fromPhone': '+15005550006'
	},
	'templateGlobals': {
		'appName': 'Believe Inc.',
		'year': 2020,
		'developer': 'Dapo Believe',
		'baseUrl': 'http://localhost:3000/'
	}
}

// Determine which was passed as a command-line argument
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';


//check if enviroment entered is part of the defaults else default to staging
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;