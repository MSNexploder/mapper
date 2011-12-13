var util = require('util');
var Node = require('./node');
var JoinSource = require('./join_source');

var SelectCore = function() {
    Node.call(this);
    this.class_name = 'SelectCore';
    
    this.source = new JoinSource();
    this.projections = [];
    this.wheres = [];
    this.groups = [];
    this.having = undefined;
};

util.inherits(SelectCore, Node);
module.exports = SelectCore;

SelectCore.prototype.froms = function() {
    return this.source.right;
};
