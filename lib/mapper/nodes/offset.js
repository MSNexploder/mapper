var util = require('util');
var Unary = require('./unary');

var Offset = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Offset';
};

util.inherits(Offset, Unary);
module.exports = Offset;
