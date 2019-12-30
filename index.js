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



//start/instantiating the HTTP server and have it listen on port:3000
var httpServer = http.createServer(function (req, res) {
	unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function() {
	console.log("Listening on port "+config.httpPort+" in "+config.envName+"...");
});



// Instantiate the HTTPS server
var httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
}


var httpsServer = https.createServer(httpsServerOptions, function (res, req) {
	unifiedServer(req, res);
});


// start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
	console.log("Listening on port "+config.httpsPort+" in "+config.envName+"...");
});



var unifiedServer = function (req, res) {

	console.log(req.url);
	// get and parse url
	var parsedUrl = url.parse(req.url, true);

	// get the path of the url
	var path =  parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// get the query strings
	var queryStringObject = parsedUrl.query;

	//Get Http Method
	var method = req.method.toUpperCase();

	//get headers as an Object
	var headers = req.headers


	// parse payload if they exist
	var decoder = new stringDecoder('utf-8');
	var buffer = '';

	req.on('data', function (data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		//choose handler request should goto
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		//construct the data object to send to the handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': buffer
		}

		//route the request to the handler specified in the router
		chosenHandler(data, function(statusCode, payload) {
			// use status code sent by the handler or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			//use payload sent by the handler or default to empty object
			payload = typeof(payload) == 'object' ? JSON.stringify(payload) : {};

			//return response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payload);

			console.log('Returning ',statusCode, payload);

		})
	});	
};

//define route handlers
var handlers = {};

handlers.ping = function (data, callback) {
	callback(200, {});
}

handlers.notFound = function (data, callback) {
	callback(404, {});
}

//define the router
var router = {
	'ping': handlers.ping	
}

