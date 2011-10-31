var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('entrants', function() {
    this.defineColumn('name', 'string', {null: false});
    this.defineColumn('course_id', 'integer', {null: false});
});
