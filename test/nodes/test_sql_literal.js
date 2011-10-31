var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var visitors = require('../../lib/mapper/visitors');

vows.describe('SqlLiteral node').addBatch({
    'makes an SqlLiteral node': function() {
        var node = nodes.sql('foo');

        assert.equal(node.class_name, 'SqlLiteral');
    },

    'count': {
        'makes a count node': function() {
            var node = new nodes.SqlLiteral('*').count();
            var viz = new visitors.SQL();

            assert.equal(viz.visit(node), 'COUNT(*)');
        },

        'makes a distinct node': function() {
            var node = new nodes.SqlLiteral('*').count(true);
            var viz = new visitors.SQL();

            assert.equal(viz.visit(node), 'COUNT(DISTINCT *)');
        }
    },
    
    'makes an equality node': function() {
        var node = new nodes.SqlLiteral('foo').eq(1);
        var viz = new visitors.SQL();

        assert.equal(viz.visit(node), 'foo = 1');
    },
    
    'grouped "or" equality': function() {
        var node = new nodes.SqlLiteral('foo').eqAny([1,2]);
        var viz = new visitors.SQL();

        assert.equal(viz.visit(node), '(foo = 1 OR foo = 2)');
    },
    
    'grouped "and" equality': function() {
        var node = new nodes.SqlLiteral('foo').eqAll([1,2]);
        var viz = new visitors.SQL();

        assert.equal(viz.visit(node), '(foo = 1 AND foo = 2)');
    }
}).export(module);
