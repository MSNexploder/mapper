var util = require('util');
var _ = require('underscore');

var Association = function(owner, reflection) {
    this.owner = owner;
    this.target = undefined;
    this.reflection = reflection;
};

module.exports = Association;

Association.prototype.scoped = function() {
    return this._association_scope || this.associationScope(); // TODO
};

Association.prototype.reset = function() {
    this.target = undefined;
};

// TODO
Association.prototype.reload = function() {
    this.reset();
    this.constructScope();
    this.loadTarget();
    if (undefined === this.target) {
        return undefined;
    }
    return this;
};

Association.prototype.loadTarget = function() {
    this.target = this.findTarget();
    return this.target;
};

Association.prototype.targetKlass = function() {
    return this.reflection.association();
};

Association.prototype.targetScope = function() {
    return this.targetKlass().scoped();
};

//def association_scope
//  scope = target_klass.unscoped
//  scope = scope.create_with(creation_attributes)
//  scope = scope.apply_finder_options(@reflection.options.slice(:conditions, :readonly, :include))
//  if select = select_value
//    scope = scope.select(select)
//  end
//  scope = scope.extending(*Array.wrap(@reflection.options[:extend]))
//  scope.where(construct_owner_conditions)
//end
// TODO
Association.prototype.associationScope = function() {
    var scope = this.targetKlass().scoped();
    scope.applyFinderOptions(this.reflection.options);
    
    var ownerConditions = this.constructOwnerConditions();
    return scope.where(ownerConditions);
};

Association.prototype.setOwnerAttributes = function(record) {
    if (this.owner.persisted()) {
        _.each(this.constructOwnerAttributes(), function(value, key) {
            record[key] = value;
        });
    }
};

//# Returns a hash linking the owner to the association represented by the reflection
//def construct_owner_attributes(reflection = @reflection)
//  attributes = {}
//  if reflection.macro == :belongs_to
//    attributes[reflection.association_primary_key] = @owner[reflection.foreign_key]
//  else
//    attributes[reflection.foreign_key] = @owner[reflection.active_record_primary_key]
//
//    if reflection.options[:as]
//      attributes["#{reflection.options[:as]}_type"] = @owner.class.base_class.name
//    end
//  end
//  attributes
//end
// TODO
Association.prototype.constructOwnerAttributes = function(reflection) {
    reflection = reflection || this.reflection;
    var attributes = {};
    
    if (reflection.macro == 'belongs_to') {
        attributes[reflection.primaryKey()] = this.owner[reflection.foreignKey()];
    } else {
        attributes[reflection.foreignKey()] = this.owner[reflection.primaryKey()];
    }
    
    return attributes;
};

Association.prototype.constructOwnerConditions = function(table, reflection) {
    table = table || this.targetKlass().table();
    reflection = reflection || this.reflection;
    
    var conditions = _.map(this.constructOwnerAttributes(reflection), function(value, key) {
        return table.column(key).eq(value);
    });
    
    return table.createAnd(conditions);
};

Association.prototype.constructScope = function() {
    if (this.targetKlass()) {
        this._association_scope = this.associationScope();
    }
};
