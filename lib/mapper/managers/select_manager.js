var util = require('util');
var _ = require('underscore');
var SelectStatement = require('../nodes').SelectStatement;
var Offset = require('../nodes').Offset;
var Exists = require('../nodes').Exists;
var Lock = require('../nodes').Lock;
var InnerJoin = require('../nodes').InnerJoin;
var OuterJoin = require('../nodes').OuterJoin;
var StringJoin = require('../nodes').StringJoin;
var Having = require('../nodes').Having;
var On = require('../nodes').On;
var And = require('../nodes').And;
var Limit = require('../nodes').Limit;
var SqlLiteral = require('../nodes').SqlLiteral;
var OrderClauses = require('../visitors').OrderClauses;
var WhereSql = require('../visitors').WhereSql;
var TreeManager = require('./tree_manager');
var FactoryMethods = require('../factory_methods');

var SelectManager = function(connection, table) {
    TreeManager.call(this, connection);
    this.class_name = 'SelectManager';

    this.ast = new SelectStatement();
    this.from(table);
};

util.inherits(SelectManager, TreeManager);
module.exports = SelectManager;

_.extend(SelectManager.prototype, FactoryMethods.prototype);

SelectManager.prototype.exists = function() {
    return new Exists(this.ast);
};

SelectManager.prototype.froms = function() {
    return this.ast.core.froms();
};

SelectManager.prototype.skip = function(amount) {
    this.ast.offset = new Offset(amount);
    return this;
};

SelectManager.prototype.lock = function(locking) {
    locking = locking || true;
    if (locking) {
        this.ast.lock = new Lock();
    } else {
        this.ast.lock = undefined;
    }
    return this;
};

SelectManager.prototype.taken = function() {
    if (this.ast.limit) {
        return this.ast.limit.expr;
    }
};

SelectManager.prototype.take = function(limit) {
    this.ast.limit = new Limit(limit);
    return this;
};

SelectManager.prototype.from = function(table) {
    if (undefined === table) { return; }

    switch (table.class_name) {
        case 'InnerJoin':
        case 'OuterJoin':
        case 'StringJoin':
            this.ast.core.source.right.push(table);
            break;
        case 'SqlLiteral':
            this.ast.core.source.left = table;
            break;
        default:
            this.ast.core.source.left = table;
    }

    return this;
};

SelectManager.prototype.join = function(relation, klass) {
    if (undefined === relation) {
        return this;
    }

    klass = klass || 'InnerJoin';
    switch (relation.class_name) {
        case 'SqlLiteral':
            klass = 'StringJoin';
            break;
        case 'undefined':
            if (_.isString(relation)) {
                klass = 'StringJoin';
            }
            break;
    }

    var new_join;
    switch (klass) {
        case 'InnerJoin':
            new_join = new InnerJoin(relation);
            break;
        case 'OuterJoin':
            new_join = new OuterJoin(relation);
            break;
        case 'StringJoin':
            new_join = new StringJoin(relation);
            break;
    }
    this.ast.core.source.right.push(new_join);
    return this;
};

SelectManager.prototype.having = function(exprs) {
    if (!_.isArray(exprs)) {
        exprs = [exprs];
    }

    this.ast.core.having = new Having(exprs);
    return this;
};

SelectManager.prototype.orders = function() {
    return this.ast.orders;
};

SelectManager.prototype.order = function(expr) {
    this.ast.orders = this.ast.orders.concat(expr);
    return this;
};

SelectManager.prototype.orderClauses = function() {
    var visitor = new OrderClauses();
    return _.map(visitor.visit(this.ast), function(val) {
        return new SqlLiteral(val);
    });
};

SelectManager.prototype.projections = function() {
    return this.ast.core.projections;
};

SelectManager.prototype.project = function(projections) {
    this.ast.core.projections = this.ast.core.projections.concat(projections);
    return this;
};

SelectManager.prototype.group = function(columns) {
    this.ast.core.groups = this.ast.core.groups.concat(columns);
    return this;
};

SelectManager.prototype.on = function(exprs) {
    if (!_.isArray(exprs)) {
        exprs = [exprs];
    }
    _.last(this.ast.core.source.right).right = new On(new And(exprs));
    return this;
};

SelectManager.prototype.wheres = function(exprs) {
    this.ast.core.wheres = exprs;
    return this;
};

SelectManager.prototype.where = function(expr) {
    this.ast.core.wheres.push(expr);
    return this;
};

SelectManager.prototype.whereSql = function() {
    if (_.isEmpty(this.ast.core.wheres)) {
        return undefined;
    }

    var visitor = new WhereSql();
    return new SqlLiteral(visitor.visit(this.ast.core));
};
