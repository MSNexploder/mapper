var util = require('util');
var Node = require('./node');

var And = function(children) {
    Node.call(this);
    this.class_name = 'And';
    
    this.children = children;
};

util.inherits(And, Node);
module.exports = And;
