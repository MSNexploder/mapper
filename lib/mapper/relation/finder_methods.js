// Module dependencies.
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var Relation = require('../relation');

// Find operates with four different retrieval approaches:
//
// * Find by id - This can either be a specific id (1) or an array of ids ([5, 6, 10]).
//   If no record can be found for all of the listed ids, `undefined` is emitted.
// * Find first - This will return the first record matched by the options used. These options can either be specific
//   conditions or merely an order. If no record can be matched, `undefined` is emitted. Use
//   `Model.find('first', args)` or its shortcut `Model.first(args)`.
// * Find last - This will emit the last record matched by the options used. These options can either be specific
//   conditions or merely an order. If no record can be matched, `undefined` is emitted. Use
//   `Model.find('last', args)` or its shortcut `Model.last(args)`.
// * Find all - This will emit all the records matched by the options used.
//   If no records are found, an empty array is emitted. Use
//   `Model.find('all', args)` or its shortcut `Model.all(args)`.
//
// All approaches accept an options hash as their last parameter.
//
// #### Parameters
//
// * `conditions` - An SQL fragment like "administrator = 1", `["user_name = ?", username]`,
//   or `["user_name = :user_name", { user_name: user_name }]`. See conditions in the intro.
// * `order` - An SQL fragment like `"created_at DESC, name"`.
// * `group` - An attribute name by which the result should be grouped. Uses the `GROUP BY` SQL-clause.
// * `having` - Combined with `group` this can be used to filter the records that a
//   `GROUP BY` emits. Uses the `HAVING` SQL-clause.
// * `limit` - An integer determining the limit on the number of rows that should be returned.
// * `offset` - An integer determining the offset from where the rows should be fetched. So at 5,
//   it would skip rows 0 through 4.
// * `joins` - Either an SQL fragment for additional joins like `"LEFT JOIN comments ON comments.post_id = id"` (rarely needed),
//   named associations in the same form used for the `include` option, which will perform an
//   `INNER JOIN` on the associated table(s),
//   or an array containing a mixture of both strings and named associations.
//   If the value is a string, then the records will be returned read-only since they will
//   have attributes that do not correspond to the table's columns.
//   Pass `readonly => false` to override.
// * `include` - Names associations that should be loaded alongside. The names refer
//   to already defined associations. See eager loading under Associations.
// * `select` - By default, this is "*" as in "SELECT * FROM", but can be changed if you,
//   for example, want to do a join but not include the joined columns. Takes a string with the SELECT SQL fragment (e.g. "id, name").
// * `from` - By default, this is the table name of the class, but can be changed
//   to an alternate table name (or even the name of a database view).
// * `readonly` - Mark the returned records read-only so they cannot be saved or updated.
// * `lock` - An SQL fragment like "FOR UPDATE" or "LOCK IN SHARE MODE".
//   `lock => true` gives connection's default exclusive lock, usually "FOR UPDATE".
//
// #### Emits
//
// All methods emit a `row` event for every row fetched with the current object as argument.
// At the end another additional event emitted without an argument to indicate the end of results.
// After that a `rows` event is triggered once with all fetched rows.
//
// #### Examples
//
//     // find by id
//     Person.find(1);       // emits the object for ID = 1
//     Person.find([7, 17]); // emits the objects with IDs in (7, 17)
//     Person.find([1]);     // emits the object with ID = 1
//     Person.where("administrator = 1").order("created_on DESC").find(1);
//
// Note that returned records may not be in the same order as the ids you
// provide since database rows are unordered. Give an explicit `order`
// to ensure the results are sorted.
//
//     // find first
//     Person.first(); // emits the first object fetched by SELECT * FROM people
//     Person.where(["user_name = ?", user_name]).first();
//     Person.where(["user_name = :u", { :u => user_name }]).first();
//     Person.order("created_on DESC").offset(5).first();
//
//     // find last
//     Person.last(); // emits the last object fetched by SELECT * FROM people
//     Person.where(["user_name = ?", user_name]).last();
//     Person.order("created_on DESC").offset(5).last();
//
//     // find all
//     Person.all(); // emits an array of objects for all the rows fetched by SELECT * FROM people
//     Person.where(["category IN (?)", categories]).limit(50).all();
//     Person.where({ :friends => ["Bob", "Steve", "Fred"] }).all();
//     Person.offset(10).limit(10).all();
//     Person.includes([:account, :friends]).all();
//     Person.group("category").all();
//
Relation.prototype.find = function(ids, options) {
    if (!_.isEmpty(options)) {
        return this.applyFinderOptions(options).find(ids);
    } else {
        switch (ids) {
            case 'first': return this.first();
            case 'last': return this.last();
            case 'all': return this.all();
            default: return this.findWithIds(ids);
        }
    }
};

// A convenience wrapper for `find('first', args)`. You can pass in all the same
// arguments to this method as you can to `find('first')`.
//
Relation.prototype.first = function(options) {
    if (undefined === options) {
        return this.findFirst().all();
    } else {
        return this.applyFinderOptions(options).first();
    }
};

// A convenience wrapper for `find('last', args)`. You can pass in all the same
// arguments to this method as you can to `find('last')`.
//
Relation.prototype.last = function(options) {
    if (undefined === options) {
        return this.findLast().all();
    } else {
        return this.applyFinderOptions(options).last();
    }
};

// A convenience wrapper for `find('all', args)`. You can pass in all the same
// arguments to this method as you can to `find('all')`.
//
Relation.prototype.all = function(options) {
    if (undefined === options) {
        return this.clone().execute();
    } else {
        return this.applyFinderOptions(options).all();
    }
};

// Emits true if a record exists in the table that matches the `id` or
// conditions given, or false otherwise. The argument can take five forms:
//
// * Integer - Finds the record with this primary key.
// * String - Finds the record with a primary key corresponding to this
//   string (such as `'5'`).
// * Array - Finds the record that matches these `find`-style conditions
//   (such as `['color = ?', 'red']`).
// * Hash - Finds the record that matches these `find`-style conditions
//   (such as `{color: 'red'}`).
// * No args - Emits false if the table is empty, true otherwise.
//
// For more information about specifying conditions as a Hash or Array,
// see the Conditions section in the introduction to Base.
//
// Note: You can't pass in a condition as a string (like `name =
// 'Jamie'`), since it would be sanitized and then queried against
// the primary key column, like `id = 'name = \'Jamie\''`.
//
// #### Emits
//
// Emits `exists` event with `true` as argument if at least one row is found, else `false`.
//
// #### Examples
//
//     Person.exists(5);
//     Person.exists('5');
//     Person.exists({name: "David"});
//     Person.exists(['name LIKE ?', "%Stefan%"]);
//     Person.exists();
//
Relation.prototype.exists = function(id) {
    var emitter = new EventEmitter();
    var relation = this.select(this.klass.primary_key).limit(1);
    if (_.isArray(id) || typeof(id) == 'object') {
        relation = relation.where(id);
    } else if (id) {
        relation = relation.where(this.primaryKey().eq(id));
    }

    relation.execute();
    relation.on('rows', function(rows) {
        emitter.emit('exists', rows.length > 0);
    });
    relation.on('error', function(error) {
        emitter.emit('error', error);
    });

    return emitter;
};

// private methods

Relation.prototype.findWithIds = function(ids) {
    ids = _.uniq(_.compact(_.flatten([ids])));
    switch (ids.length) {
        case 0: 
            var event = new EventEmitter();
            process.nextTick(function () {
              event.emit('rows', []);
            });
            return event;
        case 1: return this.findOne(_.first(ids));
        default: return this.findSome(ids);
    }
};

Relation.prototype.findOne = function(id) {
    if (typeof(id) == 'object') {
        id = id.id;
    }

    return this.where(this.primaryKey().eq(id)).first();
};

Relation.prototype.findSome = function(ids) {
    ids = _.map(ids, function(id) {
        if (typeof(id) == 'object') {
            return id.id;
        }
        return id;
    });

    return this.where(this.primaryKey().in(ids)).all();
};

Relation.prototype.findFirst = function() {
    return this.limit(1);
};

Relation.prototype.findLast = function(id) {
    return this.reverseOrder().limit(1);
};
