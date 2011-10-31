var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var Table = require('../../lib/mapper/table');

vows.describe('NamedFunction node').addBatch({
    'makes an NamedFunction node': function() {
        var node = new nodes.NamedFunction('omg', 'zomg');

        assert.equal(node.name, 'omg');
        assert.equal(node.expr, 'zomg');
    }
}).export(module);
