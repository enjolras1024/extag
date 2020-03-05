// src/core/shells/Component.js

import Parent from 'src/base/Parent'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Schedule from 'src/core/Schedule'
import Dependency from 'src/core/Dependency'
import Cache from 'src/core/models/Cache'
import Shell from 'src/core/shells/Shell'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Evaluator from 'src/core/template/Evaluator'
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
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
  FLAG_CHANGED_COMMANDS,
  FLAG_WAITING_TO_RENDER
} from 'src/share/constants'


var shellProto = Shell.prototype;
var elementPropto = Element.prototype;
var fragmentProto = Fragment.prototype;
// var emptyDesc = {};
var KEYS_PRESERVED = ['ns', 'tag', '$type', '$guid', '$flag'];
var METHODS_PRESERVED = [
  'on', 'off', 'emit',
  'appendChild', 'insertChild', 'removeChild', 'replaceChild', 
  'getParent', 'getChildren', 'setChildren', 'getContents', 'setContents',
  'get', 'set', 'cmd', 'bind', 'assign', 'update', 'render', 'attach', 'detach', 'invalidate', 'getSkin'
];

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
     * @param {Function} ctor
     * @param {Object} props
     * @returns {Component}
     */
    create: function create(ctor, props, scopes, template) {
      return new ctor(props, scopes, template);
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
        if (!_template) {
          (function() {
            var i, keys;
            var name = constructor.fullName || constructor.name;
            if (attributes) {
              keys = Array.isArray(attributes) ? attributes : Object.keys(attributes);
              for (i = 0; i < KEYS_PRESERVED.length; ++i) {
                if (keys.indexOf(KEYS_PRESERVED[i]) >= 0) {
                  logger.warn('`' + KEYS_PRESERVED[i] + '` is a preserved component property, cannot be an attribute of ' + name + '.');
                }
              }
            }
            // check if some final methods are override
            for (i = 0; i < METHODS_PRESERVED.length; ++i) {
              if (prototype[METHODS_PRESERVED[i]] !== Component.prototype[METHODS_PRESERVED[i]]) {
                logger.warn('`' + METHODS_PRESERVED[i] + '` is a preserved component method. You should be careful to override the method of ' + name + '.');
              }
            }
          })()
        }
      }

          // TODO: check attributes
        // 1. initialize attribute descriptors once and only once.
      // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
        Accessor.applyAttributeDescriptors(prototype, attributes, true); //
      // }

      // 2. initialize the attribute default values
      var defaults = Accessor.getAttributeDefaultValues(component);
      defineProp(component, '_props', {
        value: defaults, writable: false, enumerable: false, configurable: true
      });

      // 3. compile the template once and only once.
      if (!_template) {

        if (typeof constructor.template === 'string') {
          var HTMXParser = config.HTMXParser;
          _template = HTMXParser.parse(constructor.template, prototype);
        } else if (typeof constructor.template === 'function') {
          var JSXParser = config.JSXParser;
          _template = JSXParser.parse(constructor.template, prototype);
        }

        if (_template) {
          // constructor._template = _template;
          defineProp(constructor, '__extag_template__', {
            value: _template, writable: false, enumerable: false, configurable: true
          })
        } else {
          throw new TypeError('The template must be legal HTML string or DOM element');
        }
      }

      // 4. initialize the component as normal element
      Shell.initialize(component, _template.tag !== 'x:frag' ? 1 : 0, _template.tag, _template.ns || '');

      Element.defineMembers(component);

      // 6. setup
      if (scopes && scopes[0].context) {
        component.setup(scopes[0].context);
        if (component.context == null) {
          component.context = scopes[0].context;
        }
      } else {
        component.setup();
      }

      var HTMXEngine = config.HTMXEngine;

      HTMXEngine.driveComponent(component, _template, scopes, template, props);

      // 8. initialized
      //component.send('initialized');
      if (component.onInited) {
        component.onInited();
      }
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
   * Get property stored in _props or _props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);//this.__extag_descriptors__[key];
    if (!desc) {
      return this._props[key]
    }
    if (desc.bindable) {
      if (Dependency.binding()) {
        Dependency.add(this, key);
      }
      return !desc.get ? this._props[key] : desc.get.call(this, key, this._props);
    }
    return this[key];
    // return value;
    // return (desc && desc.get) ? desc.get.call(this, key, this._props) : this._props[key];
    // if (desc) {
    //   // if (Dep.binding && !desc.compute) {
    //   //   Dep.add(this, key);
    //   // }
    //   return !desc.get ? 
    //             this._props[key] : 
    //               desc.get.call(this, key, this._props);
    // }
    // return this._props[key];
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
      shellProto.set.call(this, key, val);
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
    // Custom attribute, stored in _props
    var props = this._props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.invalidate(FLAG_CHANGED);
        this.emit('changed.' + key, key, val, this);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, key, props);
      desc.set.call(this, val, props);
      val = desc.get.call(this, key, props);
      if (old !== val) {
        this.invalidate(FLAG_CHANGED);
        this.emit('changed.' + key, key, val, this);
      }
    }

    // return this;
  },

  bind: function(target, property, collect, reflect) {
    // var scope = this; 
    // if (collect && (typeof collect === 'function')) {
    //   DataBinding.compile({
    //     mode: DataBinding.MODES.ONE_WAY,
    //     evaluator: new Evaluator({func: collect})
    //   }, property, target, [scope]);
    // }
    // if (reflect && (typeof reflect === 'function')) {
    //   target.on('changed.' + property, function() {
    //     reflect.call(scope, target[property]);
    //   });
    // }
    Binding.create(this, target, property, collect, reflect);
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
    if (shellProto.attach.call(this, $skin)) {
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

    this.emit('update', this.$flag);

    if (this.$type !== 0) {
      config.HTMXEngine.transferProperties(this);
    } else if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
      this._parent.invalidate(FLAG_CHANGED_CHILDREN);
    }

    if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      // If this type is 0, we should ask its parent to render parent's children,
      // since its children are belong to its parent actually.
      if (this.type === 0 && this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        // this._parent.invalidate(2); 
        var parent = this.getParent(true);
        parent.$flag |= FLAG_CHANGED_CHILDREN;
        if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
          parent.$flag |= FLAG_WAITING_TO_RENDER;
          Schedule.insertRenderQueue(parent);
        }
      }
      this.$flag |= FLAG_WAITING_TO_RENDER;
      Schedule.insertRenderQueue(this);
      // this.render();
    }

    // this.render();
    
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
      elementPropto.render.call(this);
    } else {
      fragmentProto.render.call(this);
    }
    if (this.onRendered && this.$skin) {
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
  