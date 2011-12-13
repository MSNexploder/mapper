var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('../abstract_adapter');
var TableDefinition = require('./schema_definition').TableDefinition;

// options
// temporary => temporary table

// options => database specific options
AbstractAdapter.prototype.createOrUpdateTable = function(klass, fun, columns) {
    options = _.map(columns, function(column) { return column.options; }) || {};
    options.force = options.force || false;
    var self = this;
    var table = klass.table();

    this.tables(function(error, tables) {
        if (error) {
            klass.emit('error', error);
            return;
        }
        // check if table is already defined
        if (_.any(tables, function(existing_table) {
            return (table.name == existing_table);
        })) {
            self.updateTable(klass, fun, options);
        } else {
            self.createTable(klass, fun, options);
        }
    });
};

AbstractAdapter.prototype.createTable = function(klass, fun, options) {
    options = options || {};

    var td = new TableDefinition(klass);

    var create_sql = 'CREATE' + (options.temporary ? ' TEMPORARY' : '') + ' TABLE ';
    create_sql += klass.quotedTableName() + ' (';
    create_sql += td.toSql() + ') ' + (options.options ? options.options : '');

    this.execute(create_sql, function(error, values) {
        if (error) {
            klass.emit('error', error);
            return;
        } else {
            fun();
        }
    });
};

// TODO
AbstractAdapter.prototype.updateTable = function(klass, fun, options) {
    options = options || {};

    // TODO
    process.nextTick(function() {
        fun();
    });
};

AbstractAdapter.prototype.dropTable = function(klass, fun, options) {
    var sql = 'DROP TABLE ' + klass.quotedTableName();
    this.execute(sql, fun);
};

AbstractAdapter.prototype.typeToSql = function(type, limit, precision, scale) {
    var nat = this.nativeDatabaseTypes[type];

    if (undefined !== nat) {
        var type_sql = nat.name;

        if (type == 'decimal') {
            scale = scale || nat.scale;
            precision = precision || nat.precision;

            if (undefined !== precision) {
                if (undefined !== scale) {
                    type_sql += '(' + precision + ',' + scale + ')';
                } else {
                    type_sql += '(' + precision + ')';
                }
            }
            else if (scale) {
                throw new Error('Error adding decimal column: precision cannot be empty if scale if specified');
            }
        } else if (type != 'primary_key') {
            limit = limit || nat.limit;
            if (undefined !== limit) {
                type_sql += '(' + limit + ')';
            }
        }

        return type_sql;
    }

    return type;
};

AbstractAdapter.prototype.nativeDatabaseTypes = {};
