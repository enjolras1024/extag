// src/core/shells/Element.js


import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import DirtyMarker from 'src/base/DirtyMarker'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { defineClass } from 'src/share/functions'
import {
  TYPE_ELEM,
  FLAG_MOUNTED,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_DIGESTING,
  FLAG_SHOULD_RENDER_TO_VIEW
} from 'src/share/constants'
// import config from 'src/share/config'

// function buildCache(element) {
//   var cache = new Cache(element);
//   cache.owner = element;
//   return cache;
// }

/**
 * 
 * @param {string} tag      - tag name, with a namespace as prefix, e.g. 'svg:rect'
 * @param {Object} props 
 */
export default function Element(tag, props) {
  var idx = tag.indexOf(':'), ns = '';
  if (idx > 0) {
    ns = tag.slice(0, idx);
    tag = tag.slice(idx + 1);
  }
  Element.initialize(this, ns, tag, props);
}

defineClass({
  constructor: Element, extends: Shell, mixins: [Parent.prototype],

  statics: {
    __extag_element_class__: true,

    initialize: function initialize(element, ns, tag, props) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (element.constructor !== Element) {
          throw new TypeError('Element is final class and can not be extended');
        }
      }

      Shell.initialize(element, TYPE_ELEM, tag, ns);

      // Element.defineMembers(element);

      if (props) {
        element.assign(props);
      }
    }
  },

  /**
   * Update this element and insert it into the schedule for rendering.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
      return false;
    }

    HTMXEngine.transferProps(this);

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
  