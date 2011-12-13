var _ = require('underscore');

// returns true if input is a integer or a string representing an integer.
_.mixin({isInt: function(integer) {
    var y = parseInt(integer, 10);
    if (_.isNaN(y)) { return false; }
    return integer == y && integer.toString() == y.toString();
}});
