var util = require('util');
var Binary = require('./binary');

var As = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'As';
};

util.inherits(As, Binary);
module.exports = As;
