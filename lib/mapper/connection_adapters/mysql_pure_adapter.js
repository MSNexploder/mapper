var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('./abstract_adapter');

//config
// host = config.host || 'localhost';
// user = config.user || 'root';
// password = config.password || '';
// database = config.database || '';
// port = config.port || 3306;
// socket = config.socket || undefined;
// encoding = config.encoding || undefined;
// wait_timeout = config.wait_timeout || 2592000;

var MySQLPureAdapter = function(config) {
    AbstractAdapter.call(this, config);
    // late require to avoid unnecessary dependencies
    var mysql = require('mysql');

    var options = {};
    options.host = config.host || 'localhost';
    options.user = config.user || 'root';
    options.password = config.password || '';
    options.database = config.database || '';
    options.port = config.port || 3306;
    options.socket = config.socket || undefined;

    this._connection = new mysql.Client(options);
    this._connection.connect();
    this.configureConnection();
};

util.inherits(MySQLPureAdapter, AbstractAdapter);
module.exports = MySQLPureAdapter;

MySQLPureAdapter.prototype.nativeDatabaseTypes = {
    primary_key: {name: 'int(11) DEFAULT NULL auto_increment PRIMARY KEY'},
    foreign_key: {name: 'int(11)'},
    string: {name: 'varchar', limit: 255},
    text: {name: 'text'},
    integer: {name: 'int', limit: 4},
    float: {name: 'float'},
    decimal: {name: 'decimal'},
    datetime: {name: 'datetime'},
    time: {name: 'time'},
    date: {name: 'date'},
    binary: {name: 'blob'},
    boolean: {name: 'tinyint', limit: 1}
};

MySQLPureAdapter.prototype.execute = function(sql, fun) {
    this._connection.query(sql, function (error, result, fields) {
        if (error) {
            fun(error, undefined);
            return;
        }

        fun(undefined, result);
    });
};

MySQLPureAdapter.prototype.tables = function(fun) {
    var sql = "SHOW TABLES";
    this.execute(sql, function(error, result) {
        var tables = _.map(result, function(val) {
            return _.values(val)[0];
        });
        fun(error, tables);
    });
};

MySQLPureAdapter.prototype.quotedTrue = function() {
    return "'1'";
};

MySQLPureAdapter.prototype.quotedFalse = function() {
    return "'0'";
};

MySQLPureAdapter.prototype.insertSql = function(sql, fun, name, pk, id_value) {
    var fun2 = function(error, result) {
        if (undefined === error && undefined !== result) {
            result = result.insertId;
        }
        fun(error, result);
    };
    AbstractAdapter.prototype.insertSql.call(this, sql, fun2, name);
};

MySQLPureAdapter.prototype.updateSql = function(sql, fun, name) {
    var fun2 = function(error, result) {
        if (undefined === error && undefined !== result) {
            result = result.affectedRows;
        }
        fun(error, result);
    };
    AbstractAdapter.prototype.updateSql.call(this, sql, fun2, name);
};

MySQLPureAdapter.prototype.quoteColumnName = function(column) {
    return '`' + column + '`';
};

MySQLPureAdapter.prototype.configureConnection = function() {
    // By default, MySQL 'where id is null' selects the last inserted id.
    // Turn this off.
    var configuration = ['SQL_AUTO_IS_NULL=0'];
    if (this.config.encoding) {
        configuration.push("NAMES '" + this.config.encoding + "'");
    }
    configuration.push('@@wait_timeout = ' + (this.config.wait_timeout || 2592000));
    var sql = 'SET ' + configuration.join(', ');

    this._connection.query(sql);
};
