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
var OnCallbacksDeveloper =require('./models/on_callbacks_developers');
var ImmutableDeveloper = require('./models/immutable_developers');

var mapper = require('../lib/mapper');
var nodes = require('../lib/mapper/nodes');
var Table = require('../lib/mapper/table');
var visitors = require('../lib/mapper/visitors');

vows.describe('Callback').addBatch({
    'test on create': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([OnCallbacksDeveloper], function() {
                var david = OnCallbacksDeveloper.create({name: 'David', salary: 1000000});
                david.on('success', function() {
                    promise.emit('success', david);
                });
            });
            return promise;
        },

        'test on create': function(error, topic) {
            assert.deepEqual(topic.history(), ['before_save', 'before_create', 'after_create', 'after_save']);
        }
    }
}).addBatch({
    'test on update': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([OnCallbacksDeveloper], function() {
                var developer = OnCallbacksDeveloper.find(1);
                developer.on('row', function(row) {
                    if (undefined === row) { return; }
                    row.save();
                    row.on('success', function() {
                        promise.emit('success', row);
                    });
                });
            });
            return promise;
        },

        'test on update': function(error, topic) {
            assert.deepEqual(topic.history(), ['before_save', 'before_update', 'after_update', 'after_save']);
        }
    }
}).addBatch({
    'test on destroy': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([OnCallbacksDeveloper], function() {
                var developer = OnCallbacksDeveloper.find(1);
                developer.on('row', function(row) {
                    if (undefined === row) { return; }
                    row.destroy();
                    row.on('success', function() {
                        promise.emit('success', row);
                    });
                });
            });
            return promise;
        },

        'test on destroy': function(error, topic) {
            assert.deepEqual(topic.history(), ['before_destroy', 'after_destroy']);
        }
    }
}).addBatch({
    'test before save returning false': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([ImmutableDeveloper], function() {
                var developer = ImmutableDeveloper.find(1);
                developer.on('row', function(row) {
                    if (undefined === row) { return; }
                    row.save();
                    row.on('error', function(error) {
                        promise.emit('success', row);
                    });
                });
            });
            return promise;
        },

        'test before save returning false': function(error, topic) {
            assert.ok(topic.cancelled());
        }
    }
}).addBatch({
    'test before destroy returning false': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([ImmutableDeveloper], function() {
                var developer = ImmutableDeveloper.find(1);
                developer.on('row', function(row) {
                    if (undefined === row) { return; }
                    row.destroy();
                    row.on('error', function(error) {
                        promise.emit('success', row);
                    });
                });
            });
            return promise;
        },

        'test before destroy returning false': function(error, topic) {
            assert.ok(topic.cancelled());
        }
    }
}).export(module);
