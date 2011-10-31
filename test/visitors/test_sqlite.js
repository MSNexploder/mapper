var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var visitors = require('../../lib/mapper/visitors');

vows.describe('SQLite visitor').addBatch({
    'SQLite visitor': {
        topic: new visitors.SQLite(),
        
        'defaults limit to -1': {
            topic: function(visitor) {
                var stmt = new nodes.SelectStatement();
                stmt.offset = new nodes.Offset(1);
                return visitor.visit(stmt);
            },
            'defaults limit to -1': function(result) {
                assert.equal(result, 'SELECT LIMIT -1 OFFSET 1');
            }
        }
    }
}).export(module);
