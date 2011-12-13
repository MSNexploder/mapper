var util = require('util');
var _ = require('underscore');
var SQL = require('./sql');

var OrderClauses = function() {
    SQL.call(this);
    this.class_name = 'OrderClauses';
};

util.inherits(OrderClauses, SQL);
module.exports = OrderClauses;

OrderClauses.prototype.visitSelectStatementNode = function(object) {
    var self = this;
    return _.map(object.orders, function(val) {
        return self.visit(val);
    });
};
