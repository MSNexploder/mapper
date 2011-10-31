var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var Table = require('../../lib/mapper/table');

vows.describe('Or node').addBatch({
    'makes an Or node': function() {
        var table = new Table('users');
        var attr = table.column('id');
        var left = attr.eq(10);
        var right = attr.eq(11);
        var node = left.or(right);

        assert.equal(node.expr.children[0], left);
        assert.equal(node.expr.children[1], right);

        var oror = node.or(right);

        assert.equal(oror.expr.children[0], node);
        assert.equal(oror.expr.children[1], right);
    }
}).export(module);
