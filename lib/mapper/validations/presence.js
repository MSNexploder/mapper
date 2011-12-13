// Module dependencies.
var _ = require('underscore');
var util = require('util');

// TODO
// Validates that the specified attributes are not blank (as defined by Object#blank?). Happens by default on save. Example:
//
//   class Person < ActiveRecord::Base
//     validates_presence_of :first_name
//   end
//
// The first_name attribute must be in the object and it cannot be blank.
//
// If you want to validate the presence of a boolean field (where the real values are true and false),
// you will want to use <tt>validates_inclusion_of :field_name, :in => [true, false]</tt>.
//
// This is due to the way Object#blank? handles boolean values: <tt>false.blank? # => true</tt>.
//
// Configuration options:
// * <tt>message</tt> - A custom error message (default is: "can't be blank").
// * <tt>on</tt> - Specifies when this validation is active (default is <tt>:save</tt>, other options <tt>:create</tt>,
//   <tt>:update</tt>).
// * <tt>if</tt> - Specifies a method, proc or string to call to determine if the validation should
//   occur (e.g. <tt>:if => :allow_validation</tt>, or <tt>:if => Proc.new { |user| user.signup_step > 2 }</tt>).
//   The method, proc or string should return or evaluate to a true or false value.
// * <tt>unless</tt> - Specifies a method, proc or string to call to determine if the validation should
//   not occur (e.g. <tt>:unless => :skip_validation</tt>, or <tt>:unless => Proc.new { |user| user.signup_step <= 2 }</tt>).
//   The method, proc or string should return or evaluate to a true or false value.
//
module.exports.validatesPresenceOf = function(names, options) {
    var clazz = this;
    this.validateEach(names, function(name) {
        var column = _.detect(clazz._columns, function(col) {
            return col.name == name;
        });
        if (undefined === column) {
            throw new Error('unkown column: ' + name);
        }

        var attribute = this[name];
        if (undefined === attribute || null === attribute) {
            return false;
        }

        switch (column.type) {
            case 'text':
            case 'string': return attribute.length !== 0;
            case 'primary_key':
            case 'foreign_key':
            case 'integer':
            case 'float':
            case 'decimal':
            case 'datetime':
            case 'date':
            case 'time':
            case 'binary':
            case 'boolean': return true;
            default: return true;
        }
    });
};
