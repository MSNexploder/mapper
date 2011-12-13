var util = require('util');
var Binary = require('./binary');

var Values = function(exprs, columns) {
    Binary.call(this, exprs, columns || []);
    this.class_name = 'Values';
};

util.inherits(Values, Binary);
module.exports = Values;
