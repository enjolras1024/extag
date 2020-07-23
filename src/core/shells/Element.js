// src/core/shells/Element.js


import Schedule from 'src/core/Schedule'
import Cache from 'src/core/models/Cache'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import DirtyMarker from 'src/base/DirtyMarker'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { defineProp, defineClass } from 'src/share/functions'
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

      Element.defineMembers(element);

      if (props) {
        element.assign(props);
      }
    },
    // /**
    //  * 
    //  * @param {string} tag      - tag name, maybe with a namespace as prefix, e.g. 'svg:rect'
    //  * @param {Object} props    - DOM properties
    //  */
    // create: function create(tag, props) {
    //   return new Element(tag, props);
    // },

    /**
     * Define getter/setter for attrs, style and classes
     * @param {Element|Component} element 
     */
    defineMembers: function defineMembers(element) {
      var prototype = element.constructor.prototype;
      if (!('classes' in prototype)) {
        // defineProp(prototype, 'attrs', {
        //   get: function() {
        //     if (!this._attrs) {
        //       this._attrs = new Cache(this);
        //       // defineProp(this, '_attrs', {
        //       //   value: new Cache(this), 
        //       //   configurable: true
        //       // });
        //     }
        //     return this._attrs;
        //   }//,
        //   // set: function(value) {
        //   //   resetCache(this.attrs, value);
        //   // }
        // });
        defineProp(prototype, 'style', {
          get: function() {
            if (!this._style) {
              this._style = new Cache(this);
              // defineProp(this, '_style', {
              //   value: new Cache(this), 
              //   configurable: true
              // });
            }
            return this._style;
          }//,
          // set: function(value) {
          //   resetCache(this.style, value);
          // }
        });
        defineProp(prototype, 'classes', {
          get: function() {
            if (!this._classes) {
              this._classes = new Cache(this);
              // defineProp(this, '_classes', {
              //   value: new Cache(this), 
              //   configurable: true
              // });
            }
            return this._classes;
          }//,
          // set: function(value) {
          //   resetCache(this.classes, value);
          // }
        });
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
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }

    HTMXEngine.transferProps(this);

    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      this.$flag |= FLAG_WAITING_DIGESTING;
      Schedule.insertDigestQueue(this);
    }

    // this.$flag ^= FLAG_WAITING_UPDATING;
    // this.digest();
  },

  /**
   * Render the dirty parts of this element to the attached skin 
   */
  digest: function digest() {
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      return false;
    }

    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }

    if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
      var viewEngine = Shell.getViewEngine(this);

      viewEngine.renderShell(this.$skin, this);

      DirtyMarker.clean(this);
  
      // this._attrs && DirtyMarker.clean(this._attrs);
      this._style && DirtyMarker.clean(this._style);
      this._classes && DirtyMarker.clean(this._classes);

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
  