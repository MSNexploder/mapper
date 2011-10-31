var vows = require('vows');
var assert = require('assert');

var nodes = require('../../lib/mapper/nodes');
var visitors = require('../../lib/mapper/visitors');

vows.describe('MySQL visitor').addBatch({
    'MySQL visitor': {
        topic: new visitors.MySQL(),

        'defaults limit to 18446744073709552000': {
            topic: function(visitor) {
                var stmt = new nodes.SelectStatement();
                stmt.offset = new nodes.Offset(1);
                return visitor.visit(stmt);
            },
            'defaults limit to 18446744073709552000': function(result) {
                assert.equal(result, 'SELECT FROM DUAL LIMIT 18446744073709552000 OFFSET 1');
            }
        },

        'should escape LIMIT': {
            topic: function(visitor) {
                var stmt = new nodes.UpdateStatement();
                stmt.limit = new nodes.Limit('omg');
                return visitor.visit(stmt);
            },
            'should escape LIMIT': function(result) {
                assert.equal(result, "UPDATE NULL LIMIT 'omg'");
            }
        },

        'uses DUAL for empty from': {
            topic: function(visitor) {
                var stmt = new nodes.SelectStatement();
                return visitor.visit(stmt);
            },
            'uses DUAL for empty from': function(result) {
                assert.equal(result, 'SELECT FROM DUAL');
            }
        },

        'uses FOR UPDATE when locking': {
            topic: function(visitor) {
                var stmt = new nodes.SelectStatement();
                stmt.lock = new nodes.Lock();
                return visitor.visit(stmt);
            },
            'uses FOR UPDATE when locking': function(result) {
                assert.equal(result, 'SELECT FROM DUAL FOR UPDATE');
            }
        }
    }
}).export(module);
