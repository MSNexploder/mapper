var util = require('util');
var mapper = require('../../lib/mapper');

module.exports = mapper.define('posts', function() {
    this.defineColumn('author_id', 'integer');
    this.defineColumn('title', 'string', {null: false});
    this.defineColumn('body', 'text', {null: false});
    this.defineColumn('type', 'text');
    this.defineColumn('comments_count', 'integer', {default: 0});
    this.defineColumn('taggings_count', 'integer', {default: 0});
    this.defineColumn('taggings_with_delete_all_count', 'integer', {default: 0});
    this.defineColumn('taggings_with_destroy_count', 'integer', {default: 0});
    this.defineColumn('tags_count', 'integer', {default: 0});
    this.defineColumn('tags_with_destroy_count', 'integer', {default: 0});
    this.defineColumn('tags_with_nullify_count', 'integer', {default: 0});
});
