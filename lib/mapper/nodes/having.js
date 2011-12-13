var util = require('util');
var Unary = require('./unary');

var Having = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'Having';
};

util.inherits(Having, Unary);
module.exports = Having;
