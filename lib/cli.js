// Dependencies
var readline = require("readline");
var util = require("util");
var debug = util.debuglog('cli');
var events = require("events");
var os = require('os');
var v8 = require('v8');

class _events extends events{};
var e = new _events();

var cli = {}

// Input Handlers
e.on('man', function(str) {
	cli.responders.help();
})

e.on('help', function(str) {
	cli.responders.help();
});

e.on('exit', function(str) {
	cli.responders.exit();
});

e.on('stats', function(str) {
	cli.responders.stats();
})

e.on('list users', function(str) {
	cli.responders.listUsers();
})

e.on('more user info', function(str) {
	cli.responders.moreUserInfo(str);
})

e.on('list checks', function(str) {
	cli.responders.listChecks(str);
});

e.on('more check info', function(str) {
	cli.responders.moreCheckInfo(str);
});

e.on('list logs', function(str) {
	cli.responders.listLogs();
});

e.on('more log info', function(str) {
	cli.responders.moreLogInfo(str);
});

// create a vertical space
cli.verticalSpace = function(lines) {
	lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
	for(i=0; i<lines; i++) {
		console.log('')
	}
}

// create horizontal lines
cli.horizontalLine = function() {
	var width = process.stdout.columns;

	var line = ''
	for(i=0; i<width; i++) {
		line+='-'
	}

	console.log(line)
}

cli.centered = function(str) {
	str = typeof str == 'string' && str.trim().length > 0 ? str.trim() : ''

	// get available screen size
	var width = process.stdout.columns

	// Calculate left padding
	var leftPadding = Math.floor((width - str.length) / 2);

	// put the left padding before the text
	var line = ' '
	for(i=0; i<leftPadding; i++) {
		line+=' '
	}

	line+=str

	console.log(line)
}

// Responders
cli.responders = {}

// Help / Man
cli.responders.help = function() {
	var commands = {
		'man' : 'This is opens up this menu', 
		'help' : 'Alias of the MAN page',	
		'exit' : 'Kill the CLI (and the rest of the application)',	
		'stats' : 'Get statistics on the underlying operating system annnd resource utilities',
		'list users' : 'Show a list of all users', 
		'more user info' : 'Show details of a specific user', 
		'list checks --up --down' : 'Show a list of all active and non active checks in the system',
		'more check info --(checkId) ' : 'Show details of a specified check', 
		'list logs' : 'Show a list of all logs',
		'more log info --(filename)' : 'Show details of a specific log file'
	}
	
	// show header for help page as wide as the screen
	cli.horizontalLine();
	cli.centered('CLI MANUAL');
	cli.horizontalLine();
	cli.verticalSpace(2);

	// show each command followed by explanation in white and yellow
	for(var key in commands) {
		if(commands.hasOwnProperty(key)) {
			var value = commands[key];
			var line = '\x1b[33m'+key+'\x1b[37m'
			var padding = 60 - line.length

			for(var i=0; i<padding; i++) {
				line+=' '
			}
			line+=value
			console.log(line);
			cli.verticalSpace()
		}
	}

	cli.verticalSpace()
}

// Exit
cli.responders.exit = function() {
	console.log('\x1b[34m%s\x1b[0m', 'Goodbye 🚎');
	process.exit(0)
}

// Stats
cli.responders.stats = function() {
	// Compile an object of stats
	var stats = {
		'Load Average': os.loadavg().join(' '), // loadavg returns an array so we join it all together
		'CPU Count': os.cpus().length,
		'Free Memory': os.freemem(),
		'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
		'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
		'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
		'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
		'Uptime': os.uptime()+' seconds'
	}

	cli.horizontalLine();
	cli.centered('SYSTEM STATISTICS');
	cli.horizontalLine();
	cli.verticalSpace(2);

	for(var key in stats) {
		if(stats.hasOwnProperty(key)) {
			var value = stats[key];
			var line = '\x1b[33m'+key+'\x1b[37m'
			var padding = 60 - line.length

			for(var i=0; i<padding; i++) {
				line+=' '
			}
			line+=value
			console.log(line);
			cli.verticalSpace()
		}
	}

	cli.verticalSpace()
	cli.horizontalLine()
}

// List Users
cli.responders.listUsers = function() {
	console.log("You have asked to list all users for stats")
}

// More User Info
cli.responders.moreUserInfo = function(str) {
	console.log("You have asked for more user info")
}

// List Checks
cli.responders.listChecks = function(str) {
	console.log("You have asked to list checks")
}

// More Check Info
cli.responders.moreCheckInfo = function(str) {
	console.log("You have asked for more check info")
}

// List Logs
cli.responders.listLogs = function() {
	console.log("You have asked to list logs")
}

// More Check Info
cli.responders.moreLogInfo = function(str) {
	console.log("You have asked for more log info", str)
}



/**
 * [processInput description]
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
cli.processInput = function(str) {
	str = typeof(str) == 'string' && str.length > 0 ? str : false;

	if(str) {
		// codify unique strings that map to functions we want to carry out
		var uniqueInputs = ['man', 'help',	'exit',	'stats', 'list users', 'more user info', 'list checks',	'more check info', 'list logs', 'more log info'];

		var matchFound = false;
		var counter = 0;

		uniqueInputs.some(function(input) {
			// if one of the inputs is found in the string the user entered
			if(str.toLowerCase().indexOf(input) > -1) {
				matchFound = true;

				// emit an event matching the unique input and include full string given by user
				e.emit(input, str)
				return true
			}
		})

		if(!matchFound) {
			// if no match found tell user to try again
			console.log("Sorry try again 🙄")
		}

			
	}
}


cli.init = function() {
	// Send the start message to the console in dark bluE
	console.log('\x1b[34m%s\x1b[0m', 'The CLI is running 💨💨💨');

	var _interface = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: '>>'
	});

	// create an initial prompt
	_interface.prompt();

	// handle user input for a line
	_interface.on('line', function(str) {
		// send to input processor
		cli.processInput(str);

		// re-initialize the prompt
		_interface.prompt();
	});

	// If user stops the cli kill the associated process
	_interface.on('close', function() {
		process.exit(0);
	})
}



module.exports = cli