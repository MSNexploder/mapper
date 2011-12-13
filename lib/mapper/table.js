var util = require('util');
var _ = require('underscore');
var nodes = require('./nodes');
var managers = require('./managers');
var FactoryMethods = require('./factory_methods');

// FIXME needs connection
var Table = function(name, options) {
    this.class_name = 'Table';

    this.name = name;
    this.aliases = [];

    this.connection = options || Table.connection;
    if (!_.isString(options) && !_.isUndefined(options)) {
        if (options.connection) {
            this.connection = options.connection;
        }

        if (options.as != name) {
            this.table_alias = options.as;
        }
    }
};

module.exports = Table;

_.extend(Table.prototype, FactoryMethods.prototype);

Table.connection = undefined;

Table.prototype.selectManager = function() {
    return new managers.SelectManager(this.connection, this);
};

Table.prototype.insertManager = function() {
    return new managers.InsertManager(this.connection, this);
};

Table.prototype.updateManager = function() {
    return new managers.UpdateManager(this.connection, this);
};

Table.prototype.deleteManager = function() {
    return new managers.DeleteManager(this.connection, this);
};

Table.prototype.from = function() {
    return new managers.SelectManager(this.connection, this);
};

Table.prototype.skip = function(amount) {
    return this.from().skip(amount);
};

Table.prototype.lock = function(condition) {
    return this.from().lock(condition);
};

Table.prototype.having = function(expr) {
    return this.from().having(expr);
};

Table.prototype.group = function(columns) {
    return this.from().group(columns);
};

Table.prototype.take = function(amount) {
    return this.from().take(amount);
};

Table.prototype.order = function(expr) {
    return this.from().order(expr);
};

Table.prototype.where = function(condition) {
    return this.from().where(condition);
};

Table.prototype.project = function(things) {
    return this.from().project(things);
};

Table.prototype.alias = function(name) {
    name = name || this.name + '_2';
    var alias = new nodes.TableAlias(name, this);
    this.aliases.push(alias);
    return alias;
};

Table.prototype.join = function(relation, klass) {
    if (undefined === relation) {
        return this.from();
    }

    if (_.isString(relation) || relation.class_name == 'SqlLiteral') {
        klass = 'StringJoin';
    }

    return this.from().join(relation, klass);
};

Table.prototype.project = function(things) {
    return this.from().project(things);
};

Table.prototype.quotedTableName = function() {
    return this.selectManager().visitor.quoteTableName(this.name);
};

Table.prototype.column = function(name) {
    return new nodes.Attribute(this, name);
};
