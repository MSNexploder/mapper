var util = require('util');
var Binary = require('./binary');

var LessThanOrEqual = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'LessThanOrEqual';
};

util.inherits(LessThanOrEqual, Binary);
module.exports = LessThanOrEqual;
