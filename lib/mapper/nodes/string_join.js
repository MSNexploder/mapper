var util = require('util');
var Binary = require('./binary');

var StringJoin = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'StringJoin';
};

util.inherits(StringJoin, Binary);
module.exports = StringJoin;
