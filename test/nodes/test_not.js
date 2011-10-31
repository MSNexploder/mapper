var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var Table = require('../../lib/mapper/table');

vows.describe('Not node').addBatch({
    'makes an Not node': function() {
        var table = new Table('users');
        var attr = table.column('id');
        var left = attr.eq(10);
        var right = attr.eq(11);
        var or = left.or(right);
        var node = or.not();

        assert.equal(node.expr, or);
    }
}).export(module);
