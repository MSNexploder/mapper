// Module dependencies.
var _ = require('underscore');
var util = require('util');

// TODO
// Validates that the value of the specified attribute is not in a particular enumerable object.
//
//   class Person < ActiveRecord::Base
//     validates_exclusion_of :username, :in => %w( admin superuser ), :message => "You don't belong here"
//     validates_exclusion_of :age, :in => 30..60, :message => "This site is only for under 30 and over 60"
//     validates_exclusion_of :format, :in => %w( mov avi ), :message => "extension %{value} is not allowed"
//   end
//
// Configuration options:
// * <tt>:in</tt> - An enumerable object of items that the value shouldn't be part of.
// * <tt>:message</tt> - Specifies a custom error message (default is: "is reserved").
// * <tt>:allow_nil</tt> - If set to true, skips this validation if the attribute is +nil+ (default is +false+).
// * <tt>:allow_blank</tt> - If set to true, skips this validation if the attribute is blank (default is +false+).
// * <tt>:if</tt> - Specifies a method, proc or string to call to determine if the validation should
//   occur (e.g. <tt>:if => :allow_validation</tt>, or <tt>:if => Proc.new { |user| user.signup_step > 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
// * <tt>:unless</tt> - Specifies a method, proc or string to call to determine if the validation should
//   not occur (e.g. <tt>:unless => :skip_validation</tt>, or <tt>:unless => Proc.new { |user| user.signup_step <= 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
//
module.exports.validatesExclusionOf = function(names, options) {
    var clazz = this;
    options = _.extend({}, options);

    if (undefined === options.in) {
        throw new Error('in must be specified');
    }

    this.validateEach(names, function(name) {
        var column = _.detect(clazz._columns, function(col) {
            return col.name == name;
        });
        if (undefined === column) {
            throw new Error('unkown column: ' + name);
        }

        var attribute = this[name];
        if (undefined === attribute || null === attribute) {
            return true;
        }

        return !_.include(options.in, attribute);
    });
};
