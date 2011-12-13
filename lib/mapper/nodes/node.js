var util = require('util');
var _ = require('underscore');

var Node = function() {
    this.class_name = 'Node';
};

module.exports = Node;

var Not = require('./not');
var Grouping = require('./grouping');
var Or = require('./or');
var And = require('./and');
var Count = require('./count');
var As = require('./as');
var Sum = require('./sum');
var Max = require('./max');
var Min = require('./min');
var Avg = require('./avg');
var SqlLiteral = require('./sql_literal');
var NotEqual = require('./not_equal');
var Equality = require('./equality');
var Matches = require('./matches');
var In = require('./in');
var NotIn = require('./not_in');
var DoesNotMatch = require('./does_not_match');
var GreaterThanOrEqual = require('./greater_than_or_equal');
var GreaterThan = require('./greater_than');
var LessThan = require('./less_than');
var LessThanOrEqual = require('./less_than_or_equal');
var Ordering = require('./ordering');

var groupingAny = function(others, fun) {
    return new Grouping(new Or(_.map(others, fun)));
};

var groupingAll = function(others, fun) {
    return new Grouping(new And(_.map(others, fun)));
};

Node.prototype.not = function() {
    return new Not(this);
};

Node.prototype.or = function(right) {
    return new Grouping(new Or([this, right]));
};

Node.prototype.and = function(right) {
    return new And([this, right]);
};

Node.prototype.as = function(other) {
    return new As(this, other);
};

Node.prototype.notEq = function(other) {
    return new NotEqual(this, other);
};

Node.prototype.notEqAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.notEq(val); });
};

Node.prototype.notEqAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.notEq(val); });
};

Node.prototype.eq = function(other) {
    return new Equality(this, other);
};

Node.prototype.eqAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.eq(val); });
};

Node.prototype.eqAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.eq(val); });
};

Node.prototype.matches = function(other) {
    return new Matches(this, other);
};

Node.prototype.matchesAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.matches(val); });
};

Node.prototype.matchesAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.matches(val); });
};

Node.prototype.doesNotMatch = function(other) {
    return new DoesNotMatch(this, other);
};

Node.prototype.doesNotMatchAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.doesNotMatch(val); });
};

Node.prototype.doesNotMatchAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.doesNotMatch(val); });
};

Node.prototype.gteq = function(right) {
    return new GreaterThanOrEqual(this, right);
};

Node.prototype.gteqAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.gteq(val); });
};

Node.prototype.gteqAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.gteq(val); });
};

Node.prototype.gt = function(right) {
    return new GreaterThan(this, right);
};

Node.prototype.gtAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.gt(val); });
};

Node.prototype.gtAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.gt(val); });
};

Node.prototype.lteq = function(right) {
    return new LessThanOrEqual(this, right);
};

Node.prototype.lteqAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.lteq(val); });
};

Node.prototype.lteqAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.lteq(val); });
};

Node.prototype.lt = function(right) {
    return new LessThan(this, right);
};

Node.prototype.ltAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.lt(val); });
};

Node.prototype.ltAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.lt(val); });
};

Node.prototype.in = function(other) {
    if (other.class_name == 'SelectManager') {
        return new In(this, new Grouping(other.ast));
    }
    return new In(this, new Grouping(other));
};

Node.prototype.inAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.in(val); });
};

Node.prototype.inAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.in(val); });
};

Node.prototype.notIn = function(other) {
    if (other.class_name == 'SelectManager') {
        return new NotIn(this, new Grouping(other.ast));
    }
    return new NotIn(this, new Grouping(other));
};

Node.prototype.notInAny = function(others) {
    var self = this;
    return groupingAny(others, function(val) { return self.notIn(val); });
};

Node.prototype.notInAll = function(others) {
    var self = this;
    return groupingAll(others, function(val) { return self.notIn(val); });
};

Node.prototype.asc = function() {
    return new Ordering(this, 'ASC');
};

Node.prototype.desc = function() {
    return new Ordering(this, 'DESC');
};

Node.prototype.count = function(distinct) {
    return new Count([this], distinct);
};

Node.prototype.sum = function() {
    return new Sum([this], new SqlLiteral('sum_id'));
};

Node.prototype.maximum = function() {
    return new Max([this], new SqlLiteral('max_id'));
};

Node.prototype.minimum = function() {
    return new Min([this], new SqlLiteral('min_id'));
};

Node.prototype.average = function() {
    return new Avg([this], new SqlLiteral('avg_id'));
};
