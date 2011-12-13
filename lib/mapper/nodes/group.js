var util = require('util');
var Unary = require('./unary');

var Group = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Group';
};

util.inherits(Group, Unary);
module.exports = Group;
