// Module dependencies.
var _ = require('underscore');

var Write = function() {};

module.exports = Write;

// Updates the attribute identified by `attr_name` with the specified `value`. Empty strings
// for fixnum and float columns are turned into `undefined`.
Write.prototype.writeAttribute = function(attr_name, value) {
    var column = this.columnForAttribute(attr_name);
    if (column && column.isNumber()) {
        this._attributes[attr_name] = this.convertNumberColumnValue(value);
    } else {
        this._attributes[attr_name] = value;
    }
};
