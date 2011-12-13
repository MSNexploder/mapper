var util = require('util');
var _ = require('underscore');
var SingularAssociation = require('./singular_association');

var BelongsToAssociation = function(owner, reflection) {
    SingularAssociation.call(this, owner, reflection);
};

util.inherits(BelongsToAssociation, SingularAssociation);
module.exports = BelongsToAssociation;

//def replace(record)
//  record = check_record(record)
//
//  update_counters(record)
//  replace_keys(record)
//  set_inverse_instance(record)
//
//  @updated = true if record
//
//  self.target = record
//end

// TODO
BelongsToAssociation.prototype.replace = function(record) {
    console.log(record);
    console.log('*************');
};

