var util = require('util');
var Unary = require('./unary');

var On = function(expr) {
    Unary.call(this, expr);
    this.class_name = 'On';
};

util.inherits(On, Unary);
module.exports = On;
