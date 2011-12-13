var util = require('util');
var Node = require('./node');

var Unary = function(expr) {
    Node.call(this);
    this.class_name = 'Unary';
    
    this.expr = expr;
};

util.inherits(Unary, Node);
module.exports = Unary;
