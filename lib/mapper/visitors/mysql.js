var util = require('util');
var _ = require('underscore');
var SQL = require('./sql');
var Limit = require('../nodes/limit');
var SqlLiteral = require('../nodes/sql_literal');

var MySQL = function() {
    SQL.call(this);
    this.class_name = 'MySQL';
};

util.inherits(MySQL, SQL);
module.exports = MySQL;

// http://dev.mysql.com/doc/refman/5.0/en/select.html#id3482214
MySQL.prototype.visitSelectStatementNode = function(object) {
    if (!_.isEmpty(object.offset) && _.isEmpty(object.limit)) {
        object.limit = new Limit(18446744073709552000);
    }
    return SQL.prototype.visitSelectStatementNode.call(this, object);
};

MySQL.prototype.visitSelectCoreNode = function(object) {
    object.source.left = object.source.left || new SqlLiteral('DUAL');
    return SQL.prototype.visitSelectCoreNode.call(this, object);
};

MySQL.prototype.visitLockNode = function(object) {
    return 'FOR UPDATE';
};

MySQL.prototype.visitUpdateStatementNode = function(object) {
    var self = this;
    var values = _.map(object.values, function(val) { return self.visit(val); });
    var wheres = _.map(object.wheres, function(val) { return self.visit(val); });
    var orders = _.map(object.orders, function(val) { return self.visit(val); }); 
    
    return _.compact([
        'UPDATE ' + this.visit(object.relation),
        (!_.isEmpty(values)) ? 'SET ' + values.join(', ') : undefined,
        (!_.isEmpty(wheres)) ? 'WHERE ' + wheres.join(' AND ') : undefined,
        (!_.isEmpty(orders)) ? 'ORDER BY ' + orders.join(', ') : undefined,
        (!_.isEmpty(object.limit)) ? this.visit(object.limit) : undefined,
    ]).join(' ');
};

MySQL.prototype.quoteColumnName = function(column) {
    return '`' + column + '`';
};

MySQL.prototype.quoteTableName = function(table) {
    return this.quoteColumnName(table).replace('.', '`.`');
};

MySQL.prototype.visitundefinedNode = function(object) {
    if (typeof(object) == 'boolean') {
        return object ? this.quoteString('1') : this.quoteString('0');
    }
    return SQL.prototype.visitundefinedNode.call(this, object);
};
