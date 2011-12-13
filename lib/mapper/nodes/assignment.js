var util = require('util');
var Binary = require('./binary');

var Assignment = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'Assignment';
};

util.inherits(Assignment, Binary);
module.exports = Assignment;
