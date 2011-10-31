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
var Author = require('./models/authors');
var Developer = require('./models/developers');

var nodes = require('../lib/mapper/nodes');
var Table = require('../lib/mapper/table');
var visitors = require('../lib/mapper/visitors');

vows.describe('Relation').addBatch({
    'test multivalue where': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Post], function() {
                var posts = Post.where(['author_id = ? AND id = ?', 1, 1]).all();
                posts.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test multivalue where': function(error, topic) {
            assert.equal(topic.length, 1);
        }
    }
}).addBatch({
    'test finding with conditions': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var david = Author.where({name: 'David'}).all();
                david.on('rows', function(rows1) {
                    var mary = Author.where(["name = ?", 'Mary']).all();
                    mary.on('rows', function(rows2) {
                        promise.emit('success', [_.first(rows1), _.first(rows2)]);
                    });
                });
            });
            return promise;
        },

        'test finding with conditions': function(error, topic) {
            assert.deepEqual(_.first(topic).name, 'David');
            assert.deepEqual(_.last(topic).name, 'Mary');
        }
    }
}).addBatch({
    'test finding with order': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Topic], function() {
                var topics = Topic.order('id').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test finding with order': function(error, topic) {
            assert.equal(topic.length, 4);
            assert.equal(_.first(topic).title , 'The First Topic');
        }
    }
}).addBatch({
    'test finding with order concatenated': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Topic], function() {
                var topics = Topic.order('author_name').order('title').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test finding with order concatenated': function(error, topic) {
            assert.equal(topic.length, 4);
            assert.equal(_.first(topic).title , 'The Fourth Topic of the day');
        }
    }
}).addBatch({
    'test finding with order and take': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Entrant], function() {
                var entrants = Entrant.order('id ASC').limit(2).all();
                entrants.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test finding with order and take': function(error, topic) {
            assert.equal(topic.length, 2);
            assert.equal(_.first(topic).name , 'Ruby Developer');
        }
    }
}).addBatch({
    'test finding with order limit and offset': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Entrant], function() {
                var entrants = Entrant.order('id ASC').limit(2).offset(2).all();
                entrants.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test finding with order limit and offset': function(error, topic) {
            assert.equal(topic.length, 1);
            assert.equal(_.first(topic).name , 'Java Lover');
        }
    }
}).addBatch({
    'test find on hash conditions': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Topic], function() {
                var topics1 = Topic.find('all', {conditions: {approved: false}});
                topics1.on('rows', function(rows1) {
                    var topics2 = Topic.where({approved: false}).all();
                    topics2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find on hash conditions': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find id': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var authors = Author.find(1);
                authors.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find id': function(error, topic) {
            assert.equal(_.first(topic).name, 'David');
        }
    }
}).addBatch({
    'test find ids': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var authors = Author.find([1, 2]);
                authors.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find ids': function(error, topic) {
            assert.equal(topic.length, 2);
            assert.equal(_.first(topic).name, 'David');
            assert.equal(_.last(topic).name, 'Mary');
        }
    }
}).addBatch({
    'test find in empty array': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var authors = Author.where({id: []}).all();
                authors.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test find in empty array': function(error, topic) {
            assert.equal(topic.length, 0);
        }
    }
}).addBatch({
    'test exists': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var authors1 = Author.where({name: 'David'}).exists();
                authors1.on('exists', function(rows1) {
                    var authors2 = Author.exists(42);
                    authors2.on('exists', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test exists': function(error, topic) {
            assert.equal(_.first(topic), true);
            assert.equal(_.last(topic), false);
        }
    }
}).addBatch({
    'test last': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Author], function() {
                var authors = Author.last();
                authors.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test last': function(error, topic) {
            assert.equal(_.first(topic).name, 'Mary');
        }
    }
}).addBatch({
    'test count': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Post], function() {
                var posts1 = Post.count();
                posts1.on('value', function(count1) {
                    var posts2 = Post.count('all');
                    posts2.on('value', function(count2) {
                        var posts3 = Post.count('id');
                        posts3.on('value', function(count3) {
                            promise.emit('success', [count1, count2, count3]);
                        });
                    });
                });
            });
            return promise;
        },

        'test count': function(error, topic) {
            _.each(topic, function(val) {
                assert.equal(val, 7);
            });
        }
    }
}).addBatch({
    'test count with distinct': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Post], function() {
                var posts1 = Post.count('comments_count', {distinct: true});
                posts1.on('value', function(count1) {
                    var posts2 = Post.count('comments_count', {distinct: false});
                    posts2.on('value', function(count2) {
                        promise.emit('success', [count1, count2]);
                    });
                });
            });
            return promise;
        },

        'test count with distinct': function(error, topic) {
            assert.equal(_.first(topic), 3);
            assert.equal(_.last(topic), 7);
        }
    }
}).addBatch({
    'test multiple selects': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Post], function() {
                var posts = Post.select('comments_count').select('title').order('id ASC').first();
                posts.on('rows', function(rows) {
                    promise.emit('success', _.first(rows));
                });
            });
            return promise;
        },

        'test multiple selects': function(error, topic) {
            assert.equal(topic.title, 'Welcome to the weblog');
            assert.equal(topic.comments_count, 2);
        }
    }
}).addBatch({
    'test removing limit with options': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Post], function() {
                var posts = Post.limit(1).all({limit: undefined});
                posts.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test removing limit with options': function(error, topic) {
            assert.notEqual(topic.length, 1);
        }
    }
}).export(module);
