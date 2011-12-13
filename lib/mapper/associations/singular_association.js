var util = require('util');
var _ = require('underscore');
var Association = require('./association');

var SingularAssociation = function(owner, reflection) {
    Association.call(this, owner, reflection);
};

util.inherits(SingularAssociation, Association);
module.exports = SingularAssociation;

SingularAssociation.prototype.build = function(attributes) {
    attributes = attributes || {};
    return this.newRecord('build', attributes);
};

SingularAssociation.prototype.findTarget = function() {
    return this.scoped();
};

SingularAssociation.prototype.setNewRecord = function(record) {
    this.replace(record);
};

SingularAssociation.prototype.newRecord = function(method, attributes) {
    attributes = attributes || {};
    attributes = this.scoped().scopeForCreate(); // merge(attributes); // TODO
    var record = this.reflection[method + 'Association'](attributes);
    this.setNewRecord(record);
    return record;
};
