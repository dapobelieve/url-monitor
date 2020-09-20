/**
 * Library for storing and rotating logs
 */

// Dependencies
var fs = require("fs")
var path = require("path")
var zlib = require("zlib")

var lib = {}

lib.baseDir = path.join(__dirname, "/../.logs/")


lib.append = function(filename, str, callback) {
	//Open file for appending
	fs.open(lib.baseDir+filename+".log", 'a', function(err, fileDescriptor) {
		if(!err && fileDescriptor) {
			// append to file and close it
			fs.appendFile(fileDescriptor, str+'\n \n', function(err) {
				if(!err) {
					fs.close(fileDescriptor, function(err) {
						if(!err) {
							callback(false)
						}else {
							callback('Error closing file that was being appended to')
						}
					})
				}else {
					callback("Error appending file")
				}
			})
		}else {
			callback("Error: Could not open file for appending");
		}
	})
}

// list all the logs and optionally include compressed logs
lib.list = function(includeCompressedLogs = false, callback) {
	fs.readdir(lib.baseDir, function(err, data) {
		if(!err && data && data.length) {
			var trimmedFileNames = [];

			data.forEach(function(fileName) {
				// add .log files
				if(fileName.indexOf('.log') > -1) {
					trimmedFileNames.push(fileName.replace('.log', ''));
				}

				// optionally add compressed files
				if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
					trimmedFileNames.push(fileName.replace('.gz.b64', ''));
				}
			})

			callback(false, trimmedFileNames)

		}else {
			callback(err, data)
		}
	})
}

// compress content of .log file to .gz.b64 in the same directory
lib.compress = function(logId, newFileId, callback) {
	var sourceFile = logId+".log"
	var destinationFile = newFileId+".gz.b64"

	// read source file
	fs.readFile(lib.baseDir+sourceFile, 'utf8', function(err, data) {
		// compress data using gzip
		zlib.gzip(data, function(err, buffer) {
			if(!err && buffer) {
				// Send data (buffer) to destination file
				fs.open(lib.baseDir+destinationFile, 'wx', function(err, fileDescriptor) {
					if(!err & fileDescriptor) {
						// write to file
						fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
							if(!err) {
								fs.close(fileDescriptor, function(err) {
									if(!err) {
										callback(false)
									}else {
										callback(err)
									}
								})
							}else {
								callback(err)
							}
						})
					}else {
						callback(err)
					}
				})
			}else {
				callback(err)
			}
		})
	})
}

// decompress file for reading
lib.decompress = function(fileId, callback) {
	var fileName = fileId+".gz.b64"

	fs.readFile(lib.baseDir+fileName, 'utf-8', function(err, str) {
		if(!err & str) {
			// Decompress data
			var inputBuffer = Buffer.from(str, 'base64');
			zlib.unzip(inputBuffer, function(err, outputBuffer) {
				if(!err && outputBuffer) {
					var str = outputBuffer.toString()
					callback(false, str)
				}else {
					callback(err)
				}
			})
		}else {
			callback(err)
		}
	})
}


lib.truncate = function(logId, callback) {
	fs.truncate(lib.baseDir+logId+".log", 0, function(err) {
		if(!err) {
			callback(false)
		}else {
			callback(err)
		}
	})
}















module.exports = lib