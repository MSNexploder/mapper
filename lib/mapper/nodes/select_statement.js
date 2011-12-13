var util = require('util');
var Node = require('./node');
var SelectCore = require('./select_core');

var SelectStatement = function(core) {
    Node.call(this);
    this.class_name = 'SelectStatement';
    
    this.core = core || new SelectCore();
    this.orders = [];
    this.limit = undefined;
    this.lock = undefined;
    this.offset = undefined;
};

util.inherits(SelectStatement, Node);
module.exports = SelectStatement;
