/**
 * Frontend codes
 */

const app = {}

app.config = {
	'sessionToken': false
};

app.client = {};


app.client.request = function(headers, path, method, queryString, payload, callback) {
	headers = typeof(headers) == 'object' && headers !== null ? headers : {}
	method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : 'GET';
	queryString = typeof(queryString) == 'object' && queryString !== null ? queryString : {};
	payload = typeof(payload) == 'object' && payload !== null ? payload : {};
	callback = typeof(callback) == 'function' ? callback : false;

	// add all queryString params to the url
	var requestUrl = path+'?';
	var counter = 0;
	for(var key in queryString) {
		if(queryString.hasOwnProperty(key)) {
			counter++;

			if(counter > 1) {
				requestUrl+='&' 
				requestUrl+=key+'='+queryString[key];
			}
		}
	}

	//form http request as a JSON type
	var xhr = new XMLHttpRequest();
	xhr.open(method, requestUrl, true);
	xhr.setRequestHeader("Content-Type", "application/json")

	for(var headerKey in headers) {
		if(headers.hasOwnProperty(headerKey)) {
			xhr.setRequestHeader(headerKey, headers[headerKey])
		}
	}

	// set token if it exists
	if(app.config.sessionToken) {
		xhr.setRequestHeader('token', app.config.sessionToken.id);
	}

	xhr.onreadystatechange = function() {
		if(xhr.readyState == XMLHttpRequest.DONE) {
			var statusCode = xhr.state;
			var responseText = xhr.responseText;

			// callback
			if(callback) {
				try {
					var parsedRes = JSON.parse(responseText)
					callback(statusCode, parsedRes)
				}catch(e) {
					callback(statusCode, false)
				}
			}
		}
	}

	var payloadString = JSON.stringify(payload)
	xhr.send(payload)

}