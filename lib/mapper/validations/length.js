// Module dependencies.
var _ = require('underscore');
var util = require('util');

// TODO
// Validates that the specified attribute matches the length restrictions supplied. Only one option can be used at a time:
//
//   class Person < ActiveRecord::Base
//     validates_length_of :first_name, :maximum=>30
//     validates_length_of :last_name, :maximum=>30, :message=>"less than 30 if you don't mind"
//     validates_length_of :fax, :in => 7..32, :allow_nil => true
//     validates_length_of :phone, :in => 7..32, :allow_blank => true
//     validates_length_of :user_name, :within => 6..20, :too_long => "pick a shorter name", :too_short => "pick a longer name"
//     validates_length_of :zip_code, :minimum => 5, :too_short => "please enter at least 5 characters"
//     validates_length_of :smurf_leader, :is => 4, :message => "papa is spelled with 4 characters... don't play me."
//     validates_length_of :essay, :minimum => 100, :too_short => "Your essay must be at least 100 words."), :tokenizer => lambda {|str| str.scan(/\w+/) }
//   end
//
// Configuration options:
// * <tt>:minimum</tt> - The minimum size of the attribute.
// * <tt>:maximum</tt> - The maximum size of the attribute.
// * <tt>:is</tt> - The exact size of the attribute.
// * <tt>:within</tt> - A range specifying the minimum and maximum size of the attribute.
// * <tt>:in</tt> - A synonym(or alias) for <tt>:within</tt>.
// * <tt>:allow_nil</tt> - Attribute may be +nil+; skip validation.
// * <tt>:allow_blank</tt> - Attribute may be blank; skip validation.
// * <tt>:too_long</tt> - The error message if the attribute goes over the maximum (default is: "is too long (maximum is %{count} characters)").
// * <tt>:too_short</tt> - The error message if the attribute goes under the minimum (default is: "is too short (min is %{count} characters)").
// * <tt>:wrong_length</tt> - The error message if using the <tt>:is</tt> method and the attribute is the wrong size (default is: "is the wrong length (should be %{count} characters)").
// * <tt>:message</tt> - The error message to use for a <tt>:minimum</tt>, <tt>:maximum</tt>, or <tt>:is</tt> violation.  An alias of the appropriate <tt>too_long</tt>/<tt>too_short</tt>/<tt>wrong_length</tt> message.
// * <tt>:on</tt> - Specifies when this validation is active (default is <tt>:save</tt>, other options <tt>:create</tt>, <tt>:update</tt>).
// * <tt>:if</tt> - Specifies a method, proc or string to call to determine if the validation should
//   occur (e.g. <tt>:if => :allow_validation</tt>, or <tt>:if => Proc.new { |user| user.signup_step > 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
// * <tt>:unless</tt> - Specifies a method, proc or string to call to determine if the validation should
//   not occur (e.g. <tt>:unless => :skip_validation</tt>, or <tt>:unless => Proc.new { |user| user.signup_step <= 2 }</tt>).  The
//   method, proc or string should return or evaluate to a true or false value.
// * <tt>:tokenizer</tt> - Specifies how to split up the attribute string. (e.g. <tt>:tokenizer => lambda {|str| str.scan(/\w+/)}</tt> to
//   count words as in above example.)
//   Defaults to <tt>lambda{ |value| value.split(//) }</tt> which counts individual characters.
//
module.exports.validatesLengthOf = function(names, options) {
    var clazz = this;
    options = _.extend({}, options);
    if (undefined !== options.is) {
        options.minimum = options.is;
        options.maximum = options.is;
    }

    if (undefined === options.minimum && undefined === options.maximum) {
        throw new Error('minimum and maximum or is must be specifed');
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

        switch (column.type) {
            case 'text':
            case 'string': return (options.minimum <= attribute.length && attribute.length <= options.maximum);
            case 'primary_key':
            case 'foreign_key':
            case 'integer':
            case 'float':
            case 'decimal': return (options.minimum <= attribute && attribute <= options.maximum);
            case 'datetime':
            case 'date':
            case 'time':
            case 'binary':
            case 'boolean': return false;
            default: return false;
        }
    });
};
