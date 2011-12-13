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

var MySQLAdapter = function(config) {
    AbstractAdapter.call(this, config);
    // late require to avoid unnecessary dependencies
    var mysql = require('mysql-libmysqlclient');

    var host = config.host || 'localhost';
    var user = config.user || 'root';
    var password = config.password || '';
    var database = config.database || '';
    var port = config.port || 3306;
    var socket = config.socket || undefined;

    this._connection = mysql.createConnectionSync(host, user, password, database, port, socket);

    if (!this._connection.connectedSync()) {
        throw new Error("Connection error " + this._connection.connectErrno + ": " + this._connection.connectError);
    }

    this.configureConnection();
};

util.inherits(MySQLAdapter, AbstractAdapter);
module.exports = MySQLAdapter;

MySQLAdapter.prototype.nativeDatabaseTypes = {
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

MySQLAdapter.prototype.execute = function(sql, fun) {
    this._connection.query(sql, function (error, result) {
        if (result && result.fetchAll) {
            result.fetchAll(function (error, rows) {
                fun(error, rows);
            });
        } else {
            fun(error, result);
        }
    });
};

MySQLAdapter.prototype.tables = function(fun) {
    var sql = "SHOW TABLES";
    this.execute(sql, function(error, result) {
        var tables = _.map(result, function(val) {
            return _.values(val)[0];
        });
        fun(error, tables);
    });
};

MySQLAdapter.prototype.quotedTrue = function() {
    return "'1'";
};

MySQLAdapter.prototype.quotedFalse = function() {
    return "'0'";
};

MySQLAdapter.prototype.insertSql = function(sql, fun, name, pk, id_value) {
    var fun2 = function(error, result) {
        if (null === error && undefined !== result) {
            result = result.insertId;
        }
        fun(error, result);
    };
    AbstractAdapter.prototype.insertSql.call(this, sql, fun2, name);
};

MySQLAdapter.prototype.updateSql = function(sql, fun, name) {
    var fun2 = function(error, result) {
        if (null === error && undefined !== result) {
            result = result.affectedRows;
        }
        fun(error, result);
    };
    AbstractAdapter.prototype.updateSql.call(this, sql, fun2, name);
};

MySQLAdapter.prototype.quoteColumnName = function(column) {
    return '`' + column + '`';
};

MySQLAdapter.prototype.configureConnection = function() {
    // By default, MySQL 'where id is null' selects the last inserted id.
    // Turn this off.
    var configuration = ['SQL_AUTO_IS_NULL=0'];
    if (this.config.encoding) {
        configuration.push("NAMES '" + this.config.encoding + "'");
    }
    configuration.push('@@wait_timeout = ' + (this.config.wait_timeout || 2592000));
    var sql = 'SET ' + configuration.join(', ');

    this._connection.querySync(sql);
};
