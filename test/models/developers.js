var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('developers', function() {
    this.defineColumn('name', 'string');
    this.defineColumn('salary', 'integer', {default: 70000});
    this.defineColumn('created_at', 'datetime');
    this.defineColumn('updated_at', 'datetime');
});
