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

vows.describe('Persistence').addBatch({
    'test save null string attributes': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.find(1);
                topics.on('rows', function(rows) {
                    var topic = _.first(rows);
                    topic.attributes = {title: 'null', author_name: 'null'};
                    var save = topic.save();
                    save.on('success', function() {
                        var new_topics = Topic.find(1);
                        new_topics.on('rows', function(rows) {
                            promise.emit('success', _.first(rows));
                        });
                    });
                });
            });
            return promise;
        },

        'test save null string attributes': function(error, topic) {
            assert.equal(topic.title, 'null');
            assert.equal(topic.author_name, 'null');
        }
    }
}).addBatch({
    'test save undefined string attribute': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topics = Topic.find(1);
                topics.on('rows', function(rows) {
                    var topic = _.first(rows);
                    topic.title = undefined;
                    var save = topic.save();
                    save.on('success', function() {
                        var new_topics = Topic.find(1);
                        new_topics.on('rows', function(rows) {
                            promise.emit('success', _.first(rows));
                        });
                    });
                });
            });
            return promise;
        },

        'test save undefined string attribute': function(error, topic) {
            assert.equal(topic.title, undefined);
        }
    }
}).addBatch({
    'test update many': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic_data = { 1: { content: "1 updated" }, 2: { content: "2 updated" } };
                var topic = Topic.update(_.keys(topic_data), _.values(topic_data));
                topic.on('success', function() {
                    var topics = Topic.find([1, 2]);
                    topics.on('rows', function(rows) {
                        promise.emit('success', rows);
                    });
                });
            });
            return promise;
        },

        'test update many': function(error, topic) {
            assert.equal(topic.length, 2);
            assert.equal(_.first(topic).content, '1 updated');
            assert.equal(_.last(topic).content, '2 updated');
        }
    }
}).addBatch({
    'test delete all': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.deleteAll();
                topic.on('success', function() {
                    var topics = Topic.all();
                    topics.on('rows', function(rows) {
                        promise.emit('success', rows);
                    });
                });
            });
            return promise;
        },

        'test delete all': function(error, topic) {
            assert.equal(topic.length, 0);
        }
    }
}).addBatch({
    'test delete many': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var original_count = Topic.count();
                original_count.on('value', function(org_count) {
                    var delete_topics = Topic.delete([1, 2]);
                    delete_topics.on('success', function() {
                        var new_count = Topic.count();
                        new_count.on('value', function(count) {
                            promise.emit('success', [org_count, count]);
                        });
                    });
                });
            });
            return promise;
        },

        'test delete many': function(error, topic) {
            assert.equal(_.last(topic), _.first(topic) - 2);
        }
    }
}).addBatch({
    'test update by condition': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var topic = Topic.updateAll("content = 'bulk updated!'", ["approved = ?", true]);
                topic.on('success', function(affected) {
                    promise.emit('success', affected);
                });
            });
            return promise;
        },

        'test update by condition': function(error, topic) {
            assert.equal(topic, 3);
        }
    }
}).addBatch({
    'test create': {
        topic: function() {
            var promise = new EventEmitter();
            var topic = new Topic();
            topic.title = 'New Topic';
            topic.save();
            topic.on('success', function() {
                promise.emit('success', topic);
            });
            return promise;
        },

        'test create': function(error, topic) {
            assert.equal(topic.title, 'New Topic');
            assert.ok(topic.id);
        }
    }
}).addBatch({
    'test create many': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Topic], function() {
                var create = Topic.create([ { title: "first" }, { title: "second" }]);
                create.on('success', function(rows) {
                    var topics = Topic.count();
                    topics.on('value', function(rows) {
                        promise.emit('success', rows);
                    });
                });
            });
            return promise;
        },

        'test create many': function(error, topic) {
            assert.equal(topic, 6);
        }
    }
}).export(module);
