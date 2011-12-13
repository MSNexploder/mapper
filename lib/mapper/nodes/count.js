var util = require('util');
var Function = require('./function');

var Count = function(exprs, distinct, alias) {
    Function.call(this, exprs, alias);
    this.class_name = 'Count';
    
    this.distinct = distinct;
};

util.inherits(Count, Function);
module.exports = Count;
