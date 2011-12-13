var util = require('util');
var _ = require('underscore');
var AssociationCollection = require('./association_collection');

var HasManyAssociation = function(owner, reflection) {
    AssociationCollection.call(this, owner, reflection);
};

util.inherits(HasManyAssociation, AssociationCollection);
module.exports = HasManyAssociation;

HasManyAssociation.prototype.insertRecord = function(record) {
    this.setOwnerAttributes(record);
    return record.save();
};

