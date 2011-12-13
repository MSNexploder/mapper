var SQL = require('./visitors/sql');
var SQLite = require('./visitors/sqlite');
var MySQL = require('./visitors/mysql');
var OrderClauses = require('./visitors/order_clauses');
var WhereSql = require('./visitors/where_sql');

module.exports.for = function(config) {
    if (undefined === config || undefined === config.config) {
        return new SQL();
    }
    
    switch (config.config.adapter) {
        case 'sqlite': return new SQLite();
        case 'sqlite3': return new SQLite();
        case 'mysql': return new MySQL();
        case 'mysql-pure': return new MySQL();
        default: return new SQL();
    }
};

module.exports.SQL = SQL;
module.exports.SQLite = SQLite;
module.exports.MySQL = MySQL;
module.exports.OrderClauses = OrderClauses;
module.exports.WhereSql = WhereSql;
