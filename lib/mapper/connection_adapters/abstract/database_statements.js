var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('../abstract_adapter');

AbstractAdapter.prototype.empty_insert_statement_value = 'DEFAULT';

// Executes +sql+ statement in the context of this connection using
// +binds+ as the bind substitutes.  +name+ is logged along with
// the executed +sql+ statement.
AbstractAdapter.prototype.insert = function(sql, fun, name, pk, id_value) {
    this.insertSql(sql, fun, name, pk, id_value);
};

// Executes the update statement.
AbstractAdapter.prototype.update = function(sql, fun, name) {
    this.updateSql(sql, fun, name);
};

// Executes the delete statement
AbstractAdapter.prototype.delete = function(sql, fun, name) {
    this.deleteSql(sql, fun);
};

AbstractAdapter.prototype.insertSql = function(sql, fun, name, pk, id_value) {
    this.execute(sql, fun);
};

AbstractAdapter.prototype.updateSql = function(sql, fun, name) {
    this.execute(sql, fun);
};

AbstractAdapter.prototype.deleteSql = function(sql, fun, name) {
    this.execute(sql, fun);
};

// Returns an array of record hashes with the column names as keys and
// column values as values.
AbstractAdapter.prototype.selectAll = function(sql, fun, name) {
    var callback = function(error, rows) {
        if (error) {
            fun(error, undefined);
            return;
        }

        fun(error, rows);
    };
    this.execute(sql, callback);
};

// Returns a record hash with the column names as keys and column values as values.
AbstractAdapter.prototype.selectOne = function(sql, fun, name) {
    var callback = function(error, rows) {
        if (error) {
            fun(error, undefined);
            return;
        }

        fun(error, _.first(rows));
    };
    this.execute(sql, callback);
};

// Returns a single value from a record
AbstractAdapter.prototype.selectValue = function(sql, fun, name) {
    var callback = function(error, row) {
        if (error) {
            fun(error, undefined);
            return;
        }

        var value = _.first(_.values(row));
        fun(error, value);
    };
    this.selectOne(sql, callback);
};
