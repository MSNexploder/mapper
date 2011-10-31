var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('authors', function() {
    this.defineColumn('name', 'string', {null: false});
    this.defineColumn('author_address_id', 'integer');
    this.defineColumn('author_address_extra_id', 'integer');
    
    this.validatesLengthOf('name', {minimum: 2, maximum: 30});
    this.validatesExclusionOf('name', {in: ['Haha', 'Huhu']});
    
    this.validatesPresenceOf(['name']);
});
