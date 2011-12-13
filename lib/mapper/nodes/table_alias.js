var util = require('util');
var Binary = require('./binary');
var Attribute = require('./attribute');

var TableAlias = function(name, relation) {
    Binary.call(this, name, relation);
    this.class_name = 'TableAlias';
};

util.inherits(TableAlias, Binary);
module.exports = TableAlias;

TableAlias.prototype.column = function(name) {
    return new Attribute(this, name);
};
