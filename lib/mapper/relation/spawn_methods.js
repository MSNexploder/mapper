var _ = require('underscore');
var nodes = require('../nodes');
var Relation = require('../relation');

// Removes from the query the condition(s) specified in `skips`.
//
// #### Example
//
//     Post.order('id asc').except('order');                  // discards the order condition
//     Post.where('id > 10').order('id asc').except('where'); // discards the where condition but keeps the order
//
Relation.prototype.except = function(skips) {
    var self = this;
    var result = new Relation(this.klass, this.table);
    skips = _.uniq(_.compact(_.flatten([skips])));

    var multi_values = _.select(Relation.multi_value_methods, function(val) {
        return !_.include(skips, val);
    });

    var single_values = _.select(Relation.single_value_methods, function(val) {
        return !_.include(skips, val);
    });

    _.each(multi_values, function(method) {
        result[method + '_values'] = self[method + '_values'];
    });

    _.each(single_values, function(method) {
        result[method + '_value'] = self[method + '_value'];
    });

    return result;
};

// private methods

Relation.prototype.applyFinderOptions = function(options) {
    var relation = this.clone();

    if (_.isEmpty(options)) {
        return relation;
    }

    var valid_keys = ['joins', 'select', 'group', 'order', 'having', 'limit', 'offset', 'from', 'lock', 'readonly'];

    _.each(options, function(value, key) {
        if (!_.include(valid_keys, key)) {
            return;
        }
        relation = relation[key](value);
    });

    if (options.conditions) {
        relation = relation.where(options.conditions);
    }

    if (options.include) {
        relation = relation.includes(options.include);
    }

    if (options.extend) {
        relation = relation.extending(options.extend);
    }

    return relation;
};
