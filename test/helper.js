var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var mapper = require('../lib/mapper');

var database = process.env.MAPPERJS_TEST_DATABASE || 'sqlite3';
switch (database) {
    case 'mysql':
        mapper.configuration = {adapter: 'mysql', database: 'test'};
        break;
    case 'mysql-pure':
        mapper.configuration = {adapter: 'mysql-pure', database: 'test'};
        break;
    case 'sqlite':
        mapper.configuration = {adapter: 'sqlite', database_path: './test.db'}; // kinda broken
        break;
    case 'sqlite3':
        mapper.configuration = {adapter: 'sqlite3', database_path: './test.db'};
        break;
    default: mapper.configuration = {adapter: 'sqlite3', database_path: './test.db'};
}

var createObjectsFromJSON = function(name, json, fun) {
    var counter = json.length;
    var model_path = path.resolve(__dirname, './models/' + name.toLowerCase());
    var model = require(model_path);
    var callback = function() {
        counter--;
        if (counter === 0) {
            fun();
        }
    };

    _.each(json, function(attributes) {
        object = new model();
        object.attributes = attributes;
        object.save();
        object.on('success', callback);
    });
};

var loadFixtures = function(name, fun) {
    var fixture_path = path.resolve(__dirname, './fixtures/' + name.toLowerCase() + '.js');
    var fixture = fs.readFile(fixture_path, 'utf-8', function(error, json) {
        if (error) {
            // no fixture file found
            if (error.errno == 2) {
                console.log('No fixture file for ' + name + ' found!');
                fun();
                return;
            }
            console.log(error);
            return;
        }
        var data = {};
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.log('Invalid fixture file for ' + name + ' found!');
            console.log(e);
        }
        createObjectsFromJSON(name, data, fun);
    });
};

var recreateTables = function(models, fun) {
    var models_count = models.length;
    var callback = function() {
        models_count -= 1;
        if (models_count === 0) {
            fun.call(this);
        }
    };

    _.each(models, function(model) {
        var connection = model.tableConnection();
        connection.dropTable(model, function() {
            connection.createTable(model, function() {
                loadFixtures(model.class_name, callback);
            });
        });
    });
};

module.exports = {
    recreateTables: recreateTables,
    loadFixtures: loadFixtures
};
