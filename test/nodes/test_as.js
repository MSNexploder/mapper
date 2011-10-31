var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var Table = require('../../lib/mapper/table');

vows.describe('As node').addBatch({
    'makes an As node': function() {
        var table = new Table('users');
        var attr = table.column('id');
        var as = attr.as('foo');

        assert.equal(as.left, attr);
        assert.equal(as.right, 'foo');
    }
}).export(module);
