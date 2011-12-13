var util = require('util');
var Node = require('./node');

var DeleteStatement = function(relation, wheres) {
    Node.call(this);
    this.class_name = 'DeleteStatement';
    
    this.relation = relation;
    this.wheres = wheres || [];
};

util.inherits(DeleteStatement, Node);
module.exports = DeleteStatement;
