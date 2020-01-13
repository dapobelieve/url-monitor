/**
 * File for storing an retrieving data
 * File system flags [https://nodejs.org/api/fs.html#fs_file_system_flags]
 */

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

//base directory of the .data folder
lib.baseDir = path.join(__dirname, '/../.data/'); //from inside the lib dir go back up and into the .data dir


// write to a flie
lib.create = function(dir, filename, data, callback) {
	//open file for writing
	fs.open(lib.baseDir+dir+'/'+filename+'.json', 'wx', function (err, fileDescriptor) {
		if(!err && fileDescriptor) {
			//Convert data to string
			var stringData = JSON.stringify(data);

			//write to file an close it
			fs.writeFile(fileDescriptor, stringData, function(err) {
				if(!err) {
					fs.close(fileDescriptor, function(err) {
						if(!err) {
							callback(false);
						}else {
							callback('Error closing new file');
						}
					})
				}else {
					callback('Error writing to file')
				}
			});
		}else {
			callback('Could not create a new file, it may already exist');
		}
	})
}

//read data from a file
lib.read = function(dir, filename, callback) {
	fs.readFile(lib.baseDir+dir+'/'+filename+'.json', 'utf-8', function(err, data) {
		if(!err && data) {
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);
		}else {
			callback(err, data);
		}
	});
}

// update 
lib.update = function(dir, filename, data, callback) {
	fs.open(lib.baseDir+dir+'/'+filename+'.json', 'r+', function (err, fileDescriptor) {
		if(!err && fileDescriptor) {
			var stringData = JSON.stringify(data);

			//truncate the file
			fs.ftruncate(fileDescriptor, function(err) {
				if(!err) {
					//write to the file and close it
					fs.writeFile(fileDescriptor, stringData, function(err) {
						if(!err) {
							fs.close(fileDescriptor, function(err) {
								if(!err) {
									callback(false);
								}else {
									callback('Error closing file');
								}
							})
						}else {
							callback('Error writing to existing file');
						}
					})
				}else {
					callback('Error truncating file');
				}
			})
		}else {
			callback('Could not open file, it. may not exist yet');
		}
	})
}                                                      

//delete
lib.delete = function(dir, filename, callback) {
	// unlink file
	fs.unlink(lib.baseDir+dir+'/'+filename+'.json', function(err) {
		if(!err) {
			callback(false);
		}else {
			callback('Error deleting file')
		}
	})
}

module.exports = lib;