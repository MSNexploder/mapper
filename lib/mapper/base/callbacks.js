// Module dependencies.
var _ = require('underscore');

var Callback = function(clazz, chain, callback, kind, fun) {
    this.clazz = clazz;
    this.chain = chain;
    this.callback = callback;
    this.kind = kind;
    this.fun = fun;
};

Callback.prototype.run = function(object, args) {
    return _.bind(this.fun, object)(args);
};

module.exports.Callback = Callback;
module.exports.defineCallbacks = function(clazz) {
    clazz.prototype.destroyWithoutCallbacks = clazz.prototype.destroy;
    clazz.prototype.createOrUpdateWithoutCallbacks = clazz.prototype.createOrUpdate;
    clazz.prototype.createWithoutCallbacks = clazz.prototype.create;
    clazz.prototype.updateWithoutCallbacks = clazz.prototype.update;

    Callback.defineModelCallbacks(clazz, ['Save', 'Create', 'Update', 'Destroy']);

    clazz.prototype.create = function() {
        return Callback.runCallbacks(this, 'create', this.createWithoutCallbacks);
    };

    clazz.prototype.update = function() {
        return Callback.runCallbacks(this, 'update', this.updateWithoutCallbacks);
    };

    clazz.prototype.createOrUpdate = function() {
        return Callback.runCallbacks(this, 'save', this.createOrUpdateWithoutCallbacks);
    };

    clazz.prototype.destroy = function() {
        return Callback.runCallbacks(this, 'destroy', this.destroyWithoutCallbacks);
    };
};

// Runs the callbacks for the given event.
//
// Calls the before and around callbacks in the order they were set, yields
// the block, and then runs the after callbacks in reverse order.
// See `ClassMethods.defineCallbacks` for more information.
//
// If the callback chain was halted, returns `false`. Otherwise returns the result
// of the block, or `true`.
//
//   runCallbacks('save', function() {
//      this.save();
//  })
//
// TODO add transaction
// TODO refactor
Callback.runCallbacks = function(object, kind, fun) {
    var callbacks = object.constructor['_' + kind.toLowerCase() + '_callbacks'];
    var callback;
    var i;

    // before callbacks
    var before_callbacks = _.select(callbacks, function(callback) {
        return callback.kind == 'Before';
    });

    for (i = 0; i < before_callbacks.length; i++) {
        callback = before_callbacks[i];
        if (false === callback.run(object)) {
            process.nextTick(function() {
                object.emit('error', new Error('before callback returned false'));
            });
            return;
        }
    }

    // around callbacks
    var around_callbacks = _.select(callbacks, function(callback) {
        return callback.kind == 'Around';
    });

    var ret;
    if (!_.isEmpty(around_callbacks)) {
        var initial_around_callback = around_callbacks.shift();
        var around_fun = function() {
            var current_fun = around_callbacks.shift();
            if (current_fun) {
                return current_fun.run(object, around_fun);
            } else {
                ret = fun.call(object);
            }
        };
        initial_around_callback.run(object, around_fun);
    } else {
        ret = fun.call(object);
    }

    // after callbacks
    var after_callbacks = _.select(callbacks, function(callback) {
        return callback.kind == 'After';
    });

    for (i = 0; i < after_callbacks.length; i++) {
        callback = after_callbacks[i];
        if (false === callback.run(object)) {
            process.nextTick(function() {
                object.emit('error', new Error('after callback returned false'));
            });
            return;
        }
    }

    return ret;
};

// TODO
// define_model_callbacks accepts the same options define_callbacks does, in case
// you want to overwrite a default. Besides that, it also accepts an :only option,
// where you can choose if you want all types (before, around or after) or just some.
//
//   define_model_callbacks :initializer, :only => :after
//
// Note, the <tt>:only => <type></tt> hash will apply to all callbacks defined on
// that method call.  To get around this you can call the define_model_callbacks
// method as many times as you need.
//
//   define_model_callbacks :create, :only => :after
//   define_model_callbacks :update, :only => :before
//   define_model_callbacks :destroy, :only => :around
//
// Would create +after_create+, +before_update+ and +around_destroy+ methods only.
//
// You can pass in a class to before_<type>, after_<type> and around_<type>, in which
// case the callback will call that class's <action>_<type> method passing the object
// that the callback is being called on.
//
//   class MyModel
//     extend ActiveModel::Callbacks
//     define_model_callbacks :create
//
//     before_create AnotherClass
//   end
//
//   class AnotherClass
//     def self.before_create( obj )
//       # obj is the MyModel instance that the callback is being called on
//     end
//   end
//
Callback.defineModelCallbacks = function(clazz, callbacks, types) {
    var self = this;
    types = types || ['Before', 'Around', 'After'];
    _.each(callbacks, function(callback) {
        self.defineCallbacks(clazz, callback);

        _.each(types, function(type) {
            self['_define' + type + 'ModelCallback'](clazz, callback);
        });
    });
};

// TODO
// Define sets of events in the object lifecycle that support callbacks.
//
//   define_callbacks :validate
//   define_callbacks :initialize, :save, :destroy
//
// ===== Options
//
// * <tt>:terminator</tt> - Determines when a before filter will halt the callback
//   chain, preventing following callbacks from being called and the event from being
//   triggered. This is a string to be eval'ed. The result of the callback is available
//   in the <tt>result</tt> variable.
//
//     define_callbacks :validate, :terminator => "result == false"
//
//   In this example, if any before validate callbacks returns +false+,
//   other callbacks are not executed. Defaults to "false", meaning no value
//   halts the chain.
//
// * <tt>:rescuable</tt> - By default, after filters are not executed if
//   the given block or a before filter raises an error. By setting this option
//   to <tt>true</tt> exception raised by given block is stored and after
//   executing all the after callbacks the stored exception is raised.
//
// * <tt>:scope</tt> - Indicates which methods should be executed when an object
//   is used as a callback.
//
//     class Audit
//       def before(caller)
//         puts 'Audit: before is called'
//       end
//
//       def before_save(caller)
//         puts 'Audit: before_save is called'
//       end
//     end
//
//     class Account
//       include ActiveSupport::Callbacks
//
//       define_callbacks :save
//       set_callback :save, :before, Audit.new
//
//       def save
//         run_callbacks :save do
//           puts 'save in main'
//         end
//       end
//     end
//
//   In the above case whenever you save an account the method <tt>Audit#before</tt> will
//   be called. On the other hand
//
//     define_callbacks :save, :scope => [:kind, :name]
//
//   would trigger <tt>Audit#before_save</tt> instead. That's constructed by calling
//   <tt>#{kind}_#{name}</tt> on the given instance. In this case "kind" is "before" and
//   "name" is "save". In this context +:kind+ and +:name+ have special meanings: +:kind+
//   refers to the kind of callback (before/after/around) and +:name+ refers to the
//   method on which callbacks are being defined.
//
//   A declaration like
//
//     define_callbacks :save, :scope => [:name]
//
//   would call <tt>Audit#save</tt>.
//
Callback.defineCallbacks = function(clazz, callbacks) {
    var self = this;
    if (!_.isArray(callbacks)) {
        callbacks = [callbacks];
    }

    _.each(callbacks, function(callback) {
        var class_attribute = '_' + callback.toLowerCase() + '_callbacks';
        clazz[class_attribute] = [];
    });
};

// TODO
// Install a callback for the given event.
//
//   set_callback :save, :before, :before_meth
//   set_callback :save, :after,  :after_meth, :if => :condition
//   set_callback :save, :around, lambda { |r| stuff; yield; stuff }
//
// The second arguments indicates whether the callback is to be run +:before+,
// +:after+, or +:around+ the event. If omitted, +:before+ is assumed. This
// means the first example above can also be written as:
//
//   set_callback :save, :before_meth
//
// The callback can specified as a symbol naming an instance method; as a proc,
// lambda, or block; as a string to be instance evaluated; or as an object that
// responds to a certain method determined by the <tt>:scope</tt> argument to
// +define_callback+.
//
// If a proc, lambda, or block is given, its body is evaluated in the context
// of the current object. It can also optionally accept the current object as
// an argument.
//
// Before and around callbacks are called in the order that they are set; after
// callbacks are called in the reverse order.
//
// ===== Options
//
// * <tt>:if</tt> - A symbol naming an instance method or a proc; the callback
//   will be called only when it returns a true value.
// * <tt>:unless</tt> - A symbol naming an instance method or a proc; the callback
//   will be called only when it returns a false value.
// * <tt>:prepend</tt> - If true, the callback will be prepended to the existing
//   chain rather than appended.
// * <tt>:per_key</tt> - A hash with <tt>:if</tt> and <tt>:unless</tt> options;
//   see "Per-key conditions" below.
//
// ===== Per-key conditions
//
// When creating or skipping callbacks, you can specify conditions that
// are always the same for a given key. For instance, in Action Pack,
// we convert :only and :except conditions into per-key conditions.
//
//   before_filter :authenticate, :except => "index"
//
// becomes
//
//   set_callback :process_action, :before, :authenticate, :per_key => {:unless => proc {|c| c.action_name == "index"}}
//
// Per-key conditions are evaluated only once per use of a given key.
// In the case of the above example, you would do:
//
//   run_callbacks(:process_action, action_name) { ... dispatch stuff ... }
//
// In that case, each action_name would get its own compiled callback
// method that took into consideration the per_key conditions. This
// is a speed improvement for ActionPack.
//
Callback.setCallback = function(clazz, callback, kind, fun) {
    var chain = clazz['_' + callback.toLowerCase() + '_callbacks'];
    chain.push(new this(clazz, chain, callback, kind, fun));
};

//def set_callback(name, *filter_list, &block)
//  mapped = nil
//
//  __update_callbacks(name, filter_list, block) do |target, chain, type, filters, options|
//    mapped ||= filters.map do |filter|
//      Callback.new(chain, filter, type, options.dup, self)
//    end
//
//    filters.each do |filter|
//      chain.delete_if {|c| c.matches?(type, filter) }
//    end
//
//    options[:prepend] ? chain.unshift(*(mapped.reverse)) : chain.push(*mapped)
//
//    target.send("_#{name}_callbacks=", chain)
//  end
//end

// private methods

Callback._defineBeforeModelCallback = function(clazz, callback) {
    var self = this;
    clazz['before' + callback] = function(fun) {
        self.setCallback(clazz, callback, 'Before', fun);
    };
};

Callback._defineAroundModelCallback = function(clazz, callback) {
    var self = this;
    clazz['around' + callback] = function(fun) {
        self.setCallback(clazz, callback, 'Around', fun);
    };
};

Callback._defineAfterModelCallback = function(clazz, callback) {
    var self = this;
    clazz['after' + callback] = function(fun) {
        self.setCallback(clazz, callback, 'After', fun);
    };
};
