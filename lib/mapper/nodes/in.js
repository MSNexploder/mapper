var util = require('util');
var Binary = require('./binary');

var In = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'In';
};

util.inherits(In, Binary);
module.exports = In;
