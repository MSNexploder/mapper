var util = require('util');
var Function = require('./function');

var Sum = function(expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'Sum';
};

util.inherits(Sum, Function);
module.exports = Sum;
