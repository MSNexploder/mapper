var util = require('util');
var Binary = require('./binary');

var GreaterThanOrEqual = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'GreaterThanOrEqual';
};

util.inherits(GreaterThanOrEqual, Binary);
module.exports = GreaterThanOrEqual;
