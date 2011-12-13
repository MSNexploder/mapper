var _ = require('underscore');

// from => object delegate from
// to => object or function delegate to
//      function will be lazy evaluated in the context of from
// function_name => function to be delegated
//
_.mixin({delegate: function(from, to, function_name) {
    from[function_name] = function() {
        if (_.isFunction(to)) {
            to = _.bind(to, from)();
        }

        if (_.isEmpty(arguments)) {
            return to[function_name].call(to);
        } else {
            return to[function_name].apply(to, arguments);
        }
    };
}});
