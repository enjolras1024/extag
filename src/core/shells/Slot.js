// src/core/shells/Slot.js

import Expression from 'src/base/Expression'
import Shell from 'src/core/shells/Shell'
import Component from 'src/core/shells/Component'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { FLAG_CHANGED } from 'src/share/constants'
import { assign, defineClass } from 'src/share/functions'

export default function Slot(props, scopes, template) {
  Slot.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Slot, extends: Component,
  statics: {
    initialize: function initialize(slot, props, scopes, template) {
      // Shell.initialize(slot, 0, 'x:slot', '');
      var name = template && template.props && template.props.name;

      Component.initialize(slot, props, scopes, {
        props: {
          name: name || ''
        }
      });

      slot.template = assign({}, template);
      if (name) {
        delete slot.template.props.name;
      }

      slot.scopes = scopes;

      slot.invalidate(FLAG_CHANGED);
      // slot.invalidate = slot.invalidate.bind(slot);
      scopes[0].on('changed.contents', function() {
        slot.invalidate(FLAG_CHANGED);
      });
    },
    template: '<x:frag></x:frag>'
  },

  onUpdating: function onUpdating() {
    // if (!this.hasDirty('scopeContents') && !this.hasDirty('name')) {
    //   return;
    // }

    var fragment = [], children, content, n, i;
    var scopeContents = this.scopes[0].getContents();
    var template = this.template, scopes = this.scopes;

    if (scopeContents && scopeContents.length > 0) {
      var name = this.get('name') || '';
      for (i = 0, n = scopeContents.length; i < n; ++i) {
        content = scopeContents[i];
        if (name === (content.attrs.get('x:slot') || '')) {
          fragment.push(content);
        }
      }
    } else if (template.children) {
      children = template.children;
      for (i = 0, n = children.length; i < n; ++i) {
        content = HTMXEngine.makeContent(scopes, children[i]);
        if (content) {
          fragment.push(content);
        }
      }
    }

    this.setChildren(fragment);
  }
});