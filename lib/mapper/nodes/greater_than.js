var util = require('util');
var Binary = require('./binary');

var GreaterThan = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'GreaterThan';
};

util.inherits(GreaterThan, Binary);
module.exports = GreaterThan;
