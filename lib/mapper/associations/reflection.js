var util = require('util');
var _ = require('underscore');
var HasOneAssociation = require('./has_one_association');
var BelongsToAssociation = require('./belongs_to_association');
var HasManyAssociation = require('./has_many_association');

var MacroReflection = function(macro, association_name, options, record) {
    this.macro = macro;
    this.association_name = association_name;
    this.options = options;
    this.record = record;
};

var AssociationReflection = function(macro, association_name, options, record) {
    MacroReflection.call(this, macro, association_name, options, record);
    this.collection = _.include('has_many', macro);
};

util.inherits(AssociationReflection, MacroReflection);
module.exports.MacroReflection = MacroReflection;
module.exports.AssociationReflection = AssociationReflection;

AssociationReflection.prototype.buildAssociation = function(options) {
    var association = this.association();
    return new association(options);
};

AssociationReflection.prototype.association = function() {
    return this.record.modelWithName(this.association_name);
};

AssociationReflection.prototype.primaryKey = function() {
    this._primary_key = this._primary_key || this.options.primary_key || this.association().primary_key;
    return this._primary_key;
};

AssociationReflection.prototype.associationForeignKey = function() {
    this._association_primary_key = this._association_primary_key || this.options.primary_key || this.klass.primaryKey() || 'id';
    return this._association_primary_key;
};

AssociationReflection.prototype.foreignKey = function() {
    this._foreign_key = this._foreign_key || this.options.foreign_key || this.deriveForeignKey();
    return this._foreign_key;
};

AssociationReflection.prototype.deriveForeignKey = function() {
    if (this.macro == 'belongs_to') {
        return this.association_name + '_id';
    } else if (this.options.as) {
        return this.options.as + '_id';
    } else {
        return this.record.class_name + '_id';
    }
};

AssociationReflection.prototype.proxyClass = function() {
    switch (this.macro) {
        case 'has_one': return HasOneAssociation;
        case 'belongs_to': return BelongsToAssociation;
        case 'has_many': return HasManyAssociation;
    }
};
