// Module dependencies.
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var nodes = require('../nodes');
var connection_adapters = require('../connection_adapters');
var managers = require('../managers');
var Table = require('../table');
var Relation = require('../relation');
var Associations = require('../associations');
var Persistence = require('../persistence');
var Column = require('../connection_adapters/column');

var PrimaryKey = require('./primary_key');
var Read = require('./read');
var Write = require('./write');
var callback = require('./callbacks');

var validation = require('../validations');

var known_models = {};
var ready_count = 0;
var configuration = {};

// # mapper.js
//
// Models are normally defined using the `Base.define` method. The newly
// created class can be modified by providing a callback function After
// calling the callback function, the actual database table will be created
// or migrated if automatically by mapper.js if needed.
//
//     Base.configuration = {adapter: 'mysql', database: 'app'};
//     var User = Base.define('users', function() {
//         this.defineColumn('name', 'string');
//         this.defineColumn('occupation', 'string', {default: 'Coder'});
//         this.hasMany('applications');
//     });
//
// ## Creation
//
// mapper.js accept constructor parameters either in a hash or as a block. The hash
// method is especially useful when you're receiving the data from somewhere else, like an
// HTTP request. It works like this:
//
//      user = new User(name: "David", occupation: "Code Artist");
//      user.name; // => "David"
//
// You can also use anonymous function initialization:
//
//      user = new User(function() {
//          this.name = "David";
//          this.occupation = "Code Artist";
//      });
//
// And of course you can just create a bare object and specify the attributes after the fact:
//
//     user = new User();
//     user.name = "David";
//     user.occupation = "Code Artist";
//
// ## Conditions
//
// Conditions can either be specified as a string, array, or hash representing the WHERE-part of an SQL statement.
// The array form is to be used when the condition input is tainted and requires sanitization. The string form can
// be used for statements that don't involve tainted data. The hash form works much like the array form, except
// only equality and range is possible. Examples:
//
//     User.prototype.authenticateUnsafely(user_name, password) {
//         return this.where("user_name = '" + user_name + "' AND password = '" + password + "'").first();
//     }
//
//     User.prototype.authenticateSafely(user_name, password) {
//         return this.where("user_name = ? AND password = ?", [user_name, password]).first();
//     }
//
//     User.prototype.authenticateSafelySimply(user_name, password) {
//         return this.where({user_name: user_name, password: password}).first();
//     }
//
// The `authenticateUnsafely` method inserts the parameters directly into the query
// and is thus susceptible to SQL-injection attacks if the `user_name` and `password`
// parameters come directly from an HTTP request. The `authenticateSafely` and
// `authenticateSafelySimply` both will sanitize the `user_name` and `password`
// before inserting them in the query, which will ensure that an attacker can't escape the
// query and fake the login (or worse).
//
// When using multiple parameters in the conditions, it can easily become hard to read exactly
// what the fourth or fifth question mark is supposed to represent. In those cases, you can
// resort to named bind variables instead. That's done by replacing the question marks with
// symbols and supplying a hash with values for the matching symbol keys:
//
//     Company.where("id = :id AND name = :name AND division = :division AND created_at > :accounting_date",
//                   {id: 3, name: "37signals", division: "First", accouting_date: '2005-01-01'}).first();
//
// Similarly, a simple hash without a statement will generate conditions based on equality with the SQL AND
// operator. For instance:
//
//     Student.where(first_name: "Harvey", status: 1);
//     Student.where(params['student']);
//
// An array may be used in the hash to use the SQL IN operator:
//
//     Student.where(grade: [9, 10, 11]);
//
// When joining tables, nested hashes or keys written in the form 'table_name.column_name'
// can be used to qualify the table name of a particular condition. For instance:
//
//     Student.joins('schools').where({schools: { type: 'public' }});
//     Student.joins('schools').where({'schools.type': 'public'});
//
// ## Overwriting default accessors
//
// All column values are automatically available through basic accessors on the mapper.js
// object, but sometimes you want to specialize this behavior. This can be done by overwriting
// the default accessors (using the same name as the attribute) and calling
// `readAttribute(attr_name)` and `writeAttribute(attr_name, value)` to actually
// change things.
//
//     # Uses an integer of seconds to hold the length of the song
//     Song.__defineGetter__('length', function() {
//         return readAttribute('length') / 60;
//     })
//
//     Song.__defineSetter__('length', function(minutes) {
//         return writeAttribute('length', minutes * 60);
//     })
//
// ## Single table inheritance
//
// mapper.js allows inheritance by storing the name of the class in a column that by
// default is named "type" (can be changed by overwriting `Base.inheritance_column`).
// This means that an inheritance looking like this:
//
//     var Company = mapper.define('companies', {}, function() {
//     });
//
//     var Firm = mapper.define('firms', {inherits: 'companies'}, function() {
//
//     });
//
//     var Client = mapper.define('clients', {inherits: 'companies'}, function() {
//
//     });
//
// When you do `Firm.create(name: "37signals");`, this record will be saved in
// the companies table with type = "Firm". You can then fetch this row again using
// `Company.where(:name => '37signals').first();` and it will return a Firm object.
//
// If you don't have a type column defined in your table, single-table inheritance won't
// be triggered. In that case, it'll work just like normal subclasses with no special magic
// for differentiating between them or reloading the right type with find.
//
// Note, all the attributes for all the cases are kept in the same table. Read more:
// http://www.martinfowler.com/eaaCatalog/singleTableInheritance.html
//
// ## Connection to multiple databases in different models
//
// All classes will use this connection. But you can also set a class-specific connection.
// For example, if Course is an Base, but resides in a different database, you can just
// say `Course.connection` and Course and all of its subclasses will use this connection instead.
//
var define = function(class_name, options) {
    var new_class = function(attributes) {
        this._attributes = {};

        if (_.isFunction(attributes)) {
            _.bind(attributes, this)();
        } else {
            this._attributes = _.clone(attributes);
        }

        if (this.constructor.finderNeedsTypeCondition()) {
            this[this.constructor.inheritanceColumn()] = this.constructor.stiName();
        }

        this._destroyed = false;
        this._new_record = true;
    };

    new_class.class_name = class_name;
    new_class.configuration = {};
    new_class._columns = [];
    new_class._finder_needs_type_condition = false;
    new_class._type_condition = undefined;
    new_class._event_emitter = new EventEmitter();
    new_class.reflections = {};

    known_models[class_name.toLowerCase()] = new_class;

    util.inherits(new_class, EventEmitter);

    // Extend new class with common functionality.
    _.extend(new_class, PrimaryKey);
    _.extend(new_class.prototype, PrimaryKey.prototype);

    _.extend(new_class, Read);
    _.extend(new_class.prototype, Read.prototype);

    _.extend(new_class, Write);
    _.extend(new_class.prototype, Write.prototype);

    _.extend(new_class, Persistence);
    _.extend(new_class.prototype, Persistence.prototype);

    _.extend(new_class, Associations);
    _.extend(new_class.prototype, Associations.prototype);

    _.extend(new_class, validation.Validation);
    _.extend(new_class.prototype, validation.Validation.prototype);

    // Is used to define a column in the model. The first arguments defines the name of the column.
    // mapper.js automatically defines a setter and getter function with the same name. The second
    // arguments is the column-type and additional options for the column can be provided
    // as a key-value hash as third parameter. Valid column-types are:
    //
    // * `string` - Defines a string column. Valid options are `null`, `default` and `limit`.
    // * `text` - Defines a text column. Valid options are `null`, `default` and `limit`.
    // * `integer` - Defines an integer column. Valid options are `null`, `default` and `limit`.
    // * `float` - Defines a float column. Valid options are `null`, `default` and `limit`.
    // * `decimal` - Defines a decimal column. Valid options are `null`, `default`, `limit`, `precision` and `scale`.
    // * `datetime` - Defines a datetime column. Valid options are `null`, `default` and `limit`.
    // * `time` - Defines a time column. Valid options are `null`, `default` and `limit`.
    // * `date` - Defines a date column. Valid options are `null`, `default` and `limit`.
    // * `binary` - Defines a binary column. Valid options are `null`, `default` and `limit`.
    // * `boolean` - Defines a boolean column. Valid options are `null`, `default` and `limit`.
    // * `primary_key` - Defines the primary key column in the model. Defaults to `id` if not otherwise specified.
    //
    // #### Examples
    //
    //     this.defineColumn('name', 'string');
    //
    //     this.defineColumn('value', 'integer', {default: 100});
    //
    new_class.defineColumn = function(column_name, type, options) {
        if (type == 'primary_key') {
            this.primary_key = column_name;
        } else {
            options = options || {};
            options.type = type;
            options.name = column_name;
            this._columns.push(new Column(options));
        }

        this.prototype.__defineGetter__(column_name, function() {
            return this.readAttribute(column_name);
        });

        this.prototype.__defineSetter__(column_name, function(val) {
            this.writeAttribute(column_name, val);
        });
    };

    // options
    if (options.inherits) {
        new_class._finder_needs_type_condition = true;
        new_class._type_condition = options.inherits;
        _.each(known_models[options.inherits.toLowerCase()]._columns, function(column) {
            new_class.defineColumn(column.name, column.type, column.options);
        });
    }

    // Should be used to ensure proper model initialization.
    // returns `true` if models can safely be used, otherwise `false`.
    // if a callback function is given it will be called once usage of the models is safe.
    //
    new_class.ready = function(fun) {
        if (ready_count >= _.keys(known_models).length) {
            if (fun) { process.nextTick(fun); }
            return true;
        } else {
            if (fun) { this.on('ready', fun); }
            return false;
        }
    };

    // Executes a custom SQL query against your database and yields all the results.  The results will
    // be yield as an array with columns requested encapsulated as attributes of the model you call
    // this method from.  If you call `Product.find_by_sql` then the results will be returned in
    // a Product object with the attributes you specified in the SQL query.
    //
    // If you call a complicated SQL query which spans multiple tables the columns specified by the
    // SELECT will be attributes of the model, whether or not they are columns of the corresponding
    // table.
    //
    // The `sql` parameter is a full SQL query as a string.  It will be called as is, there will be
    // no database agnostic conversions performed.  This should be a last resort because using, for example,
    // MySQL specific terms will lock you to using that particular database engine or require you to
    // change your call if you switch engines.
    //
    // #### Examples
    //
    //     // A simple SQL query spanning multiple tables
    //     Post.findBySql("SELECT p.title, c.author FROM posts p, comments c WHERE p.id = c.post_id");
    //
    //     // You can use the same string replacement techniques as you can with #find
    //     Post.findBySql("SELECT title FROM posts WHERE author = ? AND created > ?", [author_id, start_date]);
    //
    new_class.findBySql = function(sql, binds) {
        binds = binds || [];
        var emitter = new EventEmitter();
        var fun = function(error, rows) {
            if (error) {
                emitter.emit('error', error);
                return;
            }

            emitter.emit('rows', rows);
        };
        this.tableConnection().selectAll(this.replaceBindVariables(this.sanitizeSql(sql), binds), fun);
        return emitter;
    };

    // Creates an object (or multiple objects) and saves it to the database, if validations pass.
    // The resulting object is returned whether the object was saved successfully to the database or not.
    //
    // The `attributes` parameter can be either be a Hash or an Array of Hashes.  These Hashes describe the
    // attributes on the objects that are to be created.
    //
    // #### Examples
    //     // Create a single new object
    //     User.create({first_name: 'Jamie'});
    //
    //     // Create an Array of new objects
    //     User.create([{ first_name: 'Jamie' }, { first_name: 'Jeremy' }]);
    //
    new_class.create = function(attributes) {
        if (_.isArray(attributes)) {
            var self = this;
            var event = new EventEmitter();
            var count = attributes.length;
            _.each(attributes, function(attr) {
                var object = self.create(attr);
                object.on('success', function() {
                     count -= 1;
                     if (count === 0) {
                         event.emit('success');
                     }
                });
                object.on('error', function(error) {
                    event.emit('error', error);
                });
            });

            return event;
        }
        var object = new this(attributes);
        return object.save();
    };

    // Returns a quoted version of the table name, used to construct SQL statements.
    new_class.quotedTableName = function() {
        this._quoted_table_name = this._quoted_table_name || this.table().quotedTableName();
        return this._quoted_table_name;
    };

    new_class.tableName = function() {
        this._table_name = this._table_name || this.computeTableName();
        return this._table_name;
    };

    new_class.table = function() {
        this._table = this._table || new Table(this.tableName(), this.tableConnection());
        return this._table;
    };

    new_class.tableConnection = function() {
        this._table_connection = this._table_connection || connection_adapters.for(this.configuration) || connection_adapters.for(configuration);
        return this._table_connection;
    };

    // private methods

    new_class.relation = function() {
        if (undefined !== this._relation) { return this._relation; }

        var self = this;
        this._relation = new Relation(this, this.table());
        if (this.finderNeedsTypeCondition()) {
            this._relation = this._relation.where(this.typeCondition());
        }

        // TODO cleanup
        _.each(this.reflections, function(reflection, key) {
            self._relation[key] = function() {
                var emitter = new EventEmitter();

                this.on('error', function(error) {
                    emitter.emit('error', error);
                });

                this.on('rows', function(rows) {
                    if (rows.length != 1) {
                        emitter.emit('error', new Error('association error'));
                        return;
                    }
                    var record = _.first(rows)[key].all();
                    record.on('error', function(error) {
                        emitter.emit('error', error);
                    });

                    record.on('row', function(row) {
                        emitter.emit('row', rows);
                    });

                    record.on('rows', function(rows) {
                        emitter.emit('rows', rows);
                    });
                });

                return emitter;
            };
        });

        return this._relation;
    };

    // Computes and returns a table name according to default conventions.
    new_class.computeTableName = function() {
        if (this.finderNeedsTypeCondition()) {
            return this._type_condition;
        }

        return this.class_name;
    };

    // after emiting ready it is safe to use the object
    new_class.createOrUpdateTable = function() {
        if (this.finderNeedsTypeCondition()) {
            process.nextTick(function() {
                ready_count += 1;
                if (ready_count >= _.keys(known_models).length) {
                    _.each(known_models, function(model, name) {
                        model.emit('ready', model);
                    });
                }
            });

            return;
        }

        this._columns.unshift(new Column({name: this.primary_key, type: 'primary_key'}));
        this.tableConnection().createOrUpdateTable(this, function() {
            ready_count += 1;
            if (ready_count >= _.keys(known_models).length) {
                _.each(known_models, function(model, name) {
                    model.emit('ready', model);
                });
            }
        });
    };

    new_class.scoped = function() {
        return this.relation();
    };

    new_class.sanitizeSql = function(condition, table_name) {
        return this.sanitizeSqlForConditions(condition, table_name);
    };

    // Accepts an array, hash, or string of SQL conditions and sanitizes
    // them into a valid SQL fragment for a WHERE clause.
    //     ["name = ? and group_id = ?", "foo'bar", 4]  returns  "name = 'foo''bar' and group_id = '4'"
    //     { name: "foo'bar", group_id: 4 }  returns "name = 'foo''bar' and group_id = '4'"
    //     "name = 'foo''bar' and group_id = '4'" returns "name = 'foo''bar' and group_id = '4'"
    //
    new_class.sanitizeSqlForConditions = function(condition) {
        if (!condition) {
            return undefined;
        }

        if (_.isArray(condition)) {
            return this.sanitizeSqlArray(condition);
        } else if (typeof(condition) == 'object' && undefined === condition.class_name) {
            var visitor = this.table().selectManager().visitor;
            return nodes.sql(_.map(this.sanitizeSqlHashForConditions(condition), function(con) {
                return visitor.visit(con);
            }).join(' AND '));
        }
        return condition;
    };

    // Accepts an array, hash, or string of SQL conditions and sanitizes
    // them into a valid SQL fragment for a SET clause.
    //     { name: undefined, group_id: 4 }  returns "name = NULL , group_id='4'"
    //
    new_class.sanitizeSqlForAssignment = function(assignments) {
        if (!assignments) {
            return undefined;
        }

        if (_.isArray(assignments)) {
            return this.sanitizeSqlArray(assignments);
        } else if (typeof(assignments) == 'object' && undefined === assignments.class_name) {
            var visitor = this.table().selectManager().visitor;
            return _.map(this.sanitizeSqlHashForAssignment(assignments), function(con) {
                return visitor.visit(con);
            }).join(' AND ');
        }
        return nodes.sql(assignments);
    };

    // Accepts an array of conditions.  The array has each value
    // sanitized and interpolated into the SQL statement.
    //   ["name = ? and group_id = ?", "foo'bar", 4]  returns  "name = 'foo''bar' and group_id = '4'"
    //
    new_class.sanitizeSqlArray = function(ary) {
        statement = _.first(ary);
        values = _.rest(ary);

        if (typeof(_.first(values)) == 'object' && statement.match(/:\w+/)) {
            return nodes.sql(this.replaceNamedBindVariables(statement, _.first(values)));
        } else if (statement.indexOf('?') != -1) {
            return nodes.sql(this.replaceBindVariables(statement, values));
        }
        return statement;
    };

    // Sanitizes a hash of attribute/value pairs into SQL conditions for a `WHERE` clause.
    //     { name: "foo'bar", group_id: 4 }
    //       // => "name = 'foo''bar' AND group_id = 4"
    //     { status: undefined, group_id: [1,2,3] }
    //       // => "status IS NULL AND group_id IN (1,2,3)"
    //
    new_class.sanitizeSqlHashForConditions = function(attrs) {
        var table = this.table();

        return _.map(attrs, function(value, key) {
            if (_.isArray(value)) {
                return table.column(key).in(value);
            } else {
                return table.column(key).eq(value);
            }
        });
    };

    // Sanitizes a hash of attribute/value pairs into SQL conditions for a `SET` clause.
    //     { status: undefined, group_id: 1 }
    //       // => "status = NULL , group_id = 1"
    //
    // TODO needs testing
    new_class.sanitizeSqlHashForAssignment = function(attrs) {
        var connection = this.klass.tableConnection();

        console.log(connection);

        return _.map(attrs, function(value, key) {
            if (_.isArray(value)) {
                return table.column(key).in(value);
            } else {
                return table.column(key).eq(value);
            }
        });
    };
    //def sanitize_sql_hash_for_assignment(attrs)
    //  attrs.map do |attr, value|
    //    "#{connection.quote_column_name(attr)} = #{quote_bound_value(value)}"
    //  end.join(', ')
    //end

    new_class.replaceBindVariables = function(statement, values) {
        var variables_count = statement.replace(/[^\?]/g, '').length;

        if (values.length != variables_count) {
            throw 'wrong number of bind variables (' + values.length + ' for ' + variables_count + ') in: ' + statement;
        }

        var c = this.tableConnection();
        var bound = _.clone(values);
        return _.map(statement.split('?'), function(part) {
            var value = bound.shift();
            return undefined !== value ? part + c.quote(value) : part;
        }).join('');
    };

    new_class.replaceNamedBindVariables = function(statement, bind_vars) {
        _.each(_.keys(bind_vars), function(key) {
            var pattern = new RegExp(':' + key, 'g');
            statement = statement.replace(pattern, bind_vars[key]);
        });

        if (statement.match(/:\w+/)) {
            throw 'missing value in ' + statement;
        }

        return statement;
    };

    new_class.finderNeedsTypeCondition = function() {
        return this._finder_needs_type_condition;
    };

    // Returns the column object for the named attribute.
    new_class.prototype.columnForAttribute = function(name) {
        return _.detect(this.constructor._columns, function(value) {
            return value.name == name;
        });
    };

    new_class.prototype.convertNumberColumnValue = function(value) {
        if (_.isBoolean(value)) {
            return value ? 1 : 0;
        } else if (_.isString(value) && value.length === 0) {
            return undefined;
        } else {
            return value;
        }
    };

    new_class.typeCondition = function() {
        var sti_column = this.table().column(this.inheritanceColumn());
        return sti_column.eq(this.stiName());
    };

    new_class.modelWithName = function(name) {
        return known_models[name.toLowerCase()];
    };

    // Defines the column name for use with single table inheritance. Use
    // `setInheritanceColumn` to set a different value.
    new_class.inheritanceColumn = function() {
        this._inheritance_column = this._inheritance_column || 'type';
        return this._inheritance_column;
    };

    new_class.stiName = function() {
        return this.class_name;
    };

    new_class.prototype.__defineGetter__('attributes', function() {
        return this._attributes;
    });

    // Allows you to set all the attributes at once by passing in a hash with keys
    // matching the attribute names (which again matches the column names).
    //
    //     var user = new User();
    //     user.attributes = {username: 'Phusion', is_admin: true };
    //     user.username;   // => "Phusion"
    //     user.is_admin;   // => true
    //
    new_class.prototype.__defineSetter__('attributes', function(val) {
        var self = this;
        _.each(val, function(value, key) {
            self._attributes[key] = value;
        });
    });

    new_class.prototype.attributesValues = function(include_primary_key) {
        var self = this;
        var attrs = {};
        var klass = this.constructor;
        var table = klass.table();

        _.each(this._attributes, function(value, key) {
            if (include_primary_key || key != 'primary_key') {
                attrs[key] = value;
            }
        });

        return attrs;
    };

    // Delegate finder functions to class relation.
    _.delegate(new_class, new_class.relation, 'find');
    _.delegate(new_class, new_class.relation, 'first');
    _.delegate(new_class, new_class.relation, 'last');
    _.delegate(new_class, new_class.relation, 'all');
    _.delegate(new_class, new_class.relation, 'exists');
    _.delegate(new_class, new_class.relation, 'updateAll');
    _.delegate(new_class, new_class.relation, 'update');
    _.delegate(new_class, new_class.relation, 'deleteAll');
    _.delegate(new_class, new_class.relation, 'delete');

    _.delegate(new_class, new_class.relation, 'where');
    _.delegate(new_class, new_class.relation, 'select');
    _.delegate(new_class, new_class.relation, 'limit');
    _.delegate(new_class, new_class.relation, 'group');
    _.delegate(new_class, new_class.relation, 'order');
    _.delegate(new_class, new_class.relation, 'offset');
    _.delegate(new_class, new_class.relation, 'having');

    _.delegate(new_class, new_class.relation, 'count');
    _.delegate(new_class, new_class.relation, 'average');
    _.delegate(new_class, new_class.relation, 'minimum');
    _.delegate(new_class, new_class.relation, 'maximum');
    _.delegate(new_class, new_class.relation, 'sum');
    _.delegate(new_class, new_class.relation, 'calculate');

    _.delegate(new_class, new_class._event_emitter, 'emit');
    _.delegate(new_class, new_class._event_emitter, 'on');

    // add callbacks
    callback.defineCallbacks(new_class);
    // add validation
    validation.defineValidations(new_class);

    return new_class;
};

module.exports = define;
module.exports.known_models = known_models;

// Contains the database configuration as a Hash.
//
// #### Example
//
//     {
//         adapter: 'sqlite',
//         database: 'db/development.sqlite3'
//     }
//
module.exports.__defineSetter__('configuration', function(val) {
    configuration = val;
});

module.exports.__defineGetter__('configuration', function() {
    return configuration;
});
