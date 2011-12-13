var util = require('util');
var Binary = require('./binary');

var OuterJoin = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'OuterJoin';
};

util.inherits(OuterJoin, Binary);
module.exports = OuterJoin;
