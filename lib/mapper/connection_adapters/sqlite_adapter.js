var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('./abstract_adapter');

//config
// database_path
var SQLiteAdapter = function(config) {
    AbstractAdapter.call(this, config);
    // late require to avoid unnecessary dependencies
    var sqlite = require('sqlite');

    this._connection = new sqlite.Database();
    this._connection.open(this.config.database_path, function(error) {
        if (error) { throw error; }
    });
};

util.inherits(SQLiteAdapter, AbstractAdapter);
module.exports = SQLiteAdapter;

SQLiteAdapter.prototype.empty_insert_statement_value = 'NULL';

SQLiteAdapter.prototype.nativeDatabaseTypes = {
    primary_key: {name: 'INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL'},
    foreign_key: {name: 'integer'},
    string: {name: 'varchar', limit: 255},
    text: {name: 'text'},
    integer: {name: 'integer'},
    float: {name: 'float'},
    decimal: {name: 'decimal'},
    datetime: {name: 'datetime'},
    time: {name: 'time'},
    date: {name: 'date'},
    binary: {name: 'blob'},
    boolean: {name: 'boolean'}
};

SQLiteAdapter.prototype.execute = function(sql, fun) {
    // FIXME needs cleanup
    this._connection.prepare(sql, {}, function(error, statement) {
        if (error) {
            fun(error, undefined);
            return;
        }
        statement.fetchAll(function (error, result) {
            if (error) {
                fun(error, undefined);
                return;
            }
            statement.finalize(function (error) {
                if (error) {
                    fun(error, undefined);
                    return;
                }
                fun(error, result);
          });
        });
    });
};

SQLiteAdapter.prototype.updateSql = function(sql, fun) {
    // FIXME needs cleanup
    this._connection.prepare(sql, {affectedRows: true, lastInsertRowID: true}, function(error, statement) {
        if (error) {
            fun(error, undefined);
            return;
        }
        statement.step(function (error, result) {
            if (error) {
                fun(error, undefined);
                return;
            }
            statement.finalize(function (error) {
                if (error) {
                    fun(error, undefined);
                    return;
                }
                fun(error, this.affectedRows);
          });
        });
    });
};

SQLiteAdapter.prototype.insertSql = function(sql, fun, name, pk, id_value) {
    // use a prepared statement in order to get the generated insertRowId
    // FIXME needs cleanup
    this._connection.prepare(sql, {lastInsertRowID: true}, function(error, statement) {
        if (error) {
            fun(error, undefined);
            return;
        }
        statement.step(function (error, result) {
            if (error) {
                fun(error, undefined);
                return;
            }
            statement.finalize(function (error) {
                if (error) {
                    fun(error, undefined);
                    return;
                }
                fun(error, this.lastInsertRowID);
          });
        });
    });
};

SQLiteAdapter.prototype.tables = function(fun) {
    var sql = "SELECT name FROM sqlite_master WHERE type = 'table' AND NOT name = 'sqlite_sequence'";
    this.execute(sql, function(error, result) {
        var tables = _.map(result, function(val) {
            return val.name;
        });
        fun(error, tables);
    });
};
