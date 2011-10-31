var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('accounts', function() {
    this.belongsTo('firm', {table: 'companies'});
    this.defineColumn('firm_name', 'string');
    this.defineColumn('credit_limit', 'integer');
});
