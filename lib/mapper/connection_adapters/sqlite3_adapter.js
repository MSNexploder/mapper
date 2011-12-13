var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('./abstract_adapter');

var connections = {};

//config
// database_path
var SQLite3Adapter = function(config) {
    AbstractAdapter.call(this, config);
    // late require to avoid unnecessary dependencies
    var sqlite = require('sqlite3').verbose(); // .verbose()

    var database_path = this.config.database_path;
    connections[database_path] = connections[database_path] || new sqlite.Database(database_path);
    this._connection = connections[database_path];
};

util.inherits(SQLite3Adapter, AbstractAdapter);
module.exports = SQLite3Adapter;

SQLite3Adapter.prototype.empty_insert_statement_value = 'NULL';

SQLite3Adapter.prototype.nativeDatabaseTypes = {
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

SQLite3Adapter.prototype.execute = function(sql, fun) {
    this._connection.all(sql, [], function(error, rows) {
        if (error) {
            fun(error, undefined);
            return;
        }
        fun(undefined, rows);
    });
};

SQLite3Adapter.prototype.updateSql = function(sql, fun) {
    this._connection.run(sql, [], function(error) {
        if (error) {
            fun(error, undefined);
            return;
        }
        fun(undefined, this.changes);
    });
};

SQLite3Adapter.prototype.insertSql = function(sql, fun, name, pk, id_value) {
    this._connection.run(sql, [], function(error) {
        if (error) {
            fun(error, undefined);
            return;
        }
        fun(undefined, this.lastID);
    });
};

SQLite3Adapter.prototype.tables = function(fun) {
    var sql = "SELECT name FROM sqlite_master WHERE type = 'table' AND NOT name = 'sqlite_sequence'";
    this.execute(sql, function(error, result) {
        var tables = _.map(result, function(val) {
            return val.name;
        });
        fun(error, tables);
    });
};
