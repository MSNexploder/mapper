var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('companies', function() {
    this.defineColumn('type', 'string');
    this.defineColumn('firm_name', 'string');
    this.defineColumn('name', 'string');
    this.defineColumn('client_of', 'integer');
    this.defineColumn('rating', 'integer', {default: 1});
    this.defineColumn('account_id', 'integer');

    this.hasOne('accounts', {foreign_key: 'firm_id'});
    this.belongsTo('firm');
});
