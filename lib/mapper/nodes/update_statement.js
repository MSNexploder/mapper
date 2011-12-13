var util = require('util');
var Node = require('./node');

var UpdateStatement = function(key) {
    Node.call(this);
    this.class_name = 'UpdateStatement';
    
    this.relation = undefined;
    this.wheres = [];
    this.values = [];
    this.orders = [];
    this.limit = undefined;
    this.key = key;
};

util.inherits(UpdateStatement, Node);
module.exports = UpdateStatement;
