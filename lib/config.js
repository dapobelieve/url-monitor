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
	'maxChecks': 5
}

enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'envName': 'production',
	'hashingSecret': 'thisIsASecret',
	'maxChecks': 5
}

// Determine which was passed as a command-line argument
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';


//check if enviroment entered is part of the defaults else default to staging
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;