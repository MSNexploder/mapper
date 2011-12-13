var util = require('util');
var Binary = require('./binary');

var NotIn = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'NotIn';
};

util.inherits(NotIn, Binary);
module.exports = NotIn;
