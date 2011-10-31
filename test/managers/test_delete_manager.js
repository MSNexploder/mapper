var vows = require('vows');
var assert = require('assert');

var Table = require('../../lib/mapper/table');
var managers = require('../../lib/mapper/managers');

// TODO connection testing
vows.describe('DeleteManager').addBatch({
    'from': {
        'uses from': function() {
            var table = new Table('users');
            var dm = new managers.DeleteManager();
            dm.from(table);

            assert.equal(dm.toSql(), 'DELETE FROM "users"');
        },

        'chains': function() {
            var table = new Table('users');
            var dm = new managers.DeleteManager();

            assert.equal(dm.from(table), dm);
        }
    },

    'where': {
        'uses where value': function() {
            var table = new Table('users');
            var dm = new managers.DeleteManager();
            dm.from(table);
            dm.where(table.column('id').eq(10));

            assert.equal(dm.toSql(), 'DELETE FROM "users" WHERE "users"."id" = 10');
        },

        'uses where array': function() {
            var table = new Table('users');
            var dm = new managers.DeleteManager();
            dm.from(table);
            dm.where([table.column('id').eq(10), table.column('name').eq('stefan')]);

            assert.equal(dm.toSql(), 'DELETE FROM "users" WHERE "users"."id" = 10 AND "users"."name" = \'stefan\'');
        },

        'chains': function() {
            var table = new Table('users');
            var dm = new managers.DeleteManager();

            assert.equal(dm.where(table.column('id').eq(10)), dm);
        }
    }
}).export(module);
