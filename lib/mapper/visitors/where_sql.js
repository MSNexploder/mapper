var util = require('util');
var _ = require('underscore');
var SQL = require('./sql');

var WhereSql = function() {
    SQL.call(this);
    this.class_name = 'WhereSql';
};

util.inherits(WhereSql, SQL);
module.exports = WhereSql;

WhereSql.prototype.visitSelectCoreNode = function(object) {
    var self = this;
    return 'WHERE ' + _.map(object.wheres, function(val) {
        return self.visit(val);
    }).join(' AND ');
};
