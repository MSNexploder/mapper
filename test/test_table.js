var vows = require('vows');
var assert = require('assert');

var nodes = require('../lib/mapper/nodes');
var Table = require('../lib/mapper/table');
var visitors = require('../lib/mapper/visitors');

vows.describe('Table').addBatch({
    'should create join nodes': {
        topic: new Table('users'),

        'string join': function(table) {
            var join = table.createStringJoin('foo');
            assert.equal('StringJoin', join.class_name);
            assert.equal(join.left, 'foo');
        },

        'inner join': function(table) {
            var join = table.createJoin('foo', 'bar');
            assert.equal('InnerJoin', join.class_name);
            assert.equal(join.left, 'foo');
            assert.equal(join.right, 'bar');
        },

        'outer join': function(table) {
            var join = table.createJoin('foo', 'bar', 'OuterJoin');
            assert.equal('OuterJoin', join.class_name);
            assert.equal(join.left, 'foo');
            assert.equal(join.right, 'bar');
        }
    },

    'should return IM from insertManager': function() {
        var table = new Table('users');
        var im = table.insertManager();
        assert.equal(im.class_name, 'InsertManager');
        assert.deepEqual(table.connection, im.connection);
    },

    'should return UM from updateManager': function() {
        var table = new Table('users');
        var um = table.updateManager();
        assert.equal(um.class_name, 'UpdateManager');
        assert.deepEqual(table.connection, um.connection);
    },

    'should add an offset': function() {
        var table = new Table('users');
        var sm = table.skip(2);
        assert.equal(sm.toSql(), 'SELECT FROM "users" OFFSET 2');
    },

    'should return an empty select manager': function() {
        var table = new Table('users');
        var sm = table.selectManager();
        assert.equal(sm.toSql(), 'SELECT FROM "users"');
    },

    'adds a having clause': function() {
        var table = new Table('users');
        var sm = table.having(table.column('id').eq(10));
        assert.equal(sm.toSql(), 'SELECT FROM "users" HAVING "users"."id" = 10');
    },

    'should create a group': function() {
        var table = new Table('users');
        var sm = table.group(table.column('id'));
        assert.equal(sm.toSql(), 'SELECT FROM "users" GROUP BY "users"."id"');
    },

    'should create a node that proxies to a table': function() {
        var table = new Table('users');

        assert.deepEqual(table.aliases, []);
        var node = table.alias();
        assert.deepEqual(table.aliases, [node]);
        assert.equal(node.left, 'users_2');
        assert.equal(node.column('id').left, node);
    },

    'new': {
        'should accept a connection': function() {
            var table = new Table('users', 'foo');
            assert.equal(table.connection, 'foo');
        },

        'should accept a hash': function() {
            var table = new Table('users', {connection: 'foo'});
            assert.equal(table.connection, 'foo');
        },

        'ignores as if it equals name': function() {
            var table = new Table('users', {as: 'users'});
            assert.equal(table.table_alias, undefined);
        }
    },

    'should take an order': function() {
        var table = new Table('users');
        var sm = table.order(table.column('foo'));
        assert.equal(sm.toSql(), 'SELECT FROM "users" ORDER BY "users"."foo"');
    },

    'should add a limit': function() {
        var table = new Table('users');
        var sm = table.take(1);
        sm.project(nodes.asterisk);
        assert.equal(sm.toSql(), 'SELECT * FROM "users" LIMIT 1');
    },

    'project': {
        topic: new Table('users'),

        'can project': function(table) {
            var sm = table.project(nodes.asterisk);
            assert.equal(sm.toSql(), 'SELECT * FROM "users"');
        },

        'take multiple parameters': function(table) {
            var sm = table.project([nodes.asterisk, nodes.asterisk]);
            assert.equal(sm.toSql(), 'SELECT *, * FROM "users"');
        }
    },

    'where': function() {
        var table = new Table('users');
        var sm = table.where(table.column('id').eq(1));
        sm.project(table.column('id'));

        assert.equal(sm.class_name, 'SelectManager');
        assert.equal(sm.toSql(), 'SELECT "users"."id" FROM "users" WHERE "users"."id" = 1');
    },

    'should have a name': function() {
        var table = new Table('users');
        assert.equal(table.name, 'users');
    },

    'should have a connection': function() {
        Table.connection = 'SQLite';
        var table = new Table('users');
        assert.notEqual(table.connection, undefined);
    },

    'should quote table name': function() {
        Table.connection = 'SQLite';
        var table = new Table('users');
        assert.equal(table.quotedTableName(), '"users"');
    },

    'column': function() {
        var table = new Table('users');
        assert.equal(table.column('id').right, 'id');
    }
}).export(module);
