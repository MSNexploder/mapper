var util = require('util');
var _ = require('underscore');

require('./helper');

var base = require('./base');

// main modules
module.exports.nodes = require('./nodes');
module.exports.visitors = require('./visitors');
module.exports.managers = require('./managers');
module.exports.connection_adapters = require('./connection_adapters');
module.exports.__defineSetter__('configuration', function(val) {
    base.configuration = val;
});

module.exports.__defineGetter__('configuration', function() {
    return base.configuration;
});

module.exports.define = function(name, options, fun) {
    if (undefined === fun && _.isFunction(options)) {
        fun = options;
        options = undefined;
    }
    options = options || {};

    var new_class = base(name, options);

    _.bind(fun, new_class)();
    new_class.createOrUpdateTable();

    return new_class;
};
