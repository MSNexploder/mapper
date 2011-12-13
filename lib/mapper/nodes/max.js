var util = require('util');
var Function = require('./function');

var Max = function(expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'Max';
};

util.inherits(Max, Function);
module.exports = Max;
