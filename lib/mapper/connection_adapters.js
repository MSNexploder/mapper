var SQLiteAdapter = require('./connection_adapters/sqlite_adapter');
var SQLite3Adapter = require('./connection_adapters/sqlite3_adapter');
var MySQLAdapter = require('./connection_adapters/mysql_adapter');
var MySQLPureAdapter = require('./connection_adapters/mysql_pure_adapter');

module.exports.for = function(config) {
    switch (config.adapter) {
        case 'sqlite': return new SQLiteAdapter(config);
        case 'sqlite3': return new SQLite3Adapter(config);
        case 'mysql': return new MySQLAdapter(config);
        case 'mysql-pure': return new MySQLPureAdapter(config);
        default: return undefined;
    }
};

module.exports.SQLiteAdapter = SQLiteAdapter;
