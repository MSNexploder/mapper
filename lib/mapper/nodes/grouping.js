var util = require('util');
var Unary = require('./unary');

var Grouping = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Grouping';
};

util.inherits(Grouping, Unary);
module.exports = Grouping;
