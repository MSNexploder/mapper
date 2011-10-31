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

vows.describe('Calculations').addBatch({
    'calculate': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Account, Topic], function() {
                promise.emit('success');
            });
            return promise;
        },

        'test should sum field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.sum('credit_limit');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should sum field': function(error, topic) {
                assert.equal(topic, 318);
            }
        },

        'test should return decimal average of integer field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.average('id');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should return decimal average of integer field': function(error, topic) {
                assert.equal(topic, 3.5);
            }
        },

        'test should get maximum of field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.maximum('credit_limit');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should get maximum of field': function(error, topic) {
                assert.equal(topic, 60);
            }
        },

        'test should get minimum of field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.minimum('credit_limit');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should get minimum of field': function(error, topic) {
                assert.equal(topic, 50);
            }
        },

        'test should group by field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.sum('credit_limit', {group: 'firm_id'});
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should group by field': function(error, topic) {
                _.each([50, 60, 105, 53], function(val) {
                    assert.ok(_.any(topic, function(value) {
                        return value.sum == val;
                    }));
                });
            }
        },

        'test should group by multiple fields having functions': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Topic.group(['author_name', 'COALESCE(type, title)']).count('all');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should group by multiple fields having functions': function(error, topic) {
                _.each(['Carl', 'Mary', 'David', 'Carl'], function(val) {
                    assert.ok(_.any(topic, function(value) {
                        return value.author_name == val;
                    }));
                });
            }
        },

        'test should order by grouped field': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.sum('credit_limit', {group: 'firm_id'});
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should order by grouped field': function(error, topic) {
                var ids = _.map(topic, function(val) {
                    return val.firm_id;
                });

                assert.deepEqual(ids, [null, 1, 2, 6, 9]);
            }
        },

        'test should limit calculation': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.sum('credit_limit', {conditions: 'firm_id IS NOT NULL', group: 'firm_id', order: 'firm_id', limit: 2});
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should limit calculation': function(error, topic) {
                var ids = _.map(topic, function(val) {
                    return val.firm_id;
                });

                assert.deepEqual(ids, [1, 2]);
            }
        },

        'test should limit calculation with offset': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.sum('credit_limit', {conditions: 'firm_id IS NOT NULL', group: 'firm_id', order: 'firm_id', limit: 2, offset: 1});
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test should limit calculation with offset': function(error, topic) {
                var ids = _.map(topic, function(val) {
                    return val.firm_id;
                });

                assert.deepEqual(ids, [2, 6]);
            }
        },

        'test count with column parameter': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.count('firm_id');
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test count with column parameter': function(error, topic) {
                assert.equal(topic, 5);
            }
        },

        'test count with column and options parameter': {
            topic: function() {
                var promise = new EventEmitter();
                var calc = Account.count('firm_id', {conditions: 'credit_limit = 50 AND firm_id IS NOT NULL'});
                calc.on('value', function(value) {
                    promise.emit('success', value);
                });
                return promise;
            },

            'test count with column and options parameter': function(error, topic) {
                assert.equal(topic, 2);
            }
        },
    }
}).export(module);
