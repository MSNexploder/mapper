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

vows.describe('Base').addBatch({
    'test limit with comma': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.limit('1,2').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
                topics.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test limit with comma': function(error, topic) {
            assert.equal(error, null);
        }
    }
}).addBatch({
    'test limit without comma': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.limit('1').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
                topics.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test limit without comma': function(error, topic) {
            assert.equal(error, null);
            assert.equal(topic.length, 1);
        }
    }
}).addBatch({
    'test invalid limit': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.limit('asdfasf').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
                topics.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test invalid limit': function(error, topic) {
            assert.notEqual(error, null);
        }
    }
}).addBatch({
    'test limit should sanitize sql injection for limit without comas': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.limit('1 select * from schema').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', topics.toSql());
                });
                topics.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test limit should sanitize sql injection for limit without comas': function(error, topic) {
            assert.equal(error, null);
            assert.equal(topic.match(/from schema/), null);
        }
    }
}).addBatch({
    'test limit should sanitize sql injection for limit with comas': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.limit('1, 7 procedure help()').all();
                topics.on('rows', function(rows) {
                    promise.emit('success', topics.toSql());
                });
                topics.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test limit should sanitize sql injection for limit with comas': function(error, topic) {
            assert.equal(error, null);
            assert.equal(topic.match(/procedure help/), null);
        }
    }
}).addBatch({
    'test initialize with attributes': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = new Topic({title: 'initialized from attributes', written_on: '2003-12-12 23:23'});
                promise.emit('success', topic);
            });
            return promise;
        },

        'test initialize with attributes': function(error, topic) {
            assert.equal(topic.title, 'initialized from attributes');
        }
    }
}).addBatch({
    'test load': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.find('all', {order: 'id'});
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test load': function(error, topic) {
            assert.equal(topic.length, 4);
            assert.equal(_.first(topic).title, 'The First Topic');
        }
    }
}).addBatch({
    'test load with condition': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.find('all', {conditions: "author_name = 'Mary'"});
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test load with condition': function(error, topic) {
            assert.equal(topic.length, 1);
            assert.equal(_.first(topic).author_name, 'Mary');
        }
    }
}).addBatch({
    'test sql injection via find': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.find('123456 OR id > 0');
                topics.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test sql injection via find': function(error, topic) {
            assert.equal(topic.length, 0);
        }
    }
}).addBatch({
    'test quote': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = new Topic({author_name: "\\ \001 ' \n \\n \""});
                topic.save();
                topic.on('success', function(action, row) {
                    promise.emit('success', row);
                });
            });
            return promise;
        },

        'test quote': function(error, topic) {
            assert.equal(topic.author_name, "\\ \001 ' \n \\n \"");
        }
    }
}).addBatch({
    'test no limit offset': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers = Developer.find({offset: 2});
                developers.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
                developers.on('error', function(error) {
                    promise.emit('error', error);
                });
            });
            return promise;
        },

        'test no limit offset': function(error, topic) {
            assert.equal(error, null);
        }
    }
}).addBatch({
    'test find last': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developer1 = Developer.find('last');
                developer1.on('rows', function(rows1) {
                    var developer2 = Developer.find('first', {order: 'id DESC'});
                    developer2.on('rows', function(rows2) {
                        promise.emit('success', [_.first(rows1), _.first(rows2)]);
                    });
                });
            });
            return promise;
        },

        'test find last': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test last': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developer1 = Developer.last();
                developer1.on('rows', function(rows1) {
                    var developer2 = Developer.find('first', {order: 'id DESC'});
                    developer2.on('rows', function(rows2) {
                        promise.emit('success', [_.first(rows1), _.first(rows2)]);
                    });
                });
            });
            return promise;
        },

        'test last': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test all': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.all();
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('all');
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test all': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test all with conditions': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.order('id DESC').all();
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('all', {order: 'id DESC'});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test all with conditions': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find ordered last': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.last({order: 'salary ASC'});
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('last', {order: 'salary ASC'});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find ordered last': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find reverse ordered last': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.last({order: 'salary DESC'});
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('last', {order: 'salary DESC'});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find reverse ordered last': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find multiple ordered last': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.last({order: 'name, salary DESC'});
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('last', {order: 'name, salary DESC'});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find multiple ordered last': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find keeps multiple order values': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.find('all', {order: 'name, salary'});
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('all', {order: ['name', 'salary']});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find keeps multiple order values': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).addBatch({
    'test find keeps multiple group values': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Developer], function() {
                var developers1 = Developer.find('all', {group: 'name, salary, id, created_at, updated_at'});
                developers1.on('rows', function(rows1) {
                    var developers2 = Developer.find('all', {group: ['name', 'salary', 'id', 'created_at', 'updated_at']});
                    developers2.on('rows', function(rows2) {
                        promise.emit('success', [rows1, rows2]);
                    });
                });
            });
            return promise;
        },

        'test find keeps multiple group values': function(error, topic) {
            assert.deepEqual(_.first(topic), _.last(topic));
        }
    }
}).export(module);
