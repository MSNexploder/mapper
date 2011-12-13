var util = require('util');
var _ = require('underscore');

var Persistence = function() {
};

module.exports = Persistence;

// Returns true if this object hasn't been saved yet -- that is, a record
// for the object doesn't exist in the data store yet; otherwise, returns false.
Persistence.prototype.newRecord = function() {
    return this._new_record;
};

// Returns true if this object has been destroyed, otherwise returns false.
Persistence.prototype.destroyed = function() {
    return this._destroyed;
};

// Returns if the record is persisted, i.e. it's not a new record and it was
// not destroyed.
Persistence.prototype.persisted = function() {
    return !(this.newRecord() || this.destroyed());
};

// Saves the model.
//
// If the model is new a record gets created in the database, otherwise
// the existing record gets updated.
//
// TODO
// By default, save always run validations. If any of them fail the action
// is cancelled and +save+ returns +false+. However, if you supply
// :validate => false, validations are bypassed altogether. See
// ActiveRecord::Validations for more information.
//
// TODO
// There's a series of callbacks associated with +save+. If any of the
// <tt>before_*</tt> callbacks return +false+ the action is cancelled and
// +save+ returns +false+. See ActiveRecord::Callbacks for further
// details.
// emits success event including model instance
Persistence.prototype.save = function() {
    return this.createOrUpdate(arguments);
};

//# Deletes the record in the database and freezes this instance to
//# reflect that no changes should be made (since they can't be
//# persisted). Returns the frozen instance.
//#
//# The row is simply removed with an SQL +DELETE+ statement on the
//# record's primary key, and no callbacks are executed.
//#
//# To enforce the object's +before_destroy+ and +after_destroy+
//# callbacks, Observer methods, or any <tt>:dependent</tt> association
//# options, use <tt>#destroy</tt>.
//def delete
//  self.class.delete(id) if persisted?
//  @destroyed = true
//  freeze
//end
//
//# Deletes the record in the database and freezes this instance to reflect
//# that no changes should be made (since they can't be persisted).
//def destroy
//  if persisted?
//    self.class.unscoped.where(self.class.arel_table[self.class.primary_key].eq(id)).delete_all
//  end
//
//  @destroyed = true
//  freeze
//end

Persistence.prototype.createOrUpdate = function() {
    return this.newRecord() ? this.create(arguments) : this.update(arguments);
};

Persistence.prototype.destroy = function() {
    var self = this;
    if (this.persisted()) {
        var table = this.constructor.table();
        var delete_all = this.constructor.relation().where(table.column(this.constructor.primary_key).eq(this.id)).deleteAll();
        
        delete_all.on('success', function() {
            this.destroyed = true;
            self.emit('success', 'destroy', self);
        });
        delete_all.on('error', function(error) {
            self.emit('error', error);
        });
    } else {
        process.nextTick(function() {
            this.destroyed = true;
            self.emit('success', 'destroy', self);
        });
    }
    
    return self;
};

// TODO
// Updates the associated record with values matching those of the instance attributes.
Persistence.prototype.update = function() {
    var self = this;
    var attributes_with_values = this.attributesValues(false);
    var table = this.constructor.table();

    var stmt = this.constructor.relation().where(table.column(this.constructor.primary_key).eq(this.id));
    var update = stmt.update(this.id, attributes_with_values);

    update.on('success', function(row) {
        self.emit('success', 'create', self);
    });

    update.on('error', function(error) {
        self.emit('error', error);
    });

    return self;
};

// Creates a record with values matching those of the instance attributes
// and returns its id.
Persistence.prototype.create = function() {
    var self = this;
    var need_id = (undefined === this[this.constructor.primary_key]);
    var attributes_values = this.attributesValues(need_id);

    var fun = function(error, result) {
        if (error) {
            self.emit('error', error);
            return;
        }

        self[self.constructor.primary_key] = self[self.constructor.primary_key] || result;
        self._new_record = false;
        self.emit('success', 'create', self);
    };

    if (_.isEmpty(attributes_values)) {
        attributes_values = this.constructor.tableConnection().empty_insert_statement_value;
    }

    this.constructor.relation().insert(attributes_values, fun);
    return self;
};

// Initializes the attributes array with keys matching the columns from the linked table and
// the values matching the corresponding default value of that column, so
// that a new instance, or one populated from a passed-in Hash, still has all the attributes
// that instances loaded from the database would.
Persistence.prototype.attributesFromColumnDefinition = function() {
    var attributes = {};
    _.each(this.constructor._columns, function(column) {
        attributes[column.name] = column.default;
    });
    return attributes;
};
