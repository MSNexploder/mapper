var util = require('util');
var _ = require('underscore');
var Unary = require('./unary');
var SqlLiteral = require('./sql_literal');

var Function = function(expr, alias) {
    Unary.call(this, expr);
    this.class_name = 'Function';
    
    this.alias = alias;
    this.distinct = false;
};

util.inherits(Function, Unary);
module.exports = Function;

Function.prototype.as = function(alias) {
    this.alias = alias;
    if (_.isString(alias)) {
        this.alias = new SqlLiteral(alias);
    }
    return this;
};
