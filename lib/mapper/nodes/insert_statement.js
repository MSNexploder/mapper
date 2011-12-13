var util = require('util');
var Node = require('./node');

var InsertStatement = function() {
    Node.call(this);
    this.class_name = 'InsertStatement';
    
    this.relation = undefined;
    this.columns = [];
    this.values = undefined;
};

util.inherits(InsertStatement, Node);
module.exports = InsertStatement;
