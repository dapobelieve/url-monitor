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

// helpers.sendTwilioSms('07069494803', 'You are the best ever', function(res) {
// 	console.log(res);
// });

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
	server.unifiedServer(req, res);
});


server.unifiedServer = function (req, res) {

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

		//construct the data object to send to the handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJsonToObject(buffer)
		}

		//choose handler request should go to
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		// console.log(trimmedPath, trimmedPath.indexOf('public/'))
		
		chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler

		//route the request to the handler specified in the router
		chosenHandler(data, function(statusCode, payload = {}, contentType) {
			// Determine content type or default to JSON
			contentType = typeof(contentType) === "string" ? contentType : 'json'

			// use status code sent by the handler or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			var payloadString = ""

			if(contentType == 'json') {
				res.setHeader('Content-Type', 'application/json');

				//use payload sent by the handler or default to empty object
				payloadString = typeof(payload) == 'object' ? JSON.stringify(payload) : {};
			}

			if(contentType == 'html') {
				res.setHeader('Content-Type', 'text/html');
				payloadString = typeof(payload) == 'string' ? payload : "";
			}

			if(contentType == 'favicon') {
				res.setHeader('Content-Type', 'image/x-icon');
				payloadString = typeof(payload) !== 'undefined' ? payload : "";
			}

			if(contentType == 'css') {
				res.setHeader('Content-Type', 'text/css');
				payloadString = typeof(payload) !== 'undefined' ? payload : "";
			}

			if(contentType == 'png') {
				res.setHeader('Content-Type', 'text/html');
				payloadString = typeof(payload) !== 'undefined' ? payload : "";
			}

			if(contentType == 'jpg') {
				res.setHeader('Content-Type', 'text/jpeg');
				payloadString = typeof(payload) !== 'undefined' ? payload : "";
			}

			if(contentType == 'plain') {
				res.setHeader('Content-Type', 'text/plain');
				payloadString = typeof(payload) !== 'undefined' ? payload : "";
			}

			
			// common response parts for all requests
			res.writeHead(statusCode);
			res.end(payloadString);
		})
	});	
};


//define the router
server.router = {
	'': handlers.index,
	'account/create': handlers.accountCreate,
	'account/edit': handlers.accountEdit,
	'account/deleted': handlers.accountDeleted,
	'session/create': handlers.sessionCreate, // aka log in
	'session/deleted': handlers.sessionDeleted, //aka log out
	'checks/all': handlers.checksList,
	'checks/create': handlers.checksCreate,
	'checks/edit': handlers.checksEdit,
	'ping': handlers.ping,
	'api/users': handlers.users,
	'api/tokens':  handlers.tokens,
	'api/checks': handlers.checks,
	'public': handlers.public
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