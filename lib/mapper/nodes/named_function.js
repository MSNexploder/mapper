var util = require('util');
var Function = require('./function');

var NamedFunction = function(name, expr, alias) {
    Function.call(this, expr, alias);
    this.class_name = 'NamedFunction';
    
    this.name = name;
};

util.inherits(NamedFunction, Function);
module.exports = NamedFunction;
