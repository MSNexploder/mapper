var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('developers', function() {
    this.defineColumn('name', 'string');
    this.defineColumn('salary', 'integer', {default: 70000});
    this.defineColumn('created_at', 'datetime');
    this.defineColumn('updated_at', 'datetime');
    
    this.beforeCreate(function() {
        this.history().push('before_create');
    });
    
    this.beforeSave(function() {
        this.history().push('before_save');
    });
    
    this.beforeUpdate(function() {
        this.history().push('before_update');
    });
    
    this.beforeDestroy(function() {
        this.history().push('before_destroy');
    });
    
    this.afterUpdate(function() {
        this.history().push('after_update');
    });
    
    this.afterCreate(function() {
        this.history().push('after_create');
    });
    
    this.afterSave(function() {
        this.history().push('after_save');
    });
    
    this.afterDestroy(function() {
        this.history().push('after_destroy');
    });
});

module.exports.prototype.history = function() {
    this._history = this._history || [];
    return this._history;
};
