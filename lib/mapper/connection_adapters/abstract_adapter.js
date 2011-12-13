var util = require('util');
var _ = require('underscore');

var AbstractAdapter = function(config) {
    this.config = config;
};

module.exports = AbstractAdapter;

require('./abstract/database_statements');
require('./abstract/schema_statements');
require('./abstract/quoting');
