// Module dependencies.
var _ = require('underscore');
var util = require('util');

// TODO
// Validates whether the value of the specified attribute is available in a particular enumerable object.
//
//   class Person < ActiveRecord::Base
//     validates_inclusion_of :gender, :in => %w( m f )
//     validates_inclusion_of :age, :in => 0..99
//     validates_inclusion_of :format, :in => %w( jpg gif png ), :message => "extension %{value} is not included in the list"
//   end
//
// Configuration options:
// * <tt>:in</tt> - An enumerable object of available items.
// * <tt>:message</tt> - Specifies a custom error message (default is: "is not included in the list").
// * <tt>:allow_nil</tt> - If set to true, skips this validation if the attribute is +nil+ (default is +false+).
// * <tt>:allow_blank</tt> - If set to true, skips this validation if the attribute is blank (default is +false+).
// * <tt>:if</tt> - Specifies a method, proc or string to call to determine if the validation should
//   occur (e.g. <tt>:if => :allow_validation</tt>, or <tt>:if => Proc.new { |user| user.signup_step > 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
// * <tt>:unless</tt> - Specifies a method, proc or string to call to determine if the validation should
//   not occur (e.g. <tt>:unless => :skip_validation</tt>, or <tt>:unless => Proc.new { |user| user.signup_step <= 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
//
module.exports.validatesInclusionOf = function(names, options) {
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

        return _.include(options.in, attribute);
    });
};
