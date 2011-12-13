var util = require('util');
var Unary = require('./unary');

var UnqualifiedColumn = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'UnqualifiedColumn';
};

util.inherits(UnqualifiedColumn, Unary);
module.exports = UnqualifiedColumn;
