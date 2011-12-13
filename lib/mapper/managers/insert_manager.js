var util = require('util');
var _ = require('underscore');
var InsertStatement = require('../nodes').InsertStatement;
var Values = require('../nodes').Values;
var TreeManager = require('./tree_manager');

var InsertManager = function(connection) {
    TreeManager.call(this, connection);
    this.class_name = 'InsertManager';

    this.ast = new InsertStatement();
};

util.inherits(InsertManager, TreeManager);
module.exports = InsertManager;

InsertManager.prototype.into = function(table) {
    this.ast.relation = table;
    return this;
};

InsertManager.prototype.columns = function() {
    return this.ast.columns;
};

InsertManager.prototype.values = function(values) {
    this.ast.values = values;
};

// fields = [[<column>, <value>], [<column>, <value>]]
InsertManager.prototype.insert = function(fields) {
    if (_.isEmpty(fields)) {
        return this;
    }

    if (_.isArray(fields)) {
        var self = this;
        this.ast.relation = this.ast.relation || fields[0][0].relation;

        var values = [];

        _.each(fields, function(field) {
            if (undefined === field) {
                return;
            }

            self.ast.columns.push(field[0]);
            values.push(field[1]);
        });
        this.ast.values = new Values(values, this.ast.columns);
    } else {
        this.ast.values = new Values([fields]);
    }

    return this;
};
