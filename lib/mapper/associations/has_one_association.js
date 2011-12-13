var util = require('util');
var _ = require('underscore');
var SingularAssociation = require('./singular_association');

var HasOneAssociation = function(owner, reflection) {
    SingularAssociation.call(this, owner, reflection);
};

util.inherits(HasOneAssociation, SingularAssociation);
module.exports = HasOneAssociation;

//def replace(record, save = true)
//  record = check_record(record)
//  load_target
//
//  @reflection.klass.transaction do
//    if @target && @target != record
//      remove_target!(@reflection.options[:dependent])
//    end
//
//    if record
//      set_inverse_instance(record)
//      set_owner_attributes(record)
//
//      if @owner.persisted? && save && !record.save
//        nullify_owner_attributes(record)
//        set_owner_attributes(@target)
//        raise RecordNotSaved, "Failed to save the new associated #{@reflection.name}."
//      end
//    end
//  end
//
//  self.target = record
//end

// TODO
HasOneAssociation.prototype.replace = function(record, save) {
    save = save || true;
    // TODO add checks
    this.loadTarget();

    if (this.target) { // TODO
        var target = this.target.all();
        target.on('row', function(row) {
            if (undefined === row) { return; }
            row.destroy();
        });
    }

    if (record) {
        this.setOwnerAttributes(record);

        if (!record.save()) {
            this.nullifyOwnerAttributes(record);
            this.setOwnerAttributes(this.target);
        }
    }

    this.target = record;
};

HasOneAssociation.prototype.setNewRecord = function(record) {
    this.replace(record, false);
};

HasOneAssociation.prototype.nullifyOwnerAttributes = function(record) {
    record[this.reflection.foreign_key] = undefined;
};
