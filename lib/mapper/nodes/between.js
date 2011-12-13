var util = require('util');
var Binary = require('./binary');

var Between = function(left, right) {
    Binary.call(this, left, right);
    this.class_name = 'Between';
};

util.inherits(Between, Binary);
module.exports = Between;
