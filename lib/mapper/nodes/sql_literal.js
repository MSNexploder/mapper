var util = require('util');
var Node = require('./node');

var SqlLiteral = function(val) {
    Node.call(this);
    this.class_name = 'SqlLiteral';
    
    this.val = val;
};

util.inherits(SqlLiteral, Node);
module.exports = SqlLiteral;
