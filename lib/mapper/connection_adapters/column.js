var util = require('util');
var _ = require('underscore');

var Column = function(options) {
    this.options = options;
    this.type = options.type;
    this.name = options.name;
};

module.exports = Column;

Column.prototype.isNumber = function() {
    return this.type == 'integer' || this.type == 'float' || this.type == 'decimal';
};
