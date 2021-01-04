// src/core/shells/Fragment.js

import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import HTMXEngine from 'src/core/template/HTMXEngine'
import DirtyMarker from 'src/base/DirtyMarker'
import { defineClass } from 'src/share/functions'
import {
  FLAG_CHANGED_CHILDREN,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_DIGESTING
} from 'src/share/constants'

// import config from 'src/share/config'

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
        HTMXEngine.driveComponent(fragment, scopes, template, props);
      }
    }
  },

  /**
   * accept virtual node(s) from scopes
   * @param {Array|VNOde} vnodes - some virtual node(s) created by Extag.node()
   * @param {Array} scopes 
   */
  accept: function accept(vnodes, scopes) {
    if (vnodes != null && !Array.isArray(vnodes)) {
      vnodes = [vnodes];
    }
    HTMXEngine.driveChildren(this, scopes, vnodes, false);
  },

  /**
   * Update this shell and insert it into the schedule for rendering.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) == 0) {
      return;
    }

    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        var parent = this.getParent(true);
        parent.$flag |= FLAG_CHANGED_CHILDREN;
        if ((parent.$flag & FLAG_WAITING_DIGESTING) === 0) {
          parent.$flag |= FLAG_WAITING_DIGESTING;
          Schedule.insertDigestQueue(parent);
        }
      }
      this.$flag |= FLAG_WAITING_DIGESTING;
      Schedule.insertDigestQueue(this);
    }
  },

  /**
   * clean dirty parts
   */
  digest: function digest() {
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      return false;
    }
    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
    DirtyMarker.clean(this);
  }
});