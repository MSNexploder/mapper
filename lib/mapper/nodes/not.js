var util = require('util');
var Unary = require('./unary');

var Not = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Not';
};

util.inherits(Not, Unary);
module.exports = Not;
