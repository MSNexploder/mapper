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

vows.describe('Has one associations').addBatch({
    'test has one': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Company, Account], function() {
                var accounts = Company.first().accounts();
                accounts.on('rows', function(rows) {
                    promise.emit('success', rows);
                });
            });
            return promise;
        },

        'test has one': function(error, topic) {
            _.each(topic, function(account) {
                assert.ok(_.include([50, 60], account.credit_limit));
            });
        }
    }
}).addBatch({
    'test natural assignment': {
        topic: function() {
            var promise = new EventEmitter();

            helper.recreateTables([Company, Account], function() {
                var apple = new Company({name: 'Apple'});
                var save = apple.save();
                save.on('success', function(action, row) {
                    var citibank = new Account({credit_limit: 10});
                    row.accounts = citibank;
                    var save2 = citibank.save();
                    save2.on('success', function(action, row2) {
                        promise.emit('success', [row, row2]);
                    });
                });
            });
            return promise;
        },

        'test natural assignment': function(error, topic) {
            assert.equal(_.last(topic).firm_id, _.first(topic).id);
        }
    }
}).addBatch({
    //'test natural assignment to undefined': {
    //    topic: function() {
    //        var promise = new EventEmitter();
    //
    //        helper.recreateTables([Company, Account], function() {
    //            var company = Company.first();
    //            company.on('row', function(row) {
    //                if (undefined === row) { return; }
    //                row.accounts = undefined;
    //                var save = row.save();
    //                save.on('success', function(action, row2) {
    //                    var accounts = row2.accounts.all();
    //                    accounts.on('rows', function(rows) {
    //                        promise.emit('success', rows);
    //                    });
    //                });
    //            });
    //        });
    //        return promise;
    //    },
    //
    //    'test natural assignment to undefined': function(error, topic) {
    //        assert.deepEqual(topic, []);
    //    }
    //}
}).addBatch({
    //'test natural assignment to null': {
    //    topic: function() {
    //        var promise = new EventEmitter();
    //
    //        helper.recreateTables([Company, Account], function() {
    //            var company = Company.first();
    //            company.on('row', function(row) {
    //                if (undefined === row) { return; }
    //                row.accounts = null;
    //                var save = row.save();
    //                save.on('success', function(action, row2) {
    //                    var accounts = row2.accounts.all();
    //                    accounts.on('rows', function(rows) {
    //                        promise.emit('success', rows);
    //                    });
    //                });
    //            });
    //        });
    //        return promise;
    //    },
    //
    //    'test natural assignment to null': function(error, topic) {
    //        assert.deepEqual(topic, []);
    //    }
    //}
}).export(module);
