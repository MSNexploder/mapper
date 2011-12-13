var nodes = require('./nodes');

var FactoryMethods = function() {};

module.exports = FactoryMethods;

FactoryMethods.prototype.createAnd = function(clauses) {
    return new nodes.And(clauses);
};

FactoryMethods.prototype.createOn = function(expr) {
    return new nodes.On(expr);
};

FactoryMethods.prototype.createJoin = function(to, constraint, klass) {
    klass = klass || 'InnerJoin';
    switch (klass) {
        case 'InnerJoin':
            return new nodes.InnerJoin(to, constraint);
        case 'OuterJoin':
            return new nodes.OuterJoin(to, constraint);
        case 'StringJoin':
            return new nodes.StringJoin(to, constraint);
    }
};

FactoryMethods.prototype.createStringJoin = function(to) {
    return new nodes.StringJoin(to);
};
