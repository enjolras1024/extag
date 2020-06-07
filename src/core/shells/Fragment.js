// src/core/shells/Fragment.js

import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import { defineClass } from 'src/share/functions'
import {
  FLAG_CHANGED_CHILDREN,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_RENDERING
} from 'src/share/constants'

import config from 'src/share/config'

export default function Fragment(props, scopes, template) {
  Fragment.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Fragment, extends: Shell, mixins: [Parent.prototype],

  statics: {
    __extag_fragment_class__: true,

    initialize: function initialize(fragment, props, scopes, template) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (fragment.constructor !== Fragment) {
          throw new TypeError('Fragment is final class and can not be extended');
        }
      }
      // fragment type is 0
      Shell.initialize(fragment, 0, 'x:frag', '');

      fragment.scopes = scopes;
      
      if (scopes && template) {
        template.connect('contents', fragment, scopes);
        
      }

      
    },

    create: function create(props, scopes, template) {
      return new Fragment(props, scopes, template);
    }
  },
  /**
   * Update this shell and insert it into the schedule for rendering.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) == 0) {
      return;
    }
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }

    // if (this.onUpdating) {
    //   this.onUpdating();
    // }

    if (this.scopes && this.hasDirty('contents')) {
      var JSXEngine = config.JSXEngine;
      var contents = this._props.contents;
      if (!contents) {
        contents = [];
      } else if (!Array.isArray(contents)) {
        contents= [contents];
      }
      JSXEngine.reflow(this.scopes[0], this, contents);
    }

    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        var parent = this.getParent(true);
        parent.$flag |= FLAG_CHANGED_CHILDREN;
        if ((parent.$flag & FLAG_WAITING_RENDERING) === 0) {
          parent.$flag |= FLAG_WAITING_RENDERING;
          Schedule.insertRenderQueue(parent);
        }
      }
      this.$flag |= FLAG_WAITING_RENDERING;
      Schedule.insertRenderQueue(this);
    }

    // this.$flag ^= FLAG_WAITING_UPDATING;
    // this.render();
  },

  render: function render() {
    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      return false;
    }
    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_RENDERING);
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }
    // this.$flag = FLAG_NORMAL;
  }
});