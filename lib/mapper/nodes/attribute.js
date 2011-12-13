var util = require('util');
var Binary = require('./binary');

var Attribute = function(relation, name) {
    Binary.call(this, relation, name);
    this.class_name = 'Attribute';
};

util.inherits(Attribute, Binary);
module.exports = Attribute;
