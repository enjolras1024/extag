// src/core/shells/Element.js

import Parent from 'src/base/Parent'
import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import { defineProp, defineClass } from 'src/share/functions'
import {
  TYPE_ELEM,
  FLAG_NORMAL,
  FLAG_CHANGED_CACHE,
  FLAG_CHANGED_CHILDREN,
  FLAG_CHANGED_COMMANDS,
  FLAG_WAITING_TO_RENDER
} from 'src/share/constants'
import config from 'src/share/config'

var FLAG_SHOULD_RENDER = (FLAG_CHANGED_CACHE | FLAG_CHANGED_CHILDREN | FLAG_CHANGED_COMMANDS);


// function buildCache(element) {
//   var cache = new Cache(element);
//   cache.owner = element;
//   return cache;
// }

/**
 * 
 * @param {string} tag      - tag name, with a namespace as prefix, e.g. 'svg:rect'
 * @param {Object} props 
 * @param {Component} scope 
 * @param {Array} locals 
 */
export default function Element(tag, props, scopes, template) {
  var idx = tag.indexOf(':'), ns = '';
  if (idx > 0) {
    ns = tag.slice(0, idx);
    tag = tag.slice(idx + 1);
  }
  Element.initialize(this, ns, tag, props, scopes, template);
}

defineClass({
  constructor: Element, extends: Shell, mixins: [Parent.prototype],

  statics: {
    initialize: function initialize(element, ns, tag, props, scopes, template) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (element.constructor !== Element) {
          throw new TypeError('Element is final class and can not be extended');
        }
      }

      Shell.initialize(element, TYPE_ELEM, tag, ns);

      Element.defineMembers(element);

      if (scopes && template) {
        // var HTMXEngine = config.HTMXEngine;
        // if (props && template.props) {
        //   HTMXEngine.initProps(assign({}, template.props, props), scopes, element);
        // } else if (template.props) {
        //   HTMXEngine.initProps(template.props, scopes, element);
        // } else if (props) {
        //   HTMXEngine.initProps(props, scopes, element);
        // }
        // HTMXEngine.initOthers(template, scopes, element);
      } else if (props) {
        element.assign(props);
      }
    },
    /**
     * 
     * @param {string} tag      - tag name, with a namespace as prefix, e.g. 'svg:rect'
     * @param {Object} props    - properties, maybe containing expressions from component template
     * @param {Component} scope - Scope component passed in, when creating an element in component template
     * @param {Array} locals    - Local varibles in the scope, including scope self and iterator varible when using 'x-for' in component template
     */
    create: function create(tag, props, scope, locals) {
      return new Element(tag, props, scope, locals);
    },

    /**
     * Always update the style and classes through member variables.
     * @param {Element|Compoent} element 
     */
    // convert: function convert (element) {
    //   var _props = element._props;
    
    //   if (element.hasDirty('style')) {
    //     DirtyMarker.clean(element, 'style');
    //     var style = _props.style;
    //     if (typeof style === 'object') {
    //       resetCache(element.style, style);
    //     } else if (typeof style === 'string') {
    //       // element.attrs.set('style', style);
    //       var viewEngine = Shell.getViewEngine(element);
    //       if (viewEngine) {
    //         style = toStyle(style, viewEngine);
    //       }
    //       resetCache(element.style, style);
    //     }
    //   }
    //   // if (element.hasDirty('attrs')) {
    //   //   DirtyMarker.clean(element, 'attrs');
    //   //   if (typeof _props.attrs === 'object') {
    //   //     element.attrs = _props.attrs;
    //   //   } else {
    //   //     element.attrs = null;
    //   //   }
    //   // }
    //   if (element.hasDirty('classes')) {
    //     DirtyMarker.clean(element, 'classes');
    //     var classes = _props.classes;
    //     if (typeof classes !== 'object') {
    //       classes = toClasses(classes);
    //     }
    //     resetCache(element.classes, classes);
    //   }
    // },

    /**
     * Define getter/setter for attrs, style and classes
     * @param {Element|Component} element 
     */
    defineMembers: function defineMembers(element) {
      var prototype = element.constructor.prototype;
      if (!('classes' in prototype)) {
        defineProp(prototype, 'attrs', {
          get: function() {
            if (!this._attrs) {
              this._attrs = new Cache(this);
              // defineProp(this, '_attrs', {
              //   value: new Cache(this), 
              //   configurable: true
              // });
            }
            return this._attrs;
          }//,
          // set: function(value) {
          //   resetCache(this.attrs, value);
          // }
        });
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
   * Update this shell and append it to the schedule for rendering.
   */
  update: function update() {
    if (this.$flag === FLAG_NORMAL) {
      return false;
    }
    // Element.convert(this);
    config.HTMXEngine.transferProperties(this);

    if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      this.$flag |= FLAG_WAITING_TO_RENDER;
      Schedule.insertRenderQueue(this);
    }

    // this.render();
    
    return true;
  },

  /**
   * Render the dirty parts of this shell to the attached skin 
   */
  render: function render() {
    // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
    //   this.$flag = FLAG_NORMAL;
    //   return false;
    // }

    if (this.$flag === FLAG_NORMAL) {
      return false;
    }

    if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER)) {
      var viewEngine = Shell.getViewEngine(this);

      viewEngine.renderShell(this.$skin, this);
      this._children && Parent.clean(this);
      DirtyMarker.clean(this);
  
      this._attrs && DirtyMarker.clean(this._attrs);
      this._style && DirtyMarker.clean(this._style);
      this._classes && DirtyMarker.clean(this._classes);

      if (this._commands) {
        this._commands = null;
      }
    }

    this.$flag = FLAG_NORMAL;
    return true;
  }
});
  