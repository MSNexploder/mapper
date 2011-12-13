var util = require('util');
var Binary = require('./binary');

var Matches = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'Matches';
};

util.inherits(Matches, Binary);
module.exports = Matches;
