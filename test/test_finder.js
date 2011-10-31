var vows = require('vows');
var assert = require('assert');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var helper = require('./helper');

var Topic = require('./models/topics');
var Account = require('./models/accounts');
var Company = require('./models/companies');
var Firm = require('./models/firms');
var Client = require('./models/clients');
var Entrant = require('./models/entrants');
var Post = require('./models/posts');
var Developer = require('./models/developers');

var nodes = require('../lib/mapper/nodes');
var Table = require('../lib/mapper/table');
var visitors = require('../lib/mapper/visitors');

vows.describe('Finder').addBatch({
    'test find': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Topic], function() {
                var topic1 = Topic.find('first');
                topic1.on('rows', function(rows1) {
                    var topic2 = Topic.find(1);
                    topic2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find': function(error, topics) {
            assert.equal(_.first(topics).title, _.last(topics).title);
        }
    }
}).addBatch({
    'test find with string': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic1 = Topic.find('1');
                topic1.on('rows', function(rows1) {
                    var topic2 = Topic.find(1);
                    topic2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find with string': function(error, topics) {
            assert.equal(_.first(topics).title, _.last(topics).title);
        }
    }
}).addBatch({
    'test find with array': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic1 = Topic.find([1]);
                topic1.on('rows', function(rows1) {
                    var topic2 = Topic.find(1);
                    topic2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find with string': function(error, topics) {
            assert.equal(_.first(topics).title, _.last(topics).title);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists(1);
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists('1');
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists({author_name: 'David'});
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists({author_name: 'Mary', approved: true});
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists(['parent_id = ?', 1]);
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists(45);
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test not exists': function(error, topic) {
            assert.ok(!topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.exists();
                topic.on('exists', function(exists) {
                    promise.emit('success', exists);
                });
            });
            return promise;
        },

        'test exists returns true with no args': function(error, topic) {
            assert.ok(topic);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var del = Topic.deleteAll();
                del.on('success', function(success) {
                    var topic = Topic.exists();
                    topic.on('exists', function(exists) {
                        promise.emit('success', exists);
                    });
                });
            });
            return promise;
        },

        'test does not exist with empty table and no args given': function(error, topic) {
            assert.ok(!topic);
        }
    }
}).addBatch({
    'test find by ids': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find([1, 2]);
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find by ids': function(error, topic) {
            assert.equal(topic.length, 2);
        }
    }
}).addBatch({
    'test find by ids with limit and offset': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic1 = Topic.find([1, 3, 2], {limit: 2});
                topic1.on('rows', function(rows1) {
                    var topic2 = Topic.find([1, 3, 2], {limit: 3, offset: 2});
                    topic2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find by ids with limit and offset': function(error, topic) {
            assert.equal(_.first(topic).length, 2);
            assert.equal(_.last(topic).length, 1);
        }
    }
}).addBatch({
    'test find an empty array': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find([]);
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find an empty array': function(error, topic) {
            assert.equal(topic.length, 0);
        }
    }
}).addBatch({
    'test find an empty array': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find([1, 2, 45]);
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find an empty array': function(error, topic) {
            assert.equal(topic.length, 2);
        }
    }
}).addBatch({
    'test find all with limit': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic1 = Topic.find('all', {limit: 2});
                topic1.on('rows', function(rows1) {
                    var topic2 = Topic.find('all', {limit: 0});
                    topic2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find all with limit': function(error, topic) {
            assert.equal(_.first(topic).length, 2);
            assert.equal(_.last(topic).length, 0);
        }
    }
}).addBatch({
    'test find all with prepared limit and offset': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Entrant], function() {
                var entrants = Entrant.find('all', {order: 'id ASC', limit: 2, offset: 1});
                entrants.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find all with prepared limit and offset': function(error, topic) {
            assert.equal(topic.length, 2);
            assert.equal(_.first(topic).name, 'Ruby Guru');
        }
    }
}).addBatch({
    'test find all with limit and offset and multiple order clauses': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Post], function() {
                var posts1 = Post.find('all', {order: 'author_id, id', limit: 3, offset: 0});
                posts1.on('rows', function(rows1) {
                    var posts2 = Post.find('all', {order: 'author_id, id', limit: 3, offset: 3});
                    posts2.on('rows', function(rows2) {
                        var posts3 = Post.find('all', {order: 'author_id, id', limit: 3, offset: 6});
                        posts3.on('rows', function(rows3) {
                            promise.emit('success', [rows1, rows2, rows3]);
                        });
                    });
                });
            });
            return promise;
        },

        'test find all with limit and offset and multiple order clauses': function(error, topic) {
            assert.deepEqual(_.map(topic[0], function(val) { return [val.author_id, val.id]; }), [[0,3],[1,1],[1,2]]);
            assert.deepEqual(_.map(topic[1], function(val) { return [val.author_id, val.id]; }), [[1,4],[1,5],[1,6]]);
            assert.deepEqual(_.map(topic[2], function(val) { return [val.author_id, val.id]; }), [[2,7]]);
        }
    }
}).addBatch({
    'test find with group': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers = Developer.find('all', {group: 'salary', select: 'salary'});
                developers.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find with group': function(error, topic) {
            assert.equal(topic.length, 4);
            assert.equal(_.uniq(_.map(topic, function(val) { return val.salary; })).length, 4);
        }
    }
}).addBatch({
    'test find with group and having': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers = Developer.find('all', {group: 'salary', having: 'SUM(salary) > 10000', select: 'salary'});
                developers.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find with group and having': function(error, topic) {
            assert.equal(topic.length, 3);
            assert.equal(_.uniq(_.map(topic, function(val) { return val.salary; })).length, 3);
            assert.ok(_.all(topic, function(val) {return val.salary > 10000;} ));
        }
    }
}).addBatch({
    'test find with group and sanitized having': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers = Developer.find('all', {group: 'salary', having: ['SUM(salary) > ?', 10000], select: 'salary'});
                developers.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find with group and sanitized having': function(error, topic) {
            assert.equal(topic.length, 3);
            assert.equal(_.uniq(_.map(topic, function(val) { return val.salary; })).length, 3);
            assert.ok(_.all(topic, function(val) {return val.salary > 10000;} ));
        }
    }
}).addBatch({
    'test find with entire select statement': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.findBySql("SELECT * FROM topics WHERE author_name = 'Mary'");
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find with entire select statement': function(error, topic) {
            assert.equal(topic.length, 1);
            assert.equal(_.first(topic).author_name, 'Mary');
        }
    }
}).addBatch({
    'test find with prepared select statement': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.findBySql("SELECT * FROM topics WHERE author_name = ?", ['Mary']);
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find with prepared select statement': function(error, topic) {
            assert.equal(topic.length, 1);
            assert.equal(_.first(topic).author_name, 'Mary');
        }
    }
}).addBatch({
    'test find first': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find('first', {conditions: "title = 'The First Topic'"});
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find first': function(error, topic) {
            assert.equal(topic.length, 1);
            assert.equal(_.first(topic).title, 'The First Topic');
        }
    }
}).addBatch({
    'test find first failing': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find('first', {conditions: "title = 'The First Topic!'"});
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find first failing': function(error, topic) {
            assert.equal(topic.length, 0);
        }
    }
}).addBatch({
    'test find only some columns': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find(1, {select: "author_name"});
                topic.on('rows', function(rows) {
                    promise.emit('success', _.first(rows));
                });
            });
            return promise;
        },

        'test find only some columns': function(error, topic) {
            assert.equal(topic.title, undefined);
            assert.equal(topic.author_name, "David");
        }
    }
}).addBatch({
    'test find on array conditions': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find(1, {conditions: ["approved = ?", false]});
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find on array conditions': function(error, topic) {
            assert.equal(topic.length, 1);
        }
    }
}).addBatch({
    'test find on hash conditions': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.find(1, {conditions: {approved: false}});
                topic.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find on hash conditions': function(error, topic) {
            assert.equal(topic.length, 1);
        }
    }
}).export(module);
