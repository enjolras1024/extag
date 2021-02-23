// src/core/shells/Element.js

import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import DirtyMarker from 'src/base/DirtyMarker'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { defineClass, throwError } from 'src/share/functions'
import {
  TYPE_ELEM,
  EMPTY_ARRAY,
  FLAG_MOUNTED,
  FLAG_CHANGED_CACHE,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_DIGESTING,
  FLAG_SHOULD_RENDER_TO_VIEW
} from 'src/share/constants'

/**
 * 
 * @param {string} tag      - tag name, with a namespace as prefix, e.g. 'svg:rect'
 * @param {Object} props 
 */
// export default function Element(tag, props) {
//   var idx = tag.indexOf(':'), ns = '';
//   if (idx > 0) {
//     ns = tag.slice(0, idx);
//     tag = tag.slice(idx + 1);
//   }
//   Element.initialize(this, ns, tag, props);
// }

export default function Element(vnode, scopes) {
  Element.initialize(this, vnode, scopes || EMPTY_ARRAY);
}

defineClass({
  constructor: Element, extends: Shell, mixins: [Parent.prototype],

  statics: {
    __extag_element_class__: true,


    initialize: function initialize(element, vnode, scopes) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (element.constructor !== Element) {
          throwError('Element is final class and can not be extended');
        }
        if (!vnode.tag) {
          throwError('Unknown tag for element')
        }
      }

      Shell.initialize(element, TYPE_ELEM, vnode.tag, vnode.ns);

      element.__extag_scopes__ = scopes;

      if (vnode) {
        HTMXEngine.driveContent(element, scopes, vnode, true);
      }

      // Element.defineMembers(element);

      // if (props) {
      //   element.assign(props);
      // }
    }
  },

  /**
   * accept virtual node(s) from scopes
   * @param {Array|VNOde} vnodes - some virtual node(s) created by Extag.node()
   * @param {Array} scopes 
   */
  accept: function accept(vnodes, scopes) {
    if (vnodes == null) {
      vnodes = EMPTY_ARRAY;
    } else if (!Array.isArray(vnodes)) {
      vnodes = [vnodes];
    }
    HTMXEngine.driveChildren(this, scopes || EMPTY_ARRAY, vnodes, false);
  },

  /**
   * Update this element and insert it into the schedule for rendering.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
      return false;
    }

    // if ((this.$flag & FLAG_CHANGED_CACHE) !== 0) {
    //   HTMXEngine.transProps(this);
    // }
    
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      this.$flag |= FLAG_WAITING_DIGESTING;
      Schedule.insertDigestQueue(this);
    }
  },

  /**
   * Render the dirty parts of this element to the attached skin 
   */
  digest: function digest() {
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      return false;
    }

    if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
      var viewEngine = Shell.getViewEngine(this);

      viewEngine.renderShell(this.$skin, this);

      DirtyMarker.clean(this);

      if (this._style) {
        DirtyMarker.clean(this._style);
      }

      if (this._commands) {
        this._commands = null;
      }

      this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
    }
    
    if (this.$skin && (this.$flag & FLAG_MOUNTED === 0)) {
      this.$flag |= FLAG_MOUNTED;
    }

    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
  }
});
  