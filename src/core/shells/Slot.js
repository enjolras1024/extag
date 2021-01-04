// src/core/shells/Slot.js

import { defineClass } from 'src/share/functions'
import Component from 'src/core/shells/Component'
import HTMXEngine from 'src/core/template/HTMXEngine'

export default function Slot(props, scopes, template) {
  Slot.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Slot, extends: Component,

  statics: {
    initialize: function initialize(slot, props, scopes, template) {
      Component.initialize(slot, props, scopes, template);
      scopes[0].on('contents', slot.onScopeContents.bind(slot));
      slot.on('updating', slot.onUpdating.bind(slot));
      slot.scopes = scopes;
      slot.collect();
    },
    template: '<x:frag></x:frag>'
  },

  collect: function() {
    var scopes = this.scopes;
    var content, name, n, i
    var scopeContents;
    var collection;

    if (scopes[0]._contents) {
      collection = [];
      scopeContents = scopes[0]._contents;
      collection.scopes = scopeContents.scopes;
      if (scopeContents && scopeContents.length > 0) {
        name = this.get('name') || '';
        for (i = 0, n = scopeContents.length; i < n; ++i) {
          content = scopeContents[i];
          if (content != null && name === (content.slot || '')) {
            collection.push(content);
          }
        }
      }
      this._collection = collection;
      this.invalidate();
    }
  },

  onUpdating: function onUpdating() {
    if (this._collection || this._contents) {
      var scopes = this.scopes;
      var contents = this._contents;
      var collection = this._collection;
      if (collection && collection.length) {
        scopes = collection.scopes;
        HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      } else if (contents && contents.length) {
        scopes = contents.scopes;
        collection = contents.slice(0);
        HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      } else {
        this.setChildren([]);
      }
      this._collection = null;
      if (this._contents) {
        if (this._contents.length) {
          this._contents.length = 0;
        } else {
          this._contents = null;
        }
      }
    } else {
      this.setChildren([]);
    }
  },

  onScopeContents: function onScopeContents() {
    this.collect();
  }
});