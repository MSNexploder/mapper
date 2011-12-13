var util = require('util');
var visitors = require('../visitors');

var TreeManager = function(connection) {
    this.class_name = 'TreeManager';

    this.connection = connection;
    this.visitor = visitors.for(connection);
    this.ast = undefined;
};

module.exports = TreeManager;

TreeManager.prototype.toSql = function() {
    return this.visitor.visit(this.ast);
};
