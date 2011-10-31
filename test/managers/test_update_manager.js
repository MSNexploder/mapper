var vows = require('vows');
var assert = require('assert');

var Table = require('../../lib/mapper/table');
var nodes = require('../../lib/mapper/nodes');
var managers = require('../../lib/mapper/managers');

// TODO connection testing
vows.describe('UpdateManager').addBatch({
    'handles limit properly': function() {
        var table = new Table('users');
        var um = new managers.UpdateManager();
        um.take(10);
        um.table(table);
        um.set([[table.column('name'), undefined]]);

        assert.equal(um.toSql(), 'UPDATE "users" SET "name" = NULL WHERE NULL IN SELECT NULL LIMIT 10');
    },

    'set': {
        'updates with null': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();
            um.table(table);
            um.set([[table.column('name'), undefined]]);

            assert.equal(um.toSql(), 'UPDATE "users" SET "name" = NULL');
        },

        'takes a string': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();
            um.table(table);
            um.set(new nodes.SqlLiteral('foo = bar'));

            assert.equal(um.toSql(), 'UPDATE "users" SET foo = bar');
        },

        'takes a list of lists': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();
            um.table(table);
            um.set([[table.column('id'), 1], [table.column('name'), 'hello']]);

            assert.equal(um.toSql(), 'UPDATE "users" SET "id" = 1, "name" = \'hello\'');
        },

        'chains': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();

            assert.equal(um, um.set([[table.column('id'), 1]]));
        }
    },

    'table': {
        'generates an update statement': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();
            um.table(table);

            assert.equal(um.toSql(), 'UPDATE "users"');
        },

        'chains': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();

            assert.equal(um, um.table(table));
        }
    },

    'where': {
        'generates a where clause': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();
            um.table(table);
            um.where(table.column('id').eq(1));

            assert.equal(um.toSql(), 'UPDATE "users" WHERE "users"."id" = 1');
        },

        'chains': function() {
            var table = new Table('users');
            var um = new managers.UpdateManager();

            assert.equal(um, um.where(table.column('id').eq(1)));
        }
    },
}).export(module);
