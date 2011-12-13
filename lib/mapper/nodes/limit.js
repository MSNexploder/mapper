var util = require('util');
var Unary = require('./unary');

var Limit = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Limit';
};

util.inherits(Limit, Unary);
module.exports = Limit;
