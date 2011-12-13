var util = require('util');
var Binary = require('./binary');

var InnerJoin = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'InnerJoin';
};

util.inherits(InnerJoin, Binary);
module.exports = InnerJoin;
