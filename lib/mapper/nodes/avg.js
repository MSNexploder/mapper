var util = require('util');
var Function = require('./function');

var Avg = function(expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'Avg';
};

util.inherits(Avg, Function);
module.exports = Avg;
