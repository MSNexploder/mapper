var util = require('util');
var Binary = require('./binary');

var Equality = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'Equality';
};

util.inherits(Equality, Binary);
module.exports = Equality;
