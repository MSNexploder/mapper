var util = require('util');
var _ = require('underscore');
var SQL = require('./sql');
var Limit = require('../nodes/limit');

var SQLite = function() {
    SQL.call(this);
    this.class_name = 'SQLite';
};

util.inherits(SQLite, SQL);
module.exports = SQLite;

SQLite.prototype.visitSelectStatementNode = function(object) {
    if (!_.isEmpty(object.offset) && _.isEmpty(object.limit)) {
        object.limit = new Limit(-1);
    }
    return SQL.prototype.visitSelectStatementNode.call(this, object);
};

SQLite.prototype.quoteColumnName = function(column) {
    return '"' + column + '"';
};
