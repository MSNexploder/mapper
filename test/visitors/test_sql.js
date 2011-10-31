var vows = require('vows');
var assert = require('assert');

var Table = require('../../lib/mapper/table');
var nodes = require('../../lib/mapper/nodes');
var visitors = require('../../lib/mapper/visitors');

vows.describe('SQL visitor').addBatch({
    'SQL visitor': {
        topic: function() {
            var table = new Table('users');

            return {
                visitor: new visitors.SQL(),
                table: table,
                attr: table.column('id')
            };
        },

        'should not quote sql literals': function(topic) {
            var node = topic.table.column(nodes.asterisk);
            var result = topic.visitor.visit(node);

            assert.equal(result, '"users".*');
        },

        'should visit named functions': function(topic) {
            var func = new nodes.NamedFunction('omg', nodes.asterisk);
            var result = topic.visitor.visit(func);

            assert.equal(result, 'omg(*)');
        },

        'works with lists': function(topic) {
            var func = new nodes.NamedFunction('omg', [nodes.asterisk, nodes.asterisk]);
            var result = topic.visitor.visit(func);

            assert.equal(result, 'omg(*, *)');
        },

        "describe 'equality'": {
            'should handle false': function(topic) {
                var node = new nodes.Equality(false, false);
                var result = topic.visitor.visit(node);

                assert.equal(result, "'f' = 'f'");
            },

            'should use the column to quote': function(topic) {
                var node = new nodes.Equality(topic.table.column('id'), 1);
                var result = topic.visitor.visit(node);

                assert.equal(result, '"users"."id" = 1');
            },

            'should escape strings': function(topic) {
                var node = topic.table.column('name').eq('Stefan Huber');
                var result = topic.visitor.visit(node);

                assert.equal(result, '"users"."name" = \'Stefan Huber\'');
            }
        },

        'should escape LIMIT': function(topic) {
            var stmt = new nodes.SelectStatement();
            stmt.limit = new nodes.Limit('omg');
            var result = topic.visitor.visit(stmt);

            assert.equal(result, "SELECT LIMIT 'omg'");
        },

        'should visits Date': function(topic) {
            var result = topic.visitor.visit(new Date(1234567890));

            assert.equal(result, "'Thu, 15 Jan 1970 06:56:07 GMT'");
        },

        'should visit integer': function(topic) {
            var result = topic.visitor.visit(1);

            assert.equal(result, '1');
        },

        'should visit float': function(topic) {
            var result = topic.visitor.visit(2.14);

            assert.equal(result, "'2.14'");
        },

        'should visit Not': function(topic) {
            var node = new nodes.Not(new nodes.SqlLiteral('foo'));
            var result = topic.visitor.visit(node);

            assert.equal(result, 'NOT (foo)');
        },

        'should apply Not to the whole expression': function(topic) {
            var node = new nodes.And([topic.attr.eq(10), topic.attr.eq(11)]);
            var result = topic.visitor.visit(new nodes.Not(node));

            assert.equal(result, 'NOT ("users"."id" = 10 AND "users"."id" = 11)');
        },

        'should visit As': function(topic) {
            var node = new nodes.As(new nodes.SqlLiteral('foo'), new nodes.SqlLiteral('bar'));
            var result = topic.visitor.visit(node);

            assert.equal(result, 'foo AS bar');
        },

        'should visit undefined': function(topic) {
            var result = topic.visitor.visit(undefined);

            assert.equal(result, 'NULL');
        },

        'should visit And': function(topic) {
            var node = new nodes.And([topic.attr.eq(10), topic.attr.eq(11)]);
            var result = topic.visitor.visit(node);

            assert.equal(result, '"users"."id" = 10 AND "users"."id" = 11');
        },

        'should visit Or': function(topic) {
            var node = new nodes.Or([topic.attr.eq(10), topic.attr.eq(11)]);
            var result = topic.visitor.visit(node);

            assert.equal(result, '"users"."id" = 10 OR "users"."id" = 11');
        },

        'should visit true': function(topic) {
            var node = topic.table.column('bool').eq(true);
            var result = topic.visitor.visit(node);

            assert.equal(result, '"users"."bool" = \'t\'');
        },

        'should visit ordering': function(topic) {
            var result = topic.visitor.visit(topic.attr.desc());

            assert.equal(result, '"users"."id" DESC');
        },

        'in node': {
            'should visit': function(topic) {
                var result = topic.visitor.visit(topic.attr.in([1, 2, 3]));

                assert.equal(result, '"users"."id" IN (1, 2, 3)');
            },

            'should turn empty right to NULL': function(topic) {
                var result = topic.visitor.visit(topic.attr.in([]));

                assert.equal(result, '"users"."id" IN (NULL)');
            },

            'can handle subqueries': function(topic) {
                var where = topic.table.column('name').eq('Stefan');
                var subquery = topic.table.project('id').where(where);
                var node = topic.attr.in(subquery);
                var result = topic.visitor.visit(node);

                assert.equal(result, '"users"."id" IN (SELECT id FROM "users" WHERE "users"."name" = \'Stefan\')');
            },
        },

        'not in node': {
            'should visit': function(topic) {
                var result = topic.visitor.visit(topic.attr.notIn([1, 2, 3]));

                assert.equal(result, '"users"."id" NOT IN (1, 2, 3)');
            },

            'should turn empty right to NULL': function(topic) {
                var result = topic.visitor.visit(topic.attr.notIn([]));

                assert.equal(result, '"users"."id" NOT IN (NULL)');
            },

            'can handle subqueries': function(topic) {
                var where = topic.table.column('name').eq('Stefan');
                var subquery = topic.table.project('id').where(where);
                var node = topic.attr.notIn(subquery);
                var result = topic.visitor.visit(node);

                assert.equal(result, '"users"."id" NOT IN (SELECT id FROM "users" WHERE "users"."name" = \'Stefan\')');
            },
        }
    }
}).export(module);
