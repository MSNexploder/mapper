var util = require('util');
var Node = require('./node');

var Lock = function() {
    Node.call(this);
    this.class_name = 'Lock';
};

util.inherits(Lock, Node);
module.exports = Lock;
