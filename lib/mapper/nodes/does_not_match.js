var util = require('util');
var Binary = require('./binary');

var DoesNotMatch = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'DoesNotMatch';
};

util.inherits(DoesNotMatch, Binary);
module.exports = DoesNotMatch;
