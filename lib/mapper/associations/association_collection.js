var util = require('util');
var _ = require('underscore');
var Association = require('./association');

var AssociationCollection = function(owner, reflection) {
    Association.call(this, owner, reflection);
    this.target = [];
};

util.inherits(AssociationCollection, Association);
module.exports = AssociationCollection;

// Replace this collection with `other_array`
// This will perform a diff and delete/add only records that have changed.
AssociationCollection.prototype.replace = function(other_array) {
    var original_target = _.clone(this.loadTarget);
    
    this.delete(_.without(this.target, other_array));
    if (!this.concat(_.without(other_array, this.target))) {
        this.target = original_target;
    }
};

AssociationCollection.prototype.find = function(args) {
    return this.scoped().find(args);
};

// Removes `records` from this association.
//
// This method is abstract in the sense that `delete_records` has to be
// provided by descendants. Note this method does not imply the records
// are actually removed from the database, that depends precisely on
// `delete_records`. They are in any case removed from the collection.
AssociationCollection.prototype.delete = function(records) {
    this.deleteOrDestroy(records, this.reflection.options.dependent);
};

// Add `records` to this association. Returns `this` so method calls may be chained.
AssociationCollection.prototype.concat = function(records) {
    var self = this;
    var result = true;
    if (this.owner.newRecord()) {
        this.loadTarget();
    }
    
    _.each(_.flatten(records), function(record) {
        self.addToTarget(record);
        result = result && self.insertRecord(record);
    });
    
    
    return result && this;
};

// private methods

AssociationCollection.prototype.findTarget = function() {
    var records = this.find('all');
    return records;
};

AssociationCollection.prototype.addToTarget = function(record) {
    var self = this;
    var index = -1;
    
    index = _.indexOf(this.target, record);
    if (this.reflection.options.uniq && index > 0) {
        this.target[index] = record;
    } else {
        this.target.push(record);
    }
    
    //this.setInverseInstance(record);
    return record;
};

AssociationCollection.prototype.deleteOrDestroy = function(records, method) {
    var self = this;
    records = _.flatten(records);
    var existing_records = _.reject(records, function(r) { r.newRecord(); });
    
    if (existing_records.length > 0) {
        this.deleteRecords(existing_records, method);
        _.each(records, function(r) { self.target.delete(r); });
    }
};
