var util = require('util');
var Binary = require('./binary');

var NotEqual = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'NotEqual';
};

util.inherits(NotEqual, Binary);
module.exports = NotEqual;
