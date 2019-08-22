// src/core/shells/Component.js

import Parent from 'src/base/Parent'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Expression from 'src/base/Expression'
import DirtyMarker from 'src/base/DirtyMarker'
import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
// import JSXEngine from 'src/core/template/JSXEngine.3'
// import HTMXEngine from 'src/core/template/HTMXEngine'
// import HTMXTemplate from 'src/core/template/HTMXTemplate'
// import HTMXParser from 'src/core/template/parsers/HTMXParser'

// import Dep from 'src/core/Dep'
import config from 'src/share/config'
import logger from 'src/share/logger'
import { slice, assign, defineProp, defineClass } from 'src/share/functions'
import {
  FLAG_NORMAL,
  FLAG_CHANGED,
  FLAG_CHANGED_CHILDREN,
  FLAG_CHANGED_COMMANDS
} from 'src/share/constants'

var shellProto = Shell.prototype;
var elementPropto = Element.prototype;
var fragmentProto = Fragment.prototype;
// var emptyDesc = {};

export default function Component(props, scopes, template) {
  Component.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Component, extends: Shell, mixins: [Parent.prototype],

  //mixins: [Watcher.prototype, Accessor.prototype],

  // __extag_descriptors__: {
  //   contents: {
  //     // type: Array
  //   }
  // }, 

  statics: {
    
    __extag_component_class__: true,

    /**
     * Factory method for creating a component
     *
     * @param {Function} ClassRef
     * @param {Object} props
     * @returns {Component}
     */
    create: function create(ClassRef, props, scopes, template) {
      return new ClassRef(props, scopes, template);
    },

    /**
     * Initialize this component, using template.
     *
     * @param {Component} component
     * @param {Object} props
     */
    initialize: function initialize(component, props, scopes, template) {
      var constructor = component.constructor;
      var prototype = constructor.prototype;
      var attributes = constructor.attributes;
      var _template = constructor.__extag_template__;

      if (__ENV__ === 'development') {
        if (typeof attributes === 'object') {
          var keys = Array.isArray(attributes) ? attributes : Object.keys(attributes);
          var keysPrevered = ['ns', 'tag', '$type', '$guid', '$flag'];
          for (var i = 0; i < keysPrevered.length; ++i) {
            if (keys.indexOf(keysPrevered[i]) >= 0) {
              logger.warn('`' + keysPrevered[i] + '` is prevered property, cannot be an attribute.');
            }
          }
        }
        // TODO: check if some final methods are overrided
      }

          // TODO: check attributes
        // 1. initialize attribute descriptors once and only once.
      // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
        Accessor.applyAttributeDescriptors(prototype, attributes, true); //
      // }

      // 2. initialize the attribute default values
      var defaults = Accessor.getAttributeDefaultValues(component);
      defineProp(component, '$props', {
        value: defaults, writable: false, enumerable: false, configurable: false
      });

      // 3. compile the template once and only once.
      if (!_template) {

        if (constructor.template) {
          var HTMXParser = config.HTMXParser;
          _template = HTMXParser.parse(constructor.template, prototype);
        }

        if (_template) {
          // constructor._template = _template;
          defineProp(constructor, '__extag_template__', {
            value: _template, writable: false, enumerable: false, configurable: false
          })
        } else {
          throw new TypeError('The template must be legal HTML string or DOM element');
        }
      }

      // 4. initialize the component as normal element
      Shell.initialize(component, _template.tag !== 'x:frag' ? 1 : 0, _template.tag, _template.ns || '');

      Element.defineMembers(component);

      // var key, value;
      // 5. accept props
      // if (_template.props) {
      //   // component.assign(_template.props);
      //   // if (_template.props.expressions) {
      //   //   Expression.compile(_template.props.expressions, component, component, [component]);
      //   // }
        
      //   for (key in _template.props) {
      //     value = _template.props[key];
      //     if (typeof value === 'object' && value instanceof Expression) {
      //       value.compile(key, component, component, [component]);
      //     } else {
      //       component.set(key, value);
      //     }
      //   }
      // }

      // if (props) {
      //   // component.assign(props);
      //   // if (scope && locals && props.expressions) {
      //   //   Expression.compile(props.expressions, component, scope, locals);
      //   // }
      //   for (key in props) {
      //     value = props[key];
      //     if (typeof value === 'object' && value instanceof Expression) {
      //       value.compile(key, component, scope, locals);
      //     } else {
      //       component.set(key, value);
      //     }
      //   }
      // }

      var HTMXEngine = config.HTMXEngine;

      HTMXEngine.initProps(_template.props, [component], component);

      if (template && template.props) {
        if (props) {
          props = assign({}, template.props, props);
        } else {
          props = template.props;
        }
      }
      if (__ENV__ === 'development') {
        Validator.validate0(component, props);
      }
      // TODO: HTMXEgine.initSelf()
      if (scopes && template) {
        HTMXEngine.initProps(props, scopes, component);
      } else if (props) {
        component.assign(props);
      }     

      // console.log(component.toString(), _template.props, props)

      // 6. setup
      if (scopes && scopes[0].context) {
        component.setup(scopes[0].context);
        if (component.context == null) {
          component.context = scopes[0].context;
        }
      } else {
        component.setup();
      }

      if (_template) {
        HTMXEngine.initOthers(_template, [component], component);
      }

      if (scopes && template) {
        HTMXEngine.initOthers(template, scopes, component);
      }

      // TODO: HTMXEngine.initChildren
      // TODO: HTMXEngine.buildChildren

      // 7. start the template engine
      // HTMXEngine.start(_template, component, component, [component]);

      // 8. initialized
      //component.send('initialized');
      if (component.onInited) {
        component.onInited();
      }

      // 9. extras
      // if (component.reflow) {
      //   component.on('update', (function() {
      //     var vnodes = this.reflow(JSXEngine.createElement);
      //     if (vnodes) {
      //       console.log('vnodes', vnodes)
      //       JSXEngine.reflowComponent(this, vnodes);
      //     }
      //   }).bind(component));
      // }
    }

  },

  // $res: function(name) {
  //   var resources = this.constructor.resources;
  //   if (resources && (name in resources)) {
  //     return resources[name];
  //   }
  //   if (typeof window !== 'undefined') {
  //     return window[name];
  //   }
  //   if (typeof global !== 'undefined') {
  //     return global[name];
  //   }
  // },

  /**
   * Get property stored in _props or $props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);//this.__extag_descriptors__[key];
    if (desc) {
      // if (Dep.binding && !desc.compute) {
      //   Dep.add(this, key);
      // }
      return !desc.get ? 
                this.$props[key] : 
                  desc.get.call(this, this.$props, key);
    }
    return this._props[key];
  },

  /**
   * Set property, including DOM properties and custom attributes.
   * @param {string} key
   * @param {*} val
   */
  set: function set(key, val) {
    // if (arguments.length === 1) {
    //   var opts = key;
    //   for (key in opts) {
    //     this.set(key, opts[key]);
    //   }
    //   return this;
    // }

    var desc = Accessor.getAttrDesc(this, key);//this.__extag_descriptors__[key];
    // DOM property, stored in _props
    if (!desc) {
      Shell.prototype.set.call(this, key, val);
      return;
    }
    // validation in development 
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // Unbindable custom prpoerty
    if (!desc.bindable) {
      this[key] = val;
      return;
    }
    // Custom attribute, stored in $props
    var props = this.$props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.invalidate(FLAG_CHANGED);
        this.emit('changed.' + key, key, val, this);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props, key);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props, key);
      if (old !== val) {
        this.invalidate(FLAG_CHANGED);
        this.emit('changed.' + key, key, val, this);
      }
    }

    // return this;
  },

  /**
   * Setup before start the HTMXEngine. Accept the existed context by default.
   * @param {Object} context - from the scope component on the upper level
   */
  setup: function setup(context) {
    if (context) {
      this.context = context;
    }
  },

  /**
   * attach a skin to this shell.
   * You should use this method for a root component in browser. 
   * For the child texts, elements and components, the viewEngine (ExtagSkin as default) help them attach the skins.
   * On the server-side, the shell do not need to attach some skin, since there is no skin on server-side actually.
   * @param {HTMLElement} $skin
   */
  attach: function attach($skin) {
    if (Shell.prototype.attach.call(this, $skin)) {
      if (this.onAttached) {
        this.onAttached($skin);
      }
      return true;
    }
    return false;
  },

  /**
   * detach the skin from this shell, and destroy itself firstly.
   * You can config('prevent-detach', true) to prevent detaching and destroying.
   * @param {boolean} force - if not, detaching can be prevented, so this shell and the skin can be reused.
   */
  detach: function detach(force) {
    var $skin = this.getSkin();
    if (Shell.prototype.detach.call(this, force)) {
      if (this.onDetached && $skin) {
        this.onDetached($skin);
      }
      if (this.onDestroyed) {
        this.onDestroyed();
      }
      return true;
    }
    return false;
  },

  /**
   * Update this shell and append it to the schedule for rendering.
   */
  update: function update() {
    if (this.$flag === FLAG_NORMAL) {
      return false;
    }

    if (this.onUpdating) {
      // var patterns = this.onUpdating(JSXEngine.node, JSXEngine.slot);
      // if (patterns && Array.isArray(patterns)) {
      //   JSXEngine.reflow(patterns, this, this);
      // }
      this.onUpdating();
    }

    this.emit('update');

    if (this.$type !== 0) {
      Element.convert(this);
    } else if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
      this._parent.invalidate(FLAG_CHANGED_CHILDREN);
    }

    // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
    //   // If this type is 0, we should ask its parent to render parent's children,
    //   // since its children are belong to its parent actually.
    //   if (this.type === 0 && this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
    //     // this._parent.invalidate(2); 
    //     var parent = this._parent;
    //     if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
    //       // parent.invalidate(FLAG_CHANGED_CHILDREN | FLAG_WAITING_TO_RENDER);
    //       parent.$flag |= FLAG_WAITING_TO_RENDER;
    //       parent.$flag |= FLAG_CHANGED_CHILDREN;
    //       // Schedule.insertRenderQueue(parent);
    //       parent.render();
    //     }
    //   }
    //   this.$flag |= FLAG_WAITING_TO_RENDER;
    //   // Schedule.insertRenderQueue(this);
    //   this.render();
    // }

    this.render();
    
    return true;
  },

  /**
   * Render the dirty parts of this shell to the attached skin 
   */
  render: function render() {
    if (this.$flag === FLAG_NORMAL) {
      return false;
    }
    if (this.$type !== 0) {
      Element.prototype.render.call(this);
    } else {
      Fragment.prototype.render.call(this);
    }
    if (this.onRendered) {
      Schedule.pushCallbackQueue((function() {
        this.onRendered(this.$skin);
      }).bind(this));
    }
    return true;
  },

  getContents: function getContents() {
    return this._contents;
  },

  setContents: function setContents(value) {
    if (this._contents !== value) {
      this._contents = value;
      this.emit('changed.contents', 'contents', value, this);
    }
  },

  /**
   * @param {string} name
   * @param {Shell} part
   */
  addNamedPart: function (name, part) {
    // if (name in this) {
    //   throw new Error(this.toString() + ' has `' + name + '` already!');
    // }
    this[name] = part;
  }
});
  