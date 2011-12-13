// Module dependencies.
var _ = require('underscore');

var PrimaryKey = function() {};

module.exports = PrimaryKey;

// Returns this record's primary key value wrapped in an Array or undefined if
// the record is not persisted? or has just been destroyed.
PrimaryKey.prototype.toKey = function() {
    var key = this[this.primary_key];
    if (key) {
        return [key];
    } else {
        return undefined;
    }
};

PrimaryKey.primary_key = 'id';
