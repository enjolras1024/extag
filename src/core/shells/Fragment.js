// src/core/shells/Fragment.js

import Parent from 'src/base/Parent'
import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import { defineClass } from 'src/share/functions'
import {
  FLAG_NORMAL,
  // FLAG_CHANGED,
  FLAG_CHANGED_CHILDREN,
  FLAG_WAITING_TO_RENDER
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
    if (this.$flag === FLAG_NORMAL) {
      return false;
    }

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

    if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        var parent = this.getParent(true);
        parent.$flag |= FLAG_CHANGED_CHILDREN;
        if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
          parent.$flag |= FLAG_WAITING_TO_RENDER;
          Schedule.insertRenderQueue(parent);
        }
      }
      this.$flag |= FLAG_WAITING_TO_RENDER;
      Schedule.insertRenderQueue(this);
    }
    
    // this.render();
    
    return true;
  },

  render: function render() {
    // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
    //   this.$flag = FLAG_NORMAL;
    //   return false;
    // }
    if (this.$flag === FLAG_NORMAL) {
      return false;
    }
    this.$flag = FLAG_NORMAL;
    return true;
  }
});