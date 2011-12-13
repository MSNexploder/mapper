var util = require('util');
var Function = require('./function');

var Min = function(expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'Min';
};

util.inherits(Min, Function);
module.exports = Min;
