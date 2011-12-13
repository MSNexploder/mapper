var _ = require('underscore');

// foobar -> Foobar
_.mixin({capitalize : function(string) {
    return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
}});
