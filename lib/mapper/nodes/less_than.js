var util = require('util');
var Binary = require('./binary');

var LessThan = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'LessThan';
};

util.inherits(LessThan, Binary);
module.exports = LessThan;
