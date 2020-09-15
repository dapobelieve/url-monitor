/**
 * Main file
 */

//Dependencies

var http = require("http");
var https = require("https");
var url  = require("url");
var stringDecoder = require("string_decoder").StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require("path");

// instantiate server module object
var server = {};

helpers.sendTwilioSms('07069494803', 'You are the best ever', function(res) {
	console.log(res);
});

//start/instantiating the HTTP server and have it listen on port:3000
server.httpServer = http.createServer(function (req, res) {
	server.unifiedServer(req, res);
});


// Instantiate the HTTPS server
server.httpsServerOptions = {
	'key': fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
	'cert': fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
}


server.httpsServer = https.createServer(server.httpsServerOptions, function (res, req) {
	unifiedServer(req, res);
});


server.unifiedServer = function (req, res) {

	console.log(req.url);
	// get and parse url
	var parsedUrl = url.parse(req.url, true);

	// get the path of the url
	var path =  parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// get the query strings
	var queryStringObject = parsedUrl.query;

	//Get Http Method
	var method = req.method.toLowerCase();

	//get headers as an Object
	var headers = req.headers

	// parse payload if they exist
	var decoder = new stringDecoder('utf-8');
	var buffer = '';

	// req emits 'data' when data is coming in
	req.on('data', function (data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		//choose handler request should goto
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		//construct the data object to send to the handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJsonToObject(buffer)
		}

		//route the request to the handler specified in the router
		chosenHandler(data, function(statusCode, payload = {}) {
			// use status code sent by the handler or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			//use payload sent by the handler or default to empty object
			payload = typeof(payload) == 'object' ? JSON.stringify(payload) : {};

			//return response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payload);

		})
	});	
};


//define the router
server.router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens':  handlers.tokens,
	'checks': handlers.checks
}

// init function
server.init = function () {
	// start http server
	server.httpServer.listen(config.httpPort, function() {
		console.log("Listening on port "+config.httpPort+" in "+config.envName+"...");
	});

	// Instantiate the HTTPS server
	server.httpsServer.listen(config.httpsPort, function() {
		console.log("Listening on port "+config.httpsPort+" in "+config.envName+"...");
	});

}

module.exports = server

