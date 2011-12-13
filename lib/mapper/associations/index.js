var util = require('util');
var _ = require('underscore');
var AssociationReflection = require('./reflection').AssociationReflection;

var Associations = function() {};

module.exports = Associations;

// TODO maybe add dynamic search to relations (if possible) by simply executing parent internally

// Specifies a one-to-many association. The following methods for retrieval and query of
// collections of associated objects will be added:
//
// * collection
//   Returns an array of all the associated objects.
//   An empty array is returned if none are found.
// * collection.push([object, ...])
//   Adds one or more objects to the collection by setting their foreign keys to the collection's primary key.
//   Note that this operation instantly fires update sql without waiting for the save or update call on the
//   parent object.
// * collection.delete([object, ...])
//   Removes one or more objects from the collection by setting their foreign keys to +NULL+.
//   Objects will be in addition destroyed if they're associated with `:dependent => :destroy`,
//   and deleted if they're associated with `:dependent => :delete_all`.
//
//   If the `:through` option is used, then the join records are deleted (rather than
//   nullified) by default, but you can specify `:dependent => :destroy` or
//   `:dependent => :nullify` to override this.
// * collection = objects
//   Replaces the collections content by deleting and adding objects as appropriate. If the `:through`
//   option is true callbacks in the join models are triggered except destroy callbacks, since deletion is
//   direct.
// * collection.clear()
//   Removes every object from the collection. This destroys the associated objects if they
//   are associated with `:dependent => :destroy`, deletes them directly from the
//   database if `:dependent => :delete_all`, otherwise sets their foreign keys to `NULL`.
//   If the `:through` option is true no destroy callbacks are invoked on the join models.
//   Join models are directly deleted.
// * collection.length
//   Returns the number of associated objects.
// * collection.find(...)
//   Finds an associated object according to the same rules as Base.find.
// * collection.exists(...)
//   Checks whether an associated object with the given conditions exists.
//   Uses the same rules as Base.exists.
// * collection.build(attributes = {}, ...)
//   Returns one or more new objects of the collection type that have been instantiated
//   with `attributes` and linked to this object through a foreign key, but have not yet
//   been saved.
// * collection.create(attributes = {})
//   Returns a new object of the collection type that has been instantiated
//   with `attributes`, linked to this object through a foreign key, and that has already
//   been saved (if it passed the validation). *Note*: This only works if the base model
//   already exists in the DB, not if it is a new (unsaved) record!
//
// (*Note*: `collection` is replaced with the symbol passed as the first argument, so
// `has_many :clients` would add among others `clients.empty?`.)
//
// === Example
//
// Example: A Firm class declares `has_many :clients`, which will add:
// * `Firm#clients` (similar to `Clients.find :all, :conditions => ["firm_id = ?", id]`)
// * `Firm#clients<<`
// * `Firm#clients.delete`
// * `Firm#clients=`
// * `Firm#client_ids`
// * `Firm#client_ids=`
// * `Firm#clients.clear`
// * `Firm#clients.empty?` (similar to `firm.clients.size == 0`)
// * `Firm#clients.size` (similar to `Client.count "firm_id = #{id}"`)
// * `Firm#clients.find` (similar to `Client.find(id, :conditions => "firm_id = #{id}")`)
// * `Firm#clients.exists?(:name => 'ACME')` (similar to `Client.exists?(:name => 'ACME', :firm_id => firm.id)`)
// * `Firm#clients.build` (similar to `Client.new("firm_id" => id)`)
// * `Firm#clients.create` (similar to `c = Client.new("firm_id" => id); c.save; c`)
// The declaration can also include an options hash to specialize the behavior of the association.
//
// === Options
// [:class_name]
//   Specify the class name of the association. Use it only if that name can't be inferred
//   from the association name. So `has_many :products` will by default be linked
//   to the Product class, but if the real class name is SpecialProduct, you'll have to
//   specify it with this option.
// [:conditions]
//   Specify the conditions that the associated objects must meet in order to be included as a +WHERE+
//   SQL fragment, such as `price > 5 AND name LIKE 'B%'`.  Record creations from
//   the association are scoped if a hash is used.
//   `has_many :posts, :conditions => {:published => true}` will create published
//   posts with `@blog.posts.create` or `@blog.posts.build`.
// [:order]
//   Specify the order in which the associated objects are returned as an `ORDER BY` SQL fragment,
//   such as `last_name, first_name DESC`.
// [:foreign_key]
//   Specify the foreign key used for the association. By default this is guessed to be the name
//   of this class in lower-case and "_id" suffixed. So a Person class that makes a +has_many+
//   association will use "person_id" as the default `:foreign_key`.
// [:primary_key]
//   Specify the method that returns the primary key used for the association. By default this is +id+.
// [:dependent]
//   If set to `:destroy` all the associated objects are destroyed
//   alongside this object by calling their +destroy+ method.  If set to `:delete_all` all associated
//   objects are deleted *without* calling their +destroy+ method.  If set to `:nullify` all associated
//   objects' foreign keys are set to +NULL+ *without* calling their +save+ callbacks. If set to
//   `:restrict` this object cannot be deleted if it has any associated object.
//
//   If using with the `:through` option, the association on the join model must be
//   a +belongs_to+, and the records which get deleted are the join records, rather than
//   the associated records.
//
// [:finder_sql]
//   Specify a complete SQL statement to fetch the association. This is a good way to go for complex
//   associations that depend on multiple tables. Note: When this option is used, +find_in_collection+
//   is _not_ added.
// [:counter_sql]
//   Specify a complete SQL statement to fetch the size of the association. If `:finder_sql` is
//   specified but not `:counter_sql`, `:counter_sql` will be generated by
//   replacing `SELECT ... FROM` with `SELECT COUNT(*) FROM`.
// [:extend]
//   Specify a named module for extending the proxy. See "Association extensions".
// [:include]
//   Specify second-order associations that should be eager loaded when the collection is loaded.
// [:group]
//   An attribute name by which the result should be grouped. Uses the `GROUP BY` SQL-clause.
// [:having]
//   Combined with +:group+ this can be used to filter the records that a `GROUP BY`
//   returns. Uses the `HAVING` SQL-clause.
// [:limit]
//   An integer determining the limit on the number of rows that should be returned.
// [:offset]
//   An integer determining the offset from where the rows should be fetched. So at 5,
//   it would skip the first 4 rows.
// [:select]
//   By default, this is `*` as in `SELECT * FROM`, but can be changed if
//   you, for example, want to do a join but not include the joined columns. Do not forget
//   to include the primary and foreign keys, otherwise it will raise an error.
// [:as]
//   Specifies a polymorphic interface (See `belongs_to`).
// [:through]
//   Specifies a join model through which to perform the query.  Options for `:class_name`,
//   `:primary_key` and `:foreign_key` are ignored, as the association uses the
//   source reflection. You can only use a `:through` query through a `belongs_to`,
//   `has_one` or `has_many` association on the join model.
//
//   If the association on the join model is a +belongs_to+, the collection can be modified
//   and the records on the `:through` model will be automatically created and removed
//   as appropriate. Otherwise, the collection is read-only, so you should manipulate the
//   `:through` association directly.
//
//   If you are going to modify the association (rather than just read from it), then it is
//   a good idea to set the `:inverse_of` option on the source association on the
//   join model. This allows associated records to be built which will automatically create
//   the appropriate join model records when they are saved. (See the 'Association Join Models'
//   section above.)
// [:source]
//   Specifies the source association name used by `has_many :through` queries.
//   Only use it if the name cannot be inferred from the association.
//   `has_many :subscribers, :through => :subscriptions` will look for either `:subscribers` or
//   `:subscriber` on Subscription, unless a `:source` is given.
// [:source_type]
//   Specifies type of the source association used by `has_many :through` queries where the source
//   association is a polymorphic +belongs_to+.
// [:uniq]
//   If true, duplicates will be omitted from the collection. Useful in conjunction with `:through`.
// [:readonly]
//   If true, all the associated objects are readonly through the association.
// [:validate]
//   If +false+, don't validate the associated objects when saving the parent object. true by default.
// [:autosave]
//   If true, always save the associated objects or destroy them if marked for destruction,
//   when saving the parent object. If false, never save or destroy the associated objects.
//   By default, only save associated objects that are new records.
// [:inverse_of]
//   Specifies the name of the `belongs_to` association on the associated object
//   that is the inverse of this `has_many` association. Does not work in combination
//   with `:through` or `:as` options.
//   See ActiveRecord::Associations::ClassMethods's overview on Bi-directional associations for more detail.
//
// Option examples:
//     has_many :comments, :order => "posted_on"
//     has_many :comments, :include => :author
//     has_many :people, :class_name => "Person", :conditions => "deleted = 0", :order => "name"
//     has_many :tracks, :order => "position", :dependent => :destroy
//     has_many :comments, :dependent => :nullify
//     has_many :tags, :as => :taggable
//     has_many :reports, :readonly => true
//     has_many :subscribers, :through => :subscriptions, :source => :user
//     has_many :subscribers, :class_name => "Person", :finder_sql =>
//         'SELECT DISTINCT people.* ' +
//         'FROM people p, post_subscriptions ps ' +
//         'WHERE ps.post_id = #{id} AND ps.person_id = p.id ' +
//         'ORDER BY p.first_name'
//
Associations.hasMany = function(association_name, options) {
    options = options || {};

    var reflection = this.createReflection('has_many', association_name, options);
    this.collectionAccessorMethods(reflection);
};

Associations.hasOne = function(association_name, options) {
    options = options || {};

    var reflection = this.createReflection('has_one', association_name, options);
    this.associationConstructorMethods(reflection);
    this.associationAccessorMethods(reflection);
};

Associations.belongsTo = function(association_name, options) {
    options = options || {};

    var reflection = this.createReflection('belongs_to', association_name, options);
    this.associationAccessorMethods(reflection);

    this.defineColumn(reflection.foreignKey(), 'foreign_key', options);
};

// Returns the AssociationReflection object for the `association`.
//
//     Account.reflectOnAssociation('owner');             // returns the owner AssociationReflection
//     Invoice.reflectOnAssociation('line_items').macro   // returns `has_many`
//
Associations.reflectOnAssociation = function(association) {
    return this.reflections[association] ? this.reflections[association] : undefined;
};

// private methods

Associations.createReflection = function(macro, association_name, options) {
    var reflection = new AssociationReflection(macro, association_name, options, this);
    this.reflections[association_name] = reflection;
    return reflection;
};

Associations.collectionAccessorMethods = function(reflection, writer) {
    writer = writer || true;
    var class_name = reflection.association_name;
    this.collectionReaderMethod(reflection);

    if (writer) {
        this.prototype.__defineSetter__(class_name, function(val) {
            this.association(reflection).replace(val);
        });
    }
};

Associations.associationConstructorMethods = function(reflection) {
    var self = this;
    var class_name = reflection.association_name;

    _.each(['build', 'create'], function(val) {
        self.prototype[val + _.capitalize(class_name)] = function() {
            return this.association(reflection)[val](arguments);
        };
    });
};

Associations.collectionReaderMethod = function(reflection) {
    var class_name = reflection.association_name;

    this.prototype.__defineGetter__(class_name, function() {
        var association = this.association(reflection);
        var reloaded = association.reload();
        if (undefined !== reloaded) {
            return association.target; // TODO need a way to delegate
        }
    });
};

Associations.associationAccessorMethods = function(reflection) {
    var class_name = reflection.association_name;

    this.prototype.__defineGetter__(class_name, function() {
        var association = this.association(reflection);
        var reloaded = association.reload();
        if (undefined !== reloaded) {
            return association.target; // TODO need a way to delegate
        }
    });

    this.prototype.__defineSetter__(class_name, function(val) {
        this.association(reflection).replace(val);
    });
};

Associations.prototype.association = function(reflection) {
    var proxy_class = reflection.proxyClass();
    var proxy = new proxy_class(this, reflection);

    return proxy;
};