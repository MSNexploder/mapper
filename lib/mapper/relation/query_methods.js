// Module dependencies.
var _ = require('underscore');
var nodes = require('../nodes');
var Relation = require('../relation');

Relation.prototype.arel = function() {
    this._arel = this._arel || this.buildArel();
    return this._arel;
};

Relation.prototype.buildArel = function() {
    var self = this;
    var arel = this.table;

    _.each(_.uniq(this.where_values), function(where) {
        arel = arel.where(new nodes.Grouping(self.buildWhereClause(where)));
    });

    if (!_.isEmpty(this.order_values)) {
        arel = arel.order(_.uniq(this.order_values));
    }

    if (!_.isEmpty(this.group_values)) {
        arel = arel.group(_.uniq(this.group_values));
    }

    if (!_.isEmpty(this.having_values)) {
        arel = arel.having(_.uniq(this.having_values));
    }

    if (undefined !== this.limit_value) {
        arel = arel.take(this.sanitizeLimit(this.limit_value));
    }

    if (undefined !== this.offset_value) {
        arel = arel.skip(this.offset_value);
    }

    if (undefined !== this.from_value) {
        arel = arel.skip(this.from_value);
    }

    if (undefined !== this.lock_value) {
        arel = arel.skip(this.lock_value);
    }

    arel = this.buildSelect(arel, _.uniq(this.select_values));

    return arel;
};

Relation.prototype.where = function(opts, rest) {
    var relation = this.clone();
    if (opts) {
        relation.where_values = relation.where_values.concat(this.buildWhere(opts, rest));
    }
    return relation;
};

Relation.prototype.select = function(value) {
    var relation = this.clone();
    relation.select_values = relation.select_values.concat(_.compact(_.flatten([value])));
    return relation;
};

Relation.prototype.lock = function(condition) {
    var relation = this.clone();
    relation.lock_value = condition;
    return relation;
};

Relation.prototype.exists = function(condition) {
    var relation = this.clone();
    relation.exists_value = condition;
    return relation;
};

Relation.prototype.limit = function(value) {
    var relation = this.clone();
    relation.limit_value = value;
    return relation;
};

Relation.prototype.group = function(args) {
    var relation = this.clone();
    relation.group_values = relation.group_values.concat(_.compact(_.flatten([args])));
    return relation;
};

Relation.prototype.order = function(args) {
    var relation = this.clone();
    relation.order_values = relation.order_values.concat(_.compact(_.flatten([args])));
    return relation;
};

Relation.prototype.having = function(args) {
    var relation = this.clone();
    relation.having_values = relation.having_values.concat(this.buildWhere(_.flatten([args])));
    return relation;
};

Relation.prototype.offset = function(value) {
    var relation = this.clone();
    relation.offset_value = value;
    return relation;
};

// Sanitizes the given LIMIT parameter in order to prevent SQL injection.
//
// The `limit` may be anything that can evaluate to a string via #toString. It
// should look like an integer, or a comma-delimited list of integers, or
// an SQL literal.
//
// Returns Integer and SqlLiteral limits as is.
// Returns the sanitized limit parameter, either as an integer, or as a
// string which contains a comma-delimited list of integers.
//
Relation.prototype.sanitizeLimit = function(limit) {
    if (_.isInt(limit) && _.isNumber(limit) || limit.class_name == 'SqlLiteral') {
        return limit;
    } else if (limit.toString().match(/,/)) {
        var sql = _.compact(_.map(limit.toString().split(','), function(val) {
            var lim = parseInt(val, 10);
            if (_.isNaN(lim)) { return undefined; }
            return lim;
        })).join(',');
        return nodes.sql(sql);
    } else {
        return parseInt(limit, 10);
    }
};

Relation.prototype.buildWhere = function(opts, other) {
    other = other || [];
    var values = _.isEmpty(other) ? opts : [opts].concat(other);

    return [this.klass.sanitizeSql(values)];
};

Relation.prototype.buildWhereClause = function(clause) {
    var table = this.table;

    if (_.isString(clause)) {
        return nodes.sql(clause);
    } else if (undefined !== clause.class_name) {
        return clause;
    } else {
        var values = _.map(_.keys(clause), function(key) {
            var value = clause[key];
            var regex = /^(.+)_(eq|not|neq|noteq|notEq|gt|gte|gteq|gtEq|lt|lte|lteq|ltEq|like|nlike|notlike|notLike|in|nin|notin|notIn)$/;
            var matches = key.match(regex);
            if (null === matches) {
                if (_.isArray(value)) {
                    return table.column(key).in(value);
                } else {
                    return table.column(key).eq(value);
                }
            } else {
                key = matches[1];
                matches = matches[2];
                return Relation.whereForAttributes(table, key, value, matches);
            }
        });
        switch (values.length) {
            case 0: return undefined;
            case 1: return values;
            default: return values;
        }
    }
};

Relation.prototype.buildSelect = function(arel, selects) {
    var table = this.table;
    if (_.isEmpty(selects)) {
        return arel.project(new nodes.SqlLiteral(this.klass.quotedTableName() + '.*'));
    } else {
        return arel.project(_.map(_.compact(_.flatten([selects])), function(val) {
            if (undefined !== val.class_name) {
                return val;
            }
            return table.column(val);
        }));
    }
};

Relation.prototype.reverseOrder = function() {
    var order_clause = this.arel().order_clauses;
    var order;

    if (_.isEmpty(order_clause)) {
        order = this.klass.tableName() + '.' + this.klass.primary_key + ' DESC';
    } else {
        order = this.reverseSqlOrder(order_clause).join(', ');
    }

    return this.except('order').order(order);
};

Relation.prototype.reverseSqlOrder = function(order_query) {
    order_query = order_query.join(', ').split(',');
    return _.map(order_query, function(s) {
        if (s.match(/\s(asc|desc)$/i) === null) {
            s = s.concat(' DESC');
        } else {
            s.gsub(/\sasc$/i, ' DESC');
            s.gsub(/\sdesc$/i, ' ASC');
        }
        return s;
    });
};

Relation.whereForAttributes = function(table, key, value, matches) {
    switch (matches) {
        case 'eq':
            return table.column(key).eq(value);
        case 'not':
        case 'neq':
        case 'noteq':
        case 'notEq':
            return table.column(key).notEq(value);
        case 'gte':
        case 'gteq':
        case 'gtEq':
            return table.column(key).gteq(value);
        case 'gt':
            return table.column(key).gt(value);
        case 'lte':
        case 'lteq':
        case 'ltEq':
            return table.column(key).lteq(value);
        case 'lt':
            return table.column(key).lt(value);
        case 'like':
            return table.column(key).matches(value);
        case 'nlike':
        case 'notlike':
        case 'notLike':
            return table.column(key).doesNotMatch(value);
        case 'in':
            return table.column(key).in(value);
        case 'nin':
        case 'notin':
        case 'notIn':
            return table.column(key).notIn(value);
        default:
            return table.column(key).eq(value);
    }
};