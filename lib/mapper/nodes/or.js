var util = require('util');
var Node = require('./node');

var Or = function(children) {
    Node.call(this);
    this.class_name = 'Or';
    
    this.children = children;
};

util.inherits(Or, Node);
module.exports = Or;
