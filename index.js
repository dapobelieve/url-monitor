/**
 * Primary file for API
 */
var server = require("./lib/server");
var workers = require("./lib/workers");
var cli = require("./lib/cli")


var app = {}

app.init = function () {
	// Start Server
	server.init()

	// Start Workers
	// workers.init()

	setTimeout(function() {
		cli.init()
	}, 50)

};

//Execute,turn on the lights
app.init()


module.exports = app