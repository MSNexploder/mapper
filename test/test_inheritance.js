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

vows.describe('Inheritance').addBatch({
    'test inheritance find': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                promise.emit('success');
            });
            return promise;
        },
        
        'test find first': {
            topic: function() {
                var promise = new EventEmitter();
                var firm = Firm.first();
                firm.on('row', function(row) {
                    if (undefined === row) { return; }
                    promise.emit('success', row);
                });
                return promise;
            },

            'test find first': function(error, topic) {
                assert.equal(topic.name, '37signals');
            }
        },

        'test find with id': {
            topic: function() {
                var promise = new EventEmitter();
                var client = Client.find(2);
                client.on('row', function(row) {
                    if (undefined === row) { return; }
                    promise.emit('success', row);
                });
                return promise;
            },

            'test find with id': function(error, topic) {
                assert.equal(topic.name, 'Summit');
            }
        },
        
        'test find all': {
            topic: function() {
                var promise = new EventEmitter();
                var client = Company.find('all', {order: 'id'});
                client.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
                return promise;
            },

            'test find all': function(error, topic) {
                assert.equal(topic[0].name, '37signals');
                assert.equal(topic[1].name, 'Summit');
            }
        }
    }
}).addBatch({
    'test inheritance save': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                var firm = new Firm();
                firm.name = 'Next Angle';
                var save = firm.save();
                save.on('success', function(action, value) {
                    var company = Company.find(value.id);
                    company.on('row', function(row) {
                        if (undefined === row) { return; }
                        promise.emit('success', row);
                    });
                });
            });
            return promise;
        },

        'test inheritance save': function(error, topic) {
            assert.equal(topic.name, 'Next Angle');
            assert.equal(topic.type, 'firms');
        }
    }
}).addBatch({
    'test inheritance condition': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                var company = Company.count();
                company.on('value', function(val1) {
                    var firm = Firm.count();
                    firm.on('value', function(val2) {
                        var client = Client.count();
                        client.on('value', function(val3) {
                            promise.emit('success', [val1, val2, val3]);
                        });
                    });
                });
            });
            return promise;
        },

        'test inheritance condition': function(error, topic) {
            assert.equal(topic[0], 10);
            assert.equal(topic[1], 2);
            assert.equal(topic[2], 4);
        }
    }
}).addBatch({
    'test update all within inheritance': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                var clients = Client.updateAll("name = 'I am a client'");
                clients.on('success', function(affected) {
                    var client = Client.first();
                    client.on('row', function(row) {
                        if (undefined === row) { return; }
                        var firm = Firm.find('first', {order: 'id'});
                        firm.on('row', function(row2) {
                            if (undefined === row2) { return; }
                            promise.emit('success', [row, row2]);
                        });
                    });
                });
            });
            return promise;
        },

        'test update all within inheritance': function(error, topic) {
            assert.equal(_.first(topic).name, 'I am a client');
            assert.equal(_.last(topic).name, '37signals');
        }
    }
}).addBatch({
    'test delete all within inheritance': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                var clients = Client.deleteAll();
                clients.on('success', function(affected) {
                    var clients_count = Client.count();
                    clients_count.on('value', function(count1) {
                        var firms_count = Firm.count();
                        firms_count.on('value', function(count2) {
                            promise.emit('success', [count1, count2]);
                        });
                    });
                });
            });
            return promise;
        },

        'test delete all within inheritance': function(error, topic) {
            assert.equal(_.first(topic), 0);
            assert.equal(_.last(topic), 2);
        }
    }
}).addBatch({
    'test find first within inheritance': {
        topic: function() {
            var promise = new EventEmitter();
            helper.recreateTables([Company], function() {
                var company = Company.find('first', {conditions: "name = '37signals'"});
                company.on('rows', function(rows1) {
                    var firm = Firm.find('first', {conditions: "name = '37signals'"});
                    firm.on('rows', function(rows2) {
                        var client = Client.find('first', {conditions: "name = '37signals'"});
                        client.on('rows', function(rows3) {
                            promise.emit('success', [_.first(rows1), _.first(rows2), _.first(rows3)]);
                        });
                    });
                });
            });
            return promise;
        },

        'test find first within inheritance': function(error, topic) {
            assert.equal(topic[0].name, '37signals');
            assert.equal(topic[1].name, '37signals');
            assert.equal(topic[2], undefined);
        }
    }
}).export(module);
