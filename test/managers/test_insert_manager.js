var vows = require('vows');
var assert = require('assert');

var Table = require('../../lib/mapper/table');
var nodes = require('../../lib/mapper/nodes');
var managers = require('../../lib/mapper/managers');

// broken
// TODO connection testing
vows.describe('InsertManager').addBatch({
    'insert': {
        'inserts false': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.insert([[table.column('bool'), false]]);

            assert.equal(im.toSql(), 'INSERT INTO "users" ("bool") VALUES (\'f\')');
        },
        
        'inserts string': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.insert('ZOMG');

            assert.equal(im.toSql(), 'INSERT INTO "users" VALUES (\'ZOMG\')');
        },

        'inserts null': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.insert([[table.column('id'), undefined]]);

            assert.equal(im.toSql(), 'INSERT INTO "users" ("id") VALUES (NULL)');
        },

        'takes a list of lists': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.insert([[table.column('id'), 1], [table.column('name'), 'stefan']]);

            assert.equal(im.toSql(), 'INSERT INTO "users" ("id", "name") VALUES (1, \'stefan\')');
        },

        'takes an empty list': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.insert([]);

            assert.equal(im.toSql(), 'INSERT INTO "users"');
        }
    },

    'into': {
        'generates an insert statement': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);

            assert.equal(im.toSql(), 'INSERT INTO "users"');
        },

        'chains': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();

            assert.equal(im, im.into(table));
        }
    },

    'columns': {
        'converts to sql': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.columns().push(table.column('id'));

            assert.equal(im.toSql(), 'INSERT INTO "users" ("id")');
        }
    },

    'values': {
        'converts to sql': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.values(new nodes.Values([1]));

            assert.equal(im.toSql(), 'INSERT INTO "users" VALUES (1)');
        }
    },

    'combo': {
        'puts shit together': function() {
            var table = new Table('users');
            var im = new managers.InsertManager();
            im.into(table);
            im.values(new nodes.Values([1, 'stefan']));
            im.columns().push(table.column('id'));
            im.columns().push(table.column('name'));

            assert.equal(im.toSql(), 'INSERT INTO "users" ("id", "name") VALUES (1, \'stefan\')');
        }
    }
}).export(module);
