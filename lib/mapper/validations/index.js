// Module dependencies.
var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Callback = require('../base/callbacks').Callback;

var Validation = function() {};

module.exports.Validation = Validation;
module.exports.defineValidations = function(clazz) {
    clazz._validations = [];

    clazz.prototype.validateWithoutCallbacks = clazz.prototype.validate;

    Callback.defineModelCallbacks(clazz, ['Validate']);

    clazz.prototype.validate = function() {
        var ret = [];
        var self = this;
        _.each(this.constructor._validations, function(val) {
            if (_.bind(val, self)() === false) { ret.push(val); }
        });
        return _.compact(ret);
    };

    // redefine save
    clazz.prototype.saveWithoutValidations = clazz.prototype.save;

    clazz.prototype.save = function() {
        var failed_validations = this.validate();
        if (!_.isEmpty(failed_validations)) {
            var emitter = new EventEmitter();
            process.nextTick(function() {
                emitter.emit('error', new Error('validation failed'));
            });
            return emitter;
        }
        return Callback.runCallbacks(this, 'validate', this.saveWithoutValidations);
    };
};

// TODO
// Adds a validation method or block to the class. This is useful when
// overriding the +validate+ instance method becomes too unwieldy and
// you're looking for more descriptive declaration of your validations.
//
// This can be done with a symbol pointing to a method:
//
//   class Comment
//     include ActiveModel::Validations
//
//     validate :must_be_friends
//
//     def must_be_friends
//       errors.add(:base, "Must be friends to leave a comment") unless commenter.friend_of?(commentee)
//     end
//   end
//
// With a block which is passed with the current record to be validated:
//
//   class Comment
//     include ActiveModel::Validations
//
//     validate do |comment|
//       comment.must_be_friends
//     end
//
//     def must_be_friends
//       errors.add(:base, "Must be friends to leave a comment") unless commenter.friend_of?(commentee)
//     end
//   end
//
// Or with a block where self points to the current record to be validated:
//
//   class Comment
//     include ActiveModel::Validations
//
//     validate do
//       errors.add(:base, "Must be friends to leave a comment") unless commenter.friend_of?(commentee)
//     end
//   end
//
Validation.validates = function(fun) {
    this._validations.push(fun);
};

Validation.validateEach = function(names, fun) {
    names = _.compact(_.flatten([names]));
    this._validations.push(function() {
        var self = this;
        var values = _.map(names, function(name) {
            return _.bind(fun, self)(name);
        });

        return _.all(values, function(val) { return val !== false; });
    });
};

// load default validators
_.each(['presence', 'length', 'inclusion', 'exclusion'], function(val) {
    var validator = require('./' + val);
    _.extend(Validation, validator);
});
