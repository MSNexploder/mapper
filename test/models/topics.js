var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('topics', function() {
    this.defineColumn('title', 'string');
    this.defineColumn('author_name', 'string');
    this.defineColumn('author_email_address', 'string');
    this.defineColumn('written_on', 'datetime');
    this.defineColumn('bonus_time', 'time');
    this.defineColumn('last_read', 'date');
    this.defineColumn('content', 'text');
    this.defineColumn('approved', 'boolean', {default: true});
    this.defineColumn('replies_count', 'integer', {default: 0});
    this.defineColumn('parent_id', 'integer');
    this.defineColumn('parent_title', 'string');
    this.defineColumn('type', 'string');
    this.defineColumn('group', 'string');
});
