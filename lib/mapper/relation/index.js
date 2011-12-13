// Module dependencies.
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var nodes = require('../nodes');

var Relation = function(klass, table) {
    var self = this;
    this.klass = klass;
    this.table = table;

    _.each(Relation.single_value_methods, function(value) {
        self[value + '_value'] = undefined;
    });

    _.each(Relation.multi_value_methods, function(value) {
        self[value + '_values'] = [];
    });
};

util.inherits(Relation, EventEmitter);
module.exports = Relation;

// TODO maybe needs cleanup
Relation.multi_value_methods = ['select', 'group', 'order', 'joins', 'where', 'having', 'bind'];
Relation.single_value_methods = ['limit', 'offset', 'lock', 'readonly', 'create_with', 'from'];

require('./query_methods');
require('./spawn_methods');
require('./finder_methods');
require('./calculations');

Relation.prototype.toSql = function() {
    this._sql = this._sql || this.arel().toSql();
    return this._sql;
};

Relation.prototype.execute = function() {
    var self = this;
    var connection = this.table.connection;
    var fun = function(error, rows) {
        if (error) {
            self.emit('error', error);
            return;
        }

        var new_rows = [];
        for (var i=0; i < rows.length; i++) {
            new_rows[i] = self.createObjectFromHash(rows[i]); // TODO
            self.emit('row', new_rows[i]);
        }

        self.emit('row', undefined);
        self.emit('rows', new_rows);

        self._values = new_rows; // cache for further calls
    };

    if (undefined === this._values) {
        connection.execute(this.toSql(), fun);
    } else {
        process.nextTick(function() {
            fun(undefined, self._values);
        });
    }

    return this;
};

// Deletes the records matching `conditions` without instantiating the records first, and hence not
// calling the `destroy` method nor invoking callbacks. This is a single SQL DELETE statement that
// goes straight to the database. Emits the number of rows affected.
//
// ==== Parameters
//
// * `conditions` - Conditions are specified the same way as with `find` method.
//
// ==== Emits
//
// Emits a `success` event if containing the count of deleted records which are successfully deleted.
//
// ==== Example
//
//     Post.deleteAll("person_id = 5 AND (category = 'Something' OR category = 'Else')");
//     Post.deleteAll(["person_id = ? AND (category = ? OR category = ?)", 5, 'Something', 'Else']);
//
// Both calls delete the affected posts all at once with a single DELETE statement.
//
Relation.prototype.deleteAll = function(conditions) {
    if (conditions) {
        return this.where(conditions).deleteAll();
    }
    var event = new EventEmitter();
    var dm = this.table.deleteManager();
    var self = this;

    dm.from(this.table);
    _.each(_.uniq(this.where_values), function(where) {
        dm = dm.where(new nodes.Grouping(self.buildWhereClause(where)));
    });

    this.klass.tableConnection().delete(dm.toSql(), function(error, value) {
        if (error) {
            event.emit('error', error);
            return;
        }
        event.emit('success', value);
    });

    return event;
};

// Deletes the row with a primary key matching the `id` argument, using a
// SQL `DELETE` statement, and returns the number of rows deleted.
//
// You can delete multiple rows at once by passing an Array of `id`s.
//
// #### Examples
//
//     // Delete a single row
//     Todo.delete(1);
//
//     // Delete multiple rows
//     Todo.delete([2,3,4]);
//
Relation.prototype.delete = function(id_or_array) {
    var where_clause = {};
    where_clause[this.klass.primary_key] = id_or_array;
    return this.where(where_clause).deleteAll();
};

Relation.prototype.insert = function(values, fun) {
    var im = this.table.insertManager();
    var table = this.table;
    if (_.isString(values)) {
        values = nodes.sql(values);
    } else {
        values = _.map(values, function(value, key) {
            return [table.column(key), value];
        });
    }
    im.into(this.table);
    im.insert(values);

    this.klass.tableConnection().insert(im.toSql(), fun, 'SQL');
};

// Updates all records with details given if they match a set of conditions supplied, limits and order can
// also be supplied. This method constructs a single SQL UPDATE statement and sends it straight to the
// database.
//
// #### Parameters
//
// * `updates` - A string, array, or hash representing the SET part of an SQL statement.
// * `conditions` - A string, array, or hash representing the WHERE part of an SQL statement.
//   See conditions in the intro.
// * `options` - Additional options are `limit` and `order`, see the examples for usage.
//
// #### Emits
//
// Emits `success`, passing the count of all successfully updated records.
//
// #### Examples
//
//     # Update all customers with the given attributes
//     Customer.update_all({wants_email: true});
//
//     # Update all books with 'Mapper' in their title
//     Book.update_all(["author = 'Stefan'", "title LIKE '%Mapper%'"]);
//
//     # Update all avatars migrated more than a week ago
//     Avatar.update_all([['migrated_at = ?', Time.now.utc], ['migrated_at > ?', 1.week.ago]]);
//
//     # Update all books that match conditions, but limit it to 5 ordered by date
//     Book.update_all(["author = 'Stefan'", "title LIKE '%Mapper%'"], {order: 'created_at', limit: 5});
//

Relation.prototype.updateAll = function(updates, conditions, options) {
    if (conditions || options) {
        return this.where(conditions).applyFinderOptions(options).updateAll(updates);
    }

    var event = new EventEmitter();

    var um = this.table.updateManager();
    um.table(this.table);
    um.order(this.order_values);
    um.where(this.where_values);
    if (this.limit_value) {
        um.take(this.limit_value);
    }
    um.set(this.klass.sanitizeSqlForAssignment(updates));

    this.klass.tableConnection().update(um.toSql(), function(error, value) {
        if (error) {
            event.emit('error', error);
            return;
        }
        event.emit('success', value);
    });

    return event;
};

// Updates an object (or multiple objects) and saves it to the database.
// Will emit 'success' with the updated object if successfully saved.
//
// #### Parameters
//
// * `id` - This should be the id or an array of ids to be updated.
// * `attributes` - This should be a hash of attributes or an array of hashes.
//
// #### Examples
//
//     // Updates one record
//     Person.update(15, {user_name: 'Samuel', group: 'expert'});
//
//     // Updates multiple records
//     people = { 1: { first_name: "David" }, 2: { first_name: "Jeremy" } };
//     Person.update(_.keys(people), _.values(people));
//
Relation.prototype.update = function(ids, values) {
    var self = this;
    var event = new EventEmitter();
    if (_.isArray(ids)) {
        var length = ids.length;
        var vals = [];
        var counter = 0;
        _.each(ids, function(id) {
            var update = self.update(id, values[counter]);
            counter += 1;
            update.on('success', function(val) {
                length -= 1;
                vals.push(val);
                if (length === 0) {
                    event.emit('success', vals);
                }
            });
            update.on('error', function(error) {
                length -= 1;
                if (length === 0) {
                    event.emit('success', vals);
                } else {
                    event.emit('error', error);
                }
            });
        });
    } else {
        var um = this.table.updateManager();
        um.table(this.table);
        um.where(self.primaryKey().eq(ids));

        um.set(_.map(values, function(value, key) {
            return [self.table.column(key), value];
        }));

        this.klass.tableConnection().update(um.toSql(), function(error, value) {
            if (error) {
                event.emit('error', error);
                return;
            }
            event.emit('success', value);
        });
    }

    return event;
};

Relation.prototype.primaryKey = function() {
    this._primary_key = this._primary_key || this.table.column(this.klass.primary_key);
    return this._primary_key;
};

Relation.prototype.clone = function() {
    var relation = _.clone(this);
    delete relation._sql;
    delete relation._arel;
    delete relation._values;
    return relation;
};

Relation.prototype.whereValuesHash = function() {
    var values = {};
    _.each(this.where_values, function(where) {
        values[where.left.name] = where.right;
    });
    return values;
};

Relation.prototype.scopeForCreate = function() {
    this._scope_for_create = this._scope_for_create || this.whereValuesHash();
    return this._scope_for_create;
};

// TODO only add columns defined in model
Relation.prototype.createObjectFromHash = function(hash) {
    var base = new this.klass();
    _.each(hash, function(value, key) {
        base[key] = value;
    });
    base._new_record = false;
    return base;
};
