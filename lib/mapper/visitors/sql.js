var util = require('util');
var _ = require('underscore');
var Visitor = require('./visitor');
var SelectStatement = require('../nodes/select_statement');
var In = require('../nodes/in');

var SQL = function() {
    Visitor.call(this);
    this.class_name = 'SQL';
};

util.inherits(SQL, Visitor);
module.exports = SQL;

SQL.prototype.visitSelectStatementNode = function(object) {
    var self = this;
    var orders = _.map(object.orders, function(val) {
        if (!_.isString(val)) {
            val = self.visit(val);
        }
        return val;
    });

    return _.compact([
        this.visit(object.core),
        (!_.isEmpty(orders)) ? 'ORDER BY ' + orders.join(', ') : undefined,
        (!_.isEmpty(object.limit)) ? this.visit(object.limit) : undefined,
        (!_.isEmpty(object.offset)) ? this.visit(object.offset) : undefined,
        (!_.isEmpty(object.lock)) ? this.visit(object.lock) : undefined,
    ]).join(' ');
};

SQL.prototype.visitDeleteStatementNode = function(object) {
    var self = this;
    var wheres = _.map(object.wheres, function(val) {
        return self.visit(val);
    });

    return _.compact([
        'DELETE FROM ' + this.visit(object.relation),
        (!_.isEmpty(wheres)) ? 'WHERE ' + wheres.join(' AND ') : undefined,
    ]).join(' ');
};

SQL.prototype.visitUpdateStatementNode = function(object) {
    var self = this;
    var tmp_wheres;
    if ((_.isEmpty(object.orders)) && (_.isEmpty(object.limit))) {
        tmp_wheres = object.wheres;
    } else {
        var stmt = new SelectStatement();
        stmt.core.froms = object.relation;
        stmt.core.projections = [object.key];
        stmt.limit = object.limit;
        stmt.orders = object.orders;

        tmp_wheres = [new In(object.key, [stmt])];
    }

    var values = _.map(object.values, function(val) { return self.visit(val); });
    var wheres = _.map(tmp_wheres, function(val) { return self.visit(val); });

    return _.compact([
        'UPDATE ' + this.visit(object.relation),
        (!_.isEmpty(values)) ? 'SET ' + values.join(', ') : undefined,
        (!_.isEmpty(wheres)) ? 'WHERE ' + wheres.join(' AND ') : undefined,
    ]).join(' ');
};

SQL.prototype.visitInsertStatementNode = function(object) {
    var self = this;
    var columns = _.map(object.columns, function(val) { return self.quoteColumnName(val.right); });

    return _.compact([
        'INSERT INTO ' + this.visit(object.relation),
        (!_.isEmpty(columns)) ? '(' + columns.join(', ') + ')' : undefined,
        (!_.isEmpty(object.values)) ? this.visit(object.values) : undefined,
    ]).join(' ');
};

SQL.prototype.visitSelectCoreNode = function(object) {
    var self = this;
    var projections = _.map(object.projections, function(val) {
        if (!_.isString(val)) {
            val = self.visit(val);
        }
        return val;
    });
    var wheres = _.map(object.wheres, function(val) {
        return self.visit(val);
    });
    var groups = _.map(object.groups, function(val) {
        if (!_.isString(val)) {
            val = self.visit(val);
        }
        return val;
    });

    return _.compact([
        (!_.isEmpty(projections)) ? 'SELECT ' + projections.join(', ') : 'SELECT',
        this.visit(object.source),
        (!_.isEmpty(wheres)) ? 'WHERE ' + wheres.join(' AND ') : undefined,
        (!_.isEmpty(groups)) ? 'GROUP BY ' + groups.join(', ') : undefined,
        (!_.isEmpty(object.having)) ? this.visit(object.having) : undefined,
    ]).join(' ');
};

SQL.prototype.visitHavingNode = function(object) {
    var self = this;
    return 'HAVING ' + _.map(object.expr, function(expr) {
        if (!_.isString(expr)) {
            expr = self.visit(expr);
        }
        return expr;
    }).join(', ');
};

SQL.prototype.visitOffsetNode = function(object) {
    return 'OFFSET ' + this.visit(object.expr);
};

// implemented in subclasses
SQL.prototype.visitLockNode = function(object) {
    return undefined;
};

SQL.prototype.visitValuesNode = function(object) {
    var self = this;
    var columns = _.map(_.zip(object.left, object.right), function(val) {
        return self.quote(val[0], val[1] && self.columnFor(val[1]));
    });

    return 'VALUES (' + columns.join(', ') + ')';
};

SQL.prototype.visitInNode = function(object) {
    return this.visit(object.left) + ' IN ' + this.visit(object.right);
};

SQL.prototype.visitNotInNode = function(object) {
    return this.visit(object.left) + ' NOT IN ' + this.visit(object.right);
};

SQL.prototype.visitAttributeNode = function(object) {
    var column;
    if (_.isString(object.right)) {
        column = this.quoteColumnName(object.right);
    } else {
        column = this.visit(object.right);
    }
    var join_name = object.left.left || object.left.name;

    return this.quoteTableName(join_name) + '.' + column;
};

SQL.prototype.visitJoinSourceNode = function(object) {
    var self = this;

    return _.compact([
        (!_.isEmpty(object.left)) ? 'FROM ' + this.visit(object.left) : undefined,
        _.map(object.right, function(val) { return self.visit(val); }).join(' '),
    ]).join(' ');
};

SQL.prototype.visitSqlLiteralNode = function(object) {
    return object.val;
};

SQL.prototype.visitTableNode = function(object) {
    if (object.table_alias) {
        return this.quoteTableName(object.name) + ' ' + this.quoteTableName(object.table_alias);
    } else {
        return this.quoteTableName(object.name);
    }
};

SQL.prototype.visitAsNode = function(object) {
    return this.visit(object.left) + ' AS ' + this.visit(object.right);
};

SQL.prototype.visitBetweenNode = function(object) {
    return this.visit(object.left) + ' BETWEEN ' + this.visit(object.right);
};

SQL.prototype.visitDoesNotMatchNode = function(object) {
    return this.visit(object.left) + ' NOT LIKE ' + this.visit(object.right);
};

SQL.prototype.visitMatchesNode = function(object) {
    return this.visit(object.left) + ' LIKE ' + this.visit(object.right);
};

SQL.prototype.visitGreaterThanNode = function(object) {
    return this.visit(object.left) + ' > ' + this.visit(object.right);
};

SQL.prototype.visitGreaterThanOrEqualNode = function(object) {
    return this.visit(object.left) + ' >= ' + this.visit(object.right);
};

SQL.prototype.visitLessThanNode = function(object) {
    return this.visit(object.left) + ' < ' + this.visit(object.right);
};

SQL.prototype.visitLessThanOrEqualNode = function(object) {
    return this.visit(object.left) + ' <= ' + this.visit(object.right);
};

SQL.prototype.visitLimitNode = function(object) {
    return 'LIMIT ' + this.visit(object.expr);
};

SQL.prototype.visitNotEqualNode = function(object) {
    if (_.isNull(object.right) || _.isUndefined(object.right)) {
        return this.visit(object.left) + ' IS NOT NULL';
    } else {
        return this.visit(object.left) + ' != ' + this.visit(object.right);
    }
};

SQL.prototype.visitEqualityNode = function(object) {
    if (_.isNull(object.right) || _.isUndefined(object.right)) {
        return this.visit(object.left) + ' IS NULL';
    } else {
        return this.visit(object.left) + ' = ' + this.visit(object.right);
    }
};

SQL.prototype.visitNotNode = function(object) {
    return 'NOT (' + this.visit(object.expr) + ')';
};

SQL.prototype.visitAndNode = function(object) {
    var self = this;
    return _.map(object.children, function(val) { return self.visit(val); }).join(' AND ');
};

SQL.prototype.visitOrNode = function(object) {
    var self = this;
    return _.map(object.children, function(val) { return self.visit(val); }).join(' OR ');
};

SQL.prototype.visitOrderingNode = function(object) {
    return this.visit(object.left) + ' ' + object.right;
};

SQL.prototype.visitGroupingNode = function(object) {
    return '(' + this.visit(object.expr) + ')';
};

SQL.prototype.visitGroupNode = function(object) {
    return this.visit(object.expr);
};

SQL.prototype.visitOnNode = function(object) {
    return 'ON ' + this.visit(object.expr);
};

SQL.prototype.visitUnqualifiedColumnNode = function(object) {
    return this.quoteColumnName(object.expr.right);
};

SQL.prototype.visitStringJoinNode = function(object) {
    return this.visit(object.left);
};

SQL.prototype.visitExistsNode = function(object) {
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    return 'EXISTS(' + this.visit(object.expr) + ')' + alias;
};

SQL.prototype.visitSumNode = function(object) {
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    return 'SUM(' + this.visit(object.expr) + ')' + alias;
};

SQL.prototype.visitMaxNode = function(object) {
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    return 'MAX(' + this.visit(object.expr) + ')' + alias;
};

SQL.prototype.visitMinNode = function(object) {
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    return 'MIN(' + this.visit(object.expr) + ')' + alias;
};

SQL.prototype.visitAvgNode = function(object) {
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    return 'AVG(' + this.visit(object.expr) + ')' + alias;
};

SQL.prototype.visitOuterJoinNode = function(object) {
    return 'LEFT OUTER JOIN ' + this.visit(object.left) + ' ' + this.visit(object.right);
};

SQL.prototype.visitInnerJoinNode = function(object) {
    return _.compact([
        'INNER JOIN',
        this.visit(object.left),
        (!_.isEmpty(object.right)) ? this.visit(object.right) : undefined,
    ]).join(' ');
};

SQL.prototype.visitNamedFunctionNode = function(object) {
    var distinct = object.distinct ? 'DISTINCT ' : '';
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    var expressions = this.visit(object.expr);

    return object.name + '(' + distinct + expressions + ')' + alias;
};

SQL.prototype.visitCountNode = function(object) {
    var distinct = object.distinct ? 'DISTINCT ' : '';
    var alias = object.alias ? ' AS ' + this.visit(object.alias) : '';
    var expressions = this.visit(object.expr);

    return 'COUNT(' + distinct + expressions + ')' + alias;
};

SQL.prototype.visitTableAliasNode = function(object) {
    return this.visit(object.right) + ' ' + this.quoteTableName(object.left);
};

SQL.prototype.visitAssignmentNode = function(object) {
    return this.visit(object.left) + ' = ' + this.quote(object.right, this.columnFor(object.left));
};

// TODO maybe be smarter about given object
// used for "simple" objects without 'class_name' attribute
SQL.prototype.visitundefinedNode = function(object) {
    var self = this;
    switch (typeof(object)) {
        case 'boolean': return object ? this.quoteString('t') : this.quoteString('f');
        case 'number':
            if (parseFloat(object) != parseInt(object, 10)) {
                return this.quoteString(object.toString());
            }
            return object;
        case 'string': return this.quoteString(object);
        case 'undefined': return 'NULL';
        case 'object':
            if (_.isArray(object)) {
                if (_.isEmpty(object)) {
                    return 'NULL';
                } else {
                    return _.map(object, function(val) { return self.visit(val); }).join(', ');
                }
            } else if (_.isDate(object)) {
                return this.quoteString(object.toUTCString());
            } else if (_.isNull(object)) {
                return 'null';
            }
            return object.toString();
        case 'function': return object();
        default: return object;
    }
};

SQL.prototype.quoteTableName = function(name) {
    return this.quoteColumnName(name);
};

SQL.prototype.quoteColumnName = function(column) {
    if (column.class_name == column) {
        return column;
    } else {
        return '"' + column + '"';
    }
};

SQL.prototype.columnFor = function(attr) {
    // TODO
    // needed real quoting in every visitor
    return attr;
};

SQL.prototype.quote = function(value, column) {
    // TODO
    // needed real quoting in every visitor
    return this.visit(value);
};

SQL.prototype.quoteString = function(string) {
    return "'" + string.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
};
