var util = require('util');
var Node = require('./node');

var Binary = function(left, right) {
    Node.call(this);
    this.class_name = 'Binary';
    
    this.left = left;
    this.right = right;
};

util.inherits(Binary, Node);
module.exports = Binary;
