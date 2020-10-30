/**
 * Primary file for API
 */
var server = require("./lib/server");
var workers = require("./lib/workers");


var app = {}

app.init = function () {
	// Start Server
	server.init()

	// Start Workers
	// workers.init()

};

//Execute,turn on the lights
app.init()


module.exports = app