var util = require('util');
var Binary = require('./binary');

var Ordering = function(expr, direction) {
    Binary.call(this, expr, direction || 'ASC');
    this.class_name = 'Ordering';
};

util.inherits(Ordering, Binary);
module.exports = Ordering;
