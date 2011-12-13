// Module dependencies.
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var nodes = require('../nodes');
var Relation = require('../relation');

// Count operates using three different approaches.
//
// * Count all: By not passing any parameters to count, it will return a count of all the rows for the model.
// * Count using column: By passing a column name to count, it will return a count of all the
//   rows for the model with supplied column present.
// * Count using options will find the row count matched by the options used.
//
// The third approach, count using options, accepts an option hash as the only parameter. The options are:
//
// #### Parameters
//
// * `conditions`: An SQL fragment like "administrator = 1" or [ "user_name = ?", username ].
//   See conditions in the intro to Base.
// * `joins`: Either an SQL fragment for additional joins like "LEFT JOIN comments ON comments.post_id = id"
//   (rarely needed) or named associations in the same form used for the `include` option, which will
//   perform an INNER JOIN on the associated table(s). If the value is a string, then the records
//   will be returned read-only since they will have attributes that do not correspond to the table's columns.
//   Pass `readonly: false` to override.
// * `include`: Named associations that should be loaded alongside using LEFT OUTER JOINs.
//   The symbols named refer to already defined associations. When using named associations, count
//   returns the number of DISTINCT items for the model you're counting.
//   See eager loading under Associations.
// * `order`: An SQL fragment like "created_at DESC, name" (really only used with GROUP BY calculations).
// * `group`: An attribute name by which the result should be grouped. Uses the GROUP BY SQL-clause.
// * `select`: By default, this is * as in SELECT * FROM, but can be changed if you, for example,
//   want to do a join but not include the joined columns.
// * `distinct`: Set this to true to make this a distinct calculation, such as
//   SELECT COUNT(DISTINCT posts.id) ...
// * `from` - By default, this is the table name of the class, but can be changed to an
//   alternate table name (or even the name of a database view).
//
// #### Emits
//
// Triggers an `value` event once the object count is evaluated.
//
// #### Examples
//
// Examples for counting all:
//     Person.count();      // returns the total count of all people
//
// Examples for counting by column:
//     Person.count('age'); // returns the total count of all people whose age is present in database
//
// Examples for count with options:
//     Person.count({conditions: "age > 26"});
//
//     // because of the named association, it finds the DISTINCT count using LEFT OUTER JOIN.
//     Person.count({conditions: "age > 26 AND job.salary > 60000", include: 'job'});
//
//     // finds the number of rows matching the conditions and joins.
//     Person.count({conditions: "age > 26 AND job.salary > 60000",
//                  joins: "LEFT JOIN jobs on jobs.person_id = person.id"});
//
//     Person.count('id', {:conditions => "age > 26"});  // Performs a COUNT(id)
//     Person.count('all', {:conditions => "age > 26"}); // Performs a COUNT(*) ('all' is an alias for '*')
//
// Note: `Person.count('all');` will not work because it will use `all` as the condition.
// Use Person.count instead.
//
Relation.prototype.count = function(column_name, options) {
    if (undefined === options && typeof(column_name) == 'object' || column_name == 'all') {
        options = column_name;
        column_name = undefined;
    }

    return this.calculate('count', column_name, options);
};

// Calculates the average value on a given column. Emits `undefined` if there's
// no row. See `calculate` for examples with options.
//
//     Person.average('age'); // => 35.8
//
Relation.prototype.average = function(column_name, options) {
    return this.calculate('average', column_name, options);
};

// Calculates the minimum value on a given column. Emits `undefined` if there's
// no row. See `calculate` for examples with options.
//
//     Person.minimum('age'); // => 7
//
Relation.prototype.minimum = function(column_name, options) {
    return this.calculate('minimum', column_name, options);
};

// Calculates the maximum value on a given column. Emits `undefined` if there's
// no row. See `calculate` for examples with options.
//
//     Person.maximum('age'); // => 93
//
Relation.prototype.maximum = function(column_name, options) {
    return this.calculate('maximum', column_name, options);
};

// Calculates the sum of values on a given column. Emits `undefined` if there's
// no row. See `calculate` for examples with options.
//
//     Person.sum('age'); // => 4562
//
Relation.prototype.sum = function(column_name, options) {
    return this.calculate('sum', column_name, options);
};

// This calculates aggregate values in the given column. Methods for count, sum, average,
// minimum, and maximum have been added as shortcuts. Options such as `conditions`,
// `order`, `group`, `having`, and `joins` can be passed to customize the query.
//
// #### Parameters
//
// * `conditions` - An SQL fragment like "administrator = 1" or [ "user_name = ?", username ].
//   See conditions in the intro to Base.
// * `include`: Eager loading, see Associations for details.  Since calculations don't load anything,
//   the purpose of this is to access fields on joined tables in your conditions, order, or group clauses.
// * `joins` - An SQL fragment for additional joins like "LEFT JOIN comments ON comments.post_id = id".
//   (Rarely needed).
//   The records will be returned read-only since they will have attributes that do not correspond to the
//   table's columns.
// * `order` - An SQL fragment like "created_at DESC, name" (really only used with GROUP BY calculations).
// * `group` - An attribute name by which the result should be grouped. Uses the GROUP BY SQL-clause.
// * `select` - By default, this is * as in SELECT * FROM, but can be changed if you for example
//   want to do a join, but not include the joined columns.
// * `distinct` - Set this to true to make this a distinct calculation, such as
//   SELECT COUNT(DISTINCT posts.id) ...
//
// #### Emits
//
// Triggers an `value` event once the object count is evaluated.
//
// #### Examples
//
//     Person.calculate('count, 'all'); // The same as Person.count();
//     Person.average('age'); // SELECT AVG(age) FROM people...
//     Person.minimum('age', {conditions: ['last_name != ?', 'Drake']}); // Selects the minimum age for
//                                                                       // everyone with a last name other than 'Drake'
//
//     // Selects the minimum age for any family without any minors
//     Person.minimum('age', {having: 'min(age) > 17', group: 'last_name'});
//
//     Person.sum("2 * age");
//
Relation.prototype.calculate = function(operation, column_name, options) {
    options = options || {};
    var options_without_distinct = {};
    if (!_.isString(options)) {
        _.each(options, function(value, key) {
            if (key == 'distinct') {
                return;
            }
            options_without_distinct[key] = value;
        });
    }

    if (!_.isEmpty(options_without_distinct)) {
        return this.applyFinderOptions(options_without_distinct).calculate(operation, column_name, {distinct: options.distinct});
    } else {
        if (undefined !== this.includes_values && _.isEmpty(this.includes_values)) {
            return this.constructRelationForAssociationCalculations().calculate(options, column_name, options);
        } else {
            return this.performCalculation(operation, column_name, options);
        }
    }
};

// private methods

Relation.prototype.performCalculation = function(operation, column_name, options) {
    operation = operation.toLowerCase();

    if (operation == 'count') {
        column_name = column_name || this.selectForCount();
    }

    if (!_.isEmpty(this.group_values)) {
        return this.executeGroupedCalculation(operation, column_name, options.distinct);
    } else {
        return this.executeSimpleCalculation(operation, column_name, options.distinct);
    }
};

Relation.prototype.executeSimpleCalculation = function(operation, column_name, distinct) {
    var column = this.aggregateColumn(column_name);
    var relation = this.except('order');
    var select_value = this.operationOverAggregateColumn(column, operation, distinct);

    relation.select_values = [select_value];

    var event_emitter = new EventEmitter();
    this.klass.tableConnection().selectValue(relation.toSql(), function(error, value) {
        if (error) {
            event_emitter.emit('error', error);
            return;
        }

        if (null === value || undefined === value) { value = 0; }

        event_emitter.emit('value', value);
    });

    return event_emitter;
};

Relation.prototype.executeGroupedCalculation = function(operation, column_name, distinct) {
    var self = this;
    var group_attr = this.group_values;
    var association = this.klass.reflectOnAssociation(_.first(group_attr));
    var associated = group_attr.length == 1 && association && association.macro == 'belongs_to';
    var group_fields = _.flatten([associated ? association.foreign_key : group_attr]);

    var group = group_fields;
    var aggregate_alias;
    if (operation == 'count' && column_name == 'all') {
        aggregate_alias = 'count_all';
    } else {
        aggregate_alias = this.columnAliasFor(operation, column_name);
    }

    var select_values = [
        this.operationOverAggregateColumn(this.aggregateColumn(column_name), operation, distinct).as(aggregate_alias)
    ];

    select_values = select_values.concat(_.map(group_fields, function(field) {
        return nodes.sql(field.toString() + ' AS ' + self.columnAliasFor(field).toString());
    }));

    var relation = this.except('group').group(group.join(', '));
    relation.select_values = select_values;

    var event_emitter = new EventEmitter();
    this.klass.tableConnection().selectAll(relation.toSql(), function(error, value) {
        if (error) {
            event_emitter.emit('error', error);
            return;
        }

        if (null === value || undefined === value) { value = 0; }

        event_emitter.emit('value', value);
    });

    return event_emitter;
};

Relation.prototype.aggregateColumn = function(column_name) {
    if (undefined === column_name) {
        return nodes.sql('*');
    }
    return this.table.column(column_name);
};

Relation.prototype.operationOverAggregateColumn = function(column, operation, distinct) {
    return (operation == 'count') ? column.count(distinct) : column[operation]();
};

Relation.prototype.selectForCount = function() {
    if (this.select_values.length == 1) {
        return _.first(this.select_values);
    }
};

// Converts the given keys to the value that the database adapter returns as
// a usable column name:
//
//   columnAliasFor("users.id");                 // => "users_id"
//   columnAliasFor("sum(id)");                  // => "sum_id"
//   columnAliasFor("count(distinct users.id)"); // => "count_distinct_users_id"
//   columnAliasFor("count(*)");                 // => "count_all"
//   columnAliasFor("count", "id");              // => "count_id"
//
Relation.prototype.columnAliasFor = function(keys) {
    if (_.isArray(keys)) {
        keys = keys.join(' ');
    }

    var name = keys.toLowerCase();
    name = name.replace(/\*/g, 'all');
    name = name.replace(/\W+/g, ' ');
    name = name.replace(/^\s*/g, "").replace(/\s*$/g, "");
    name = name.replace(/ +/g, '_');

    return name;
};

Relation.prototype.columnFor = function(field) {
    var field_name = _.last(field.toString().split('.'));
    return _.detect(this.klass.columns, function(column) {
        return column.name.toString() == field_name;
    });
};
