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
      var name = template && template.props && template.props.name;

      Component.initialize(slot, props, scopes, {
        props: {
          name: name || ''
        }
      });
      
      scopes[0].on('updating', slot.onScopeUpdating.bind(slot));
      slot.on('updating', slot.onUpdating.bind(slot));

      if (template.children) {
        var contents = template.children.slice(0);
        contents.scopes = scopes;
        slot.set('contents', contents);
      }

      slot.scopes = scopes;
    },
    template: '<x:frag></x:frag>'
  },

  onUpdating: function onUpdating() {
    if (this.hasDirty('collection') || this.hasDirty('contents')) {
      var scopes = this.scopes;
      var contents = this.get('contents');
      var collection = this.get('collection');
      if (collection && collection.length) {
        scopes = collection.scopes;
        HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      } else if (contents && contents.length) {
        scopes = contents.scopes;
        collection = contents.slice(0);
        HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      } else {
        this.setChildern([]);
      }
    }
  },

  onScopeUpdating: function onScopeUpdating() {
    var scopes = this.scopes;
    var content, name, n, i
    var scopeContents;
    var collection;
    
    // var selfContents = this.get('contents');

    if (scopes[0].hasDirty('contents')) {
      collection = [];
      scopeContents = scopes[0].get('contents');
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
      this.set('collection', collection);
    }

    // if (scopeContents && scopeContents.length > 0) {
    //   var name = this.get('name') || '';
    //   for (i = 0, n = scopeContents.length; i < n; ++i) {
    //     content = scopeContents[i];
    //     if (content != null && name === (content.slot || '')) {
    //       collection.push(content);
    //     }
    //   }
    //   this.set('collection', collection);
    //   // if (collection.length) {
    //   //   scopes = scopeContents.scopes;
    //   //   HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
    //   // }
    //   // this.useDefault = false;
    // }

    // if (!collection.length && selfContents) {
    //   // use the default template to slot here
    //   if (this.useDefault) {
    //     return;
    //   }
    //   for (i = 0, n = selfContents.length; i < n; ++i) {
    //     content = selfContents[i];
    //     if (content != null) {
    //       collection.push(content);
    //     }
    //   }
    //   if (collection.length) {
    //     scopes = selfContents.scopes;
    //     HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
    //   }
    //   this.useDefault = true;
    // }
  }
});