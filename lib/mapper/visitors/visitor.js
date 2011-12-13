var util = require('util');
var _ = require('underscore');

var Visitor = function() {
    this.class_name = 'Visitor';
};

module.exports = Visitor;

Visitor.prototype.visit = function(object) {
    var object_name = (_.isUndefined(object) || _.isNull(object)) ? 'undefined' : object.class_name;
    var method_name = 'visit' + object_name + 'Node';
    return this[method_name](object);
};
