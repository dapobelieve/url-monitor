/**
 * Create and export cobfiguration variables
 */

var enviroments = {};

//Staging enviroments
enviroments.staging = {
	'port': 3000,
	'envName': 'staging'
}

enviroments.production = {
	'port': 5000,
	'envName': 'production'
}

// Determine which was passed as a command-line argument
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';


//check if enviroment entered is part of the defaults else default to staging
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;