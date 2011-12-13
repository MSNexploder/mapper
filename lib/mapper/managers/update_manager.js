var util = require('util');
var _ = require('underscore');
var UpdateStatement = require('../nodes').UpdateStatement;
var Assignment = require('../nodes').Assignment;
var UnqualifiedColumn = require('../nodes').UnqualifiedColumn;
var Limit = require('../nodes').Limit;
var TreeManager = require('./tree_manager');

var UpdateManager = function(connection) {
    TreeManager.call(this, connection);
    this.class_name = 'UpdateManager';

    this.ast = new UpdateStatement();
};

util.inherits(UpdateManager, TreeManager);
module.exports = UpdateManager;

UpdateManager.prototype.take = function(limit) {
    this.ast.limit = new Limit(limit);
    return this;
};

UpdateManager.prototype.key = function(key) {
    this.ast.key = key;
    return this;
};

UpdateManager.prototype.order = function(expr) {
    this.ast.orders = expr;
    return this;
};

UpdateManager.prototype.table = function(table) {
    this.ast.relation = table;
    return this;
};

UpdateManager.prototype.wheres = function(exprs) {
    this.ast.wheres = exprs;
    return this;
};

UpdateManager.prototype.where = function(expr) {
    this.ast.wheres.push(expr);
    return this;
};

// values = [[<column>, <value>], [<column>, <value>]]
UpdateManager.prototype.set = function(values) {
    if (_.isArray(values)) {
        this.ast.values = _.map(values, function(val) {
            return new Assignment(new UnqualifiedColumn(val[0]), val[1]);
        });
    } else {
        this.ast.values = [values];
    }
    return this;
};
