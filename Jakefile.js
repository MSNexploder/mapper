var sys = require('sys');
var util = require('util');
var _ = require('underscore');
var exec = require('child_process').exec;

var runShellCommand = function(command, fun) {
    exec(command, function (error, stdout, stderr) {
        if (error !== null) {
          console.log('error running command "' + command + '": ' + error);
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
        } else {
            fun(stdout, stderr);
        }
    });
};

var createDoccoForModule = function(name, path, fun) {
    var final_path = 'doc/source/' + name + '/';

    console.log('creating documentation for the "' + name + '" module...');
    runShellCommand('rm -rf docs', function(stdout, stderr) {
        runShellCommand('docco ' + path, function(stdout, stderr) {
            runShellCommand('mkdir -p ' + final_path, function(stdout, stderr) {
                runShellCommand('cp -r docs/* ' + final_path, fun);
            });
        });
    });
};

var createModuleDocumentation = function() {
    var module_names = ['associations', 'base', 'relation'];
    var module_files = ['lib/mapper/associations/*.js', 'lib/mapper/base/*.js', 'lib/mapper/relation/*.js'];
    var modules = _.zip(module_names, module_files);

    // recursively create module documentation
    var callback = function(stdout, stderr) {
        if (_.isEmpty(modules)) {
            runShellCommand('rm -rf docs', function(stdout, stderr) {
                console.log('created documentation.');
            });
            return;
        }

        var module = modules.shift();
        createDoccoForModule(_.first(module), _.last(module), callback);
    };

    callback();
};

desc('Runs default task (test).');
task('default', ['test'], function(params) {});

desc('Runs tests.');
task('test', ['test:default'], function(params) {});

namespace('test', function () {
    desc('Runs tests with default settings.');
    task('default', [], function(params) {
        console.log('running tests...');
        if (!_.include(['mysql', 'mysql-pure', 'sqlite', 'sqlite3'], params)) {
            params = 'sqlite3';
        }

        runShellCommand('export MAPPERJS_TEST_DATABASE=' + params + ' && find test -path "test/models" -prune -o -name "test_*.js" -print | xargs vows', function(stdout, stderr) {
            console.log(stdout);
        });
    });
});

desc('Generate library documentation.');
task('doc', [], function(params) {
    runShellCommand('rm -rf doc', function(stdout, stderr) {
        console.log('creating documentation page...');
        runShellCommand('mkdir -p doc && cp -r doc-src/* doc', function(stdout, stderr) {
            createModuleDocumentation();
        });
    });
});
