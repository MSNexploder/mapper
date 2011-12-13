// Module dependencies.
var _ = require('underscore');

var Read = function() {};

module.exports = Read;

// Returns the value of the attribute identified by `attr_name` after it has been typecast (for example,
// "2004-12-12" in a data column is cast to a date object, like new Date(2004, 12, 12)).
Read.prototype.readAttribute = function(attr_name) {
    return this._attributes[attr_name];
};
