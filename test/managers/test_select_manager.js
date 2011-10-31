var vows = require('vows');
var _ = require('underscore');
var assert = require('assert');

var Table = require('../../lib/mapper/table');
var nodes = require('../../lib/mapper/nodes');
var managers = require('../../lib/mapper/managers');

// TODO connection testing
vows.describe('SelectManager').addBatch({
    'initialize': {
        'uses alias in sql': function() {
            var table = new Table('users', {as: 'foo'});
            var sm = table.from();
            sm.skip(10);

            assert.equal(sm.toSql(), 'SELECT FROM "users" "foo" OFFSET 10');
        }
    },

    'skip': {
        'should add an offset': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.skip(10);

            assert.equal(sm.toSql(), 'SELECT FROM "users" OFFSET 10');
        },

        'chains': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm, sm.skip(10));
        }
    },

    'exists': {
        'should create an exists clause': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.project(nodes.asterisk);

            var sm2 = new managers.SelectManager(sm.connection);
            sm2.project(sm.exists());

            assert.equal(sm2.toSql(), 'SELECT EXISTS(SELECT * FROM "users")');
        },

        'can be aliased': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.project(nodes.asterisk);

            var sm2 = new managers.SelectManager(sm.connection);
            sm2.project(sm.exists().as('foo'));

            assert.equal(sm2.toSql(), 'SELECT EXISTS(SELECT * FROM "users") AS foo');
        }
    },

    'ast': {
        'should return the ast': function() {
            var table = new Table('users');
            var sm = table.from();
            var ast = sm.ast;

            assert.equal(sm.visitor.visit(ast), sm.toSql());
        }
    },

    'taken': {
        'should return limit': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.take(10);

            assert.equal(sm.taken(), 10);
        }
    },

    'lock': {
        'adds a lock node': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.lock();

            assert.notEqual(sm.ast.lock, undefined);
        }
    },

    'orders': {
        'returns order clauses': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.order(table.column('id'));

            assert.deepEqual(sm.orders(), [table.column('id')]);
        }
    },

    'order': {
        'generates order clauses': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.project(nodes.asterisk);
            sm.order(table.column('id'));

            assert.equal(sm.toSql(), 'SELECT * FROM "users" ORDER BY "users"."id"');
        },

        'chains': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm, sm.order(table.column('id')));
        }
    },

    'on': {
        'takes two params': function() {
            var left = new Table('users');
            var right = left.alias();
            var predicate = left.column('id').eq(right.column('id'));
            var manager = left.from();
            manager.join(right).on([predicate, predicate]);

            var sql = 'SELECT FROM "users" INNER JOIN "users" "users_2" ON "users"."id" = "users_2"."id" AND "users"."id" = "users_2"."id"';
            assert.equal(manager.toSql(), sql);
        },

        'takes three params': function() {
            var left = new Table('users');
            var right = left.alias();
            var predicate = left.column('id').eq(right.column('id'));
            var manager = left.from();
            manager.join(right).on([predicate, predicate, left.column('name').eq(right.column('name'))]);

            var sql = 'SELECT FROM "users" INNER JOIN "users" "users_2" ON "users"."id" = "users_2"."id" AND "users"."id" = "users_2"."id" AND "users"."name" = "users_2"."name"';
            assert.equal(manager.toSql(), sql);
        }
    },

    'should hand back froms': function() {
        var sm = new managers.SelectManager();
        assert.deepEqual(sm.froms(), []);
    },

    'should create and nodes': function() {
        var sm = new managers.SelectManager();
        var children = ['foo', 'bar', 'baz'];
        var clause = sm.createAnd(children);

        assert.equal(clause.class_name, 'And');
        assert.equal(clause.children, children);
    },

    'should create join nodes': function() {
        var sm = new managers.SelectManager();
        var join = sm.createJoin('foo', 'bar');

        assert.equal(join.class_name, 'InnerJoin');
        assert.equal(join.left, 'foo');
        assert.equal(join.right, 'bar');
    },

    'should create join nodes with a klass': function() {
        var sm = new managers.SelectManager();
        var join = sm.createJoin('foo', 'bar', 'OuterJoin');

        assert.equal(join.class_name, 'OuterJoin');
        assert.equal(join.left, 'foo');
        assert.equal(join.right, 'bar');
    },

    'join': {
        'responds to join': function() {
            var left = new Table('users');
            var right = left.alias();
            var predicate = left.column('id').eq(right.column('id'));
            var sm = new managers.SelectManager();

            sm.from(left);
            sm.join(right).on(predicate);
            var sql = 'SELECT FROM "users" INNER JOIN "users" "users_2" ON "users"."id" = "users_2"."id"';
            assert.equal(sm.toSql(), sql);
        },

        'takes a class': function() {
            var left = new Table('users');
            var right = left.alias();
            var predicate = left.column('id').eq(right.column('id'));
            var sm = new managers.SelectManager();

            sm.from(left);
            sm.join(right, 'OuterJoin').on(predicate);
            var sql = 'SELECT FROM "users" LEFT OUTER JOIN "users" "users_2" ON "users"."id" = "users_2"."id"';
            assert.equal(sm.toSql(), sql);
        },

        'noops on undefined': function() {
            var sm = new managers.SelectManager();
            assert.equal(sm, sm.join(undefined));
        }
    },

    'returns order clauses as a list': function() {
        var table = new Table('users');
        var sm = table.from();
        sm.order(table.column('id'));

        assert.deepEqual(_.first(sm.orderClauses()), new nodes.SqlLiteral('"users"."id"'));
    },

    'group': {
        'takes an attribute': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.group(table.column('id'));

            assert.equal(sm.toSql(), 'SELECT FROM "users" GROUP BY "users"."id"');
        },

        'chains': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm.group(table.column('id')), sm);
        },

        'takes multiple args': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.group([table.column('id'), table.column('name')]);

            assert.equal(sm.toSql(), 'SELECT FROM "users" GROUP BY "users"."id", "users"."name"');
        }
    },

    'where sql': {
        'gives me back the where sql': function() {
            var table = new Table('users');
            var sm = table.from();
            sm.where(table.column('id').eq(10));

            assert.deepEqual(sm.whereSql(), new nodes.SqlLiteral('WHERE "users"."id" = 10'));
        },

        'returns undefined when there are no wheres': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm.whereSql(), undefined);
        }
    },

    'project': {
        'takes multiple args': function() {
            var sm = new managers.SelectManager();
            sm.project([new nodes.SqlLiteral('foo'), new nodes.SqlLiteral('bar')]);

            assert.equal(sm.toSql(), 'SELECT foo, bar');
        },

        'takes strings': function() {
            var sm = new managers.SelectManager();
            sm.project('foo');

            assert.equal(sm.toSql(), 'SELECT foo');
        }
    },

    'take': function() {
        var table = new Table('users');
        var sm = table.from().project(table.column('id'));
        sm.where(table.column('id').eq(1));
        sm.take(1);

        assert.equal(sm.toSql(), 'SELECT "users"."id" FROM "users" WHERE "users"."id" = 1 LIMIT 1');
    },

    'where': {
        'knows where': function() {
            var table = new Table('users');
            var sm = table.from().project(table.column('id'));
            sm.where(table.column('id').eq(1));

            assert.equal(sm.toSql(), 'SELECT "users"."id" FROM "users" WHERE "users"."id" = 1');
        },

        'chains': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm.where(table.column('id').eq(1)), sm);
        }
    },

    'joins itself': function() {
        var left = new Table('users');
        var right = left.alias();
        var predicate = left.column('id').eq(right.column('id'));
        var sm = left.join(right);
        sm.project('*');

        assert.equal(sm.on(predicate), sm);

        var sql = 'SELECT * FROM "users" INNER JOIN "users" "users_2" ON "users"."id" = "users_2"."id"';
        assert.equal(sm.toSql(), sql);
    },

    'from': {
        'makes sql': function() {
            var table = new Table('users');
            var sm = table.from().project(table.column('id'));

            assert.equal(sm.toSql(), 'SELECT "users"."id" FROM "users"');
        },

        'chains': function() {
            var table = new Table('users');
            var sm = table.from();

            assert.equal(sm.project(table.column('id')), sm);
        }
    }
}).export(module);
