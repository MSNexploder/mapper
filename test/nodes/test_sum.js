var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var Table = require('../../lib/mapper/table');
var visitors = require('../../lib/mapper/visitors');

vows.describe('Sum node').addBatch({
    'should alias Sum': function() {
        var table = new Table('users');
        var node = table.column('id').sum().as(nodes.sql('foo'));
        var viz = new visitors.SQL();
        
        assert.equal(viz.visit(node), 'SUM("users"."id") AS foo');
    }
}).export(module);
