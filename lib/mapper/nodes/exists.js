var util = require('util');
var Function = require('./function');

var Exists = function(expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'Exists';
};

util.inherits(Exists, Function);
module.exports = Exists;
