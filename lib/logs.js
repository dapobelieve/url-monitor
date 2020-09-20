/**
 * Library for storing and rotating logs
 */

// Dependencies
var fs = require("fs")
var path = require("path")
var zlib = require("zlib")

var log = {}


module.exports = log