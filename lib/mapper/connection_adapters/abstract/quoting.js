var util = require('util');
var _ = require('underscore');
var AbstractAdapter = require('../abstract_adapter');

// Quotes the column value to help prevent
// {SQL injection attacks}[http://en.wikipedia.org/wiki/SQL_injection].
AbstractAdapter.prototype.quote = function(value, column) {
    switch (typeof(value)) {
        case 'string':
            if (undefined === column) {
                return this.quoteString(value);
            }
            
            switch (column.options.type) {
                case 'binary': return this.quoteString(value); // TODO need real quoting
                case 'integer': return parseInt(value, 10);
                case 'float': return parseFloat(value);
            }
            return this.quoteString(value);
        case 'number': return value.toString();
        case 'undefined': return 'NULL';
        case 'boolean':
            if (column && column.options.type == 'integer') {
                return value ? '1' : '0';
            }
            return value ? this.quotedTrue() : this.quotedFalse();
        case 'object':
            if (_.isDate(object)) {
                return this.quoteString(value.toUTCString());
            }
            return this.quoteString(value.toString());
        default: return this.quoteString(value.toString());
    }
};

AbstractAdapter.prototype.quoteTableName = function(name) {
    return this.quoteColumnName(name);
};

AbstractAdapter.prototype.quoteColumnName = function(column) {
    if (column.class_name == column) {
        return column;
    } else {
        return '"' + column + '"';
    }
};

AbstractAdapter.prototype.quoteString = function(string) {
    return "'" + string.replace(/\\/, '\\\\').replace(/'/, "''") + "'";
};

AbstractAdapter.prototype.quotedTrue = function() {
    return "'t'";
};

AbstractAdapter.prototype.quotedFalse = function() {
    return "'f'";
};
