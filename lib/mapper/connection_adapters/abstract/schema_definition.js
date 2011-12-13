var _ = require('underscore');

var TableDefinition = function(base) {
    this.base = base;
};

var ColumnDefinition = function(name, base, options) {
    this.name = name;
    this.base = base;
    this.options = options;
    
    if (undefined !== this.options.null) {
        this.options.not_null = !this.options.null;
    }
};

module.exports.TableDefinition = TableDefinition;
module.exports.ColumnDefinition = ColumnDefinition;

TableDefinition.prototype.toSql = function() {
    var base = this.base;
    return _.map(base._columns, function(col) {
        var column = new ColumnDefinition(col.name, base, col.options);
        return column.toSql();
    }).join(', ');
};

ColumnDefinition.prototype.toSql = function() {
    var quoted_name = this.base.table().selectManager().visitor.quoteColumnName(this.name); // FIXME ugly
    var sql = quoted_name + ' ' + this.sqlType();
    var connection = this.base.tableConnection();
    
    if (this.options.type != 'primary_key') {
        if (undefined !== this.options.default) {
            sql += ' DEFAULT ' + connection.quote(this.options.default, this);
        }
        if (undefined !== this.options.not_null) {
            sql += ' NOT NULL';
        }
    }
    return sql;
};

// type, limit, precision, scale -> options
ColumnDefinition.prototype.sqlType = function() {
    var limit = this.options.limit;
    var precision = this.options.precision;
    var scale = this.options.scale;
    var type = this.options.type;
    return this.base.tableConnection().typeToSql(type, limit, precision, scale);
};
