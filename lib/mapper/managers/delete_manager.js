var util = require('util');
var _ = require('underscore');
var DeleteStatement = require('../nodes').DeleteStatement;
var TreeManager = require('./tree_manager');

var DeleteManager = function(connection) {
    TreeManager.call(this, connection);
    this.class_name = 'DeleteManager';

    this.ast = new DeleteStatement();
};

util.inherits(DeleteManager, TreeManager);
module.exports = DeleteManager;

DeleteManager.prototype.from = function(relation) {
    this.ast.relation = relation;
    return this;
};

DeleteManager.prototype.where = function(list) {
    if (_.isArray(list)) {
        this.ast.wheres = list;
    } else {
        this.ast.wheres.push(list);
    }
    return this;
};
