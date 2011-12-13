var util = require('util');
var Binary = require('./binary');

var JoinSource = function(source, joinop) {
    Binary.call(this, source, joinop || []);
    this.class_name = 'JoinSource';
};

util.inherits(JoinSource, Binary);
module.exports = JoinSource;
