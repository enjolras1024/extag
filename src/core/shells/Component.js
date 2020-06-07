// src/core/shells/Component.js

import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import DirtyMarker from 'src/base/DirtyMarker'
import Schedule from 'src/core/Schedule'
import Dependency from 'src/core/Dependency'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import Element from 'src/core/shells/Element'
import Binding from 'src/core/bindings/Binding'
import config from 'src/share/config'
import logger from 'src/share/logger'
import { 
  defineProp, 
  defineClass, 
  getOwnPropDesc 
} from 'src/share/functions'
import {
  TYPE_FRAG,
  TYPE_ELEM,
  FLAG_MOUNTED,
  FLAG_DESTROYED,
  FLAG_CHANGED_CACHE,
  // FLAG_CHANGED_COMMANDS,
  FLAG_CHANGED_CHILDREN,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_RENDERING,
  FLAG_SHOULD_RENDER_TO_VIEW
} from 'src/share/constants'
import captureError from 'src/core/captureError'

var shellProto = Shell.prototype;

var KEYS_PRESERVED = [
  '$meta', '$flag', '$skin', 
  'attrs', 'style', 'classes',
  '_dirty', '_props', '_attrs', '_style', '_classes'
];
var METHODS_PRESERVED = [
  'on', 'off', 'emit',
  'appendChild', 'insertChild', 'removeChild', 'replaceChild', 
  'getParent', 'getChildren', 'setChildren', 'getContents', 'setContents',
  'get', 'set', 'cmd', 'bind', 'assign', 'update', 'render', 'attach', 'detach', 'invalidate'
];

/**
 * 
 * @param {Object}    props       - component attributes and DOM properties
 * @param {Array}     scopes      - Internal use, including the host component and iterator variable from x:for loop
 * @param {Object}    template    - Internal use, for initializing component attributes, contents and events
 */
export default function Component(props, scopes, template) {
  Component.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Component, extends: Shell, mixins: [Parent.prototype],

  statics: {
    
    __extag_component_class__: true,

    /**
     * Creating a component
     *
     * @param {Function}  ctor        - component constructor or class
     * @param {Object}    props       - component attributes and DOM properties
     * @returns {Component}
     */
    create: function create(ctor, props) {
      return new ctor(props);
    },

    destroy: function destroy(component) {
      if (component.$flag & FLAG_DESTROYED) { return; }
      component.emit('destroying');
      Shell.destroy(component);
    },

    /**
     * Initialize this component, using template.
     */
    initialize: function initialize(component, props, scopes, template) {
      var constructor = component.constructor;
      var prototype = constructor.prototype;
      var attributes = constructor.attributes;
      var _template = constructor.__extag_template__;

      // eslint-disable-next-line no-undef
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

      // apply attribute descriptors once and only once.
      // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
        Accessor.applyAttributeDescriptors(prototype, attributes); //
      // }

      // get attribute default values
      var defaults = Accessor.getAttributeDefaultValues(component);
      // defineProp(component, '_props', {
      //   value: defaults, writable: false, enumerable: false, configurable: true
      // });
      component._props = defaults;

      // parsing template once and only once.
      if (!_template) {
        try {
          if (typeof constructor.template === 'string') {
            var HTMXParser = config.HTMXParser;
            _template = HTMXParser.parse(constructor.template, prototype);
          } else if (typeof constructor.template === 'function') {
            var JSXParser = config.JSXParser;
            _template = JSXParser.parse(constructor.template, prototype);
          } else {
            throw new TypeError('The static template must be string or function');
          }
  
          if (_template) {
            constructor.__extag_template__ = _template;
            // defineProp(constructor, '__extag_template__', {
            //   value: _template, writable: false, enumerable: false, configurable: true
            // })
          }
        } catch (e) {
          captureError(e, component, 'parsing');
        }
      }

      // 4. initialize the component as normal element
      Shell.initialize(component, _template.tag !== 'x:frag' ? TYPE_ELEM : TYPE_FRAG, _template.tag, _template.ns || '');

      Element.defineMembers(component);

      // 6. setup
      var model;
      if (scopes && scopes[0].context) {
        model = component.setup(scopes[0].context);
        if (component.context == null) {
          component.context = scopes[0].context;
        }
      } else {
        model = component.setup();
      }

      if (model != null) {
        if (typeof model !== 'object') {
          throw new TypeError('setup() should return object, not ' + (typeof model));
        }
        for (var key in model) {
          var desc = getOwnPropDesc(model, key);
          if (desc.get || desc.set) {
            defineProp(component, key, desc);
          } else {
            component[key] = desc.value;
          }
        }
      }

      // building
      var HTMXEngine = config.HTMXEngine;
      try {
        HTMXEngine.driveComponent(component, scopes, template, props, _template);
      } catch (e) {
        captureError(e, component, 'building');
      }

      // created
      try {
        component.emit('created');
      } catch (e) {
        captureError(e, component, 'created');
      }
    }

  },

  /**
   * Get property stored in _props or _props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);//this.__extag_descriptors__[key];
    if (!desc) {
      return this._props[key]
    }
    // if (desc.bindable) {
      // if (Dependency.binding()) {
        Dependency.add(this, key);
      // }
      return !desc.get ? 
              this._props[key] : 
                desc.get.call(this, this._props);
  },

  /**
   * Set property, including DOM properties and custom attributes.
   * @param {string} key
   * @param {*} val
   */
  set: function set(key, val) {
    var desc = Accessor.getAttrDesc(this, key);//this.__extag_descriptors__[key];
    // DOM property, stored in _props
    if (!desc) {
      return shellProto.set.call(this, key, val);
    }
    // validation in development 
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // // Unbindable custom prpoerty
    // if (!desc.bindable) {
    //   this[key] = val;
    //   return;
    // }
    // Custom attribute, stored in _props
    var props = this._props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.invalidate();
        this.emit('changed', key, val);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props);
      if (old !== val) {
        this.invalidate();
        this.emit('changed', key, val);
      }
    }

    // return this;
  },

  bind: function(target, property, collect, reflect) {
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

  // /**
  //  * attach a skin to this shell.
  //  * You should use this method for a root component in browser. 
  //  * For the child texts, elements and components, the viewEngine (ExtagSkin as default) help them attach the skins.
  //  * On the server-side, the shell do not need to attach some skin, since there is no skin on server-side actually.
  //  * @param {HTMLElement} $skin
  //  */
  // attach: function attach($skin) {
  //   if (shellProto.attach.call(this, $skin)) {
  //     try {
  //       this.emit('attached', $skin);
  //     } catch (e) {
  //       captureError(e, this, 'attached');
  //     }
  //     // if (this.onAttached) {
  //     //   this.onAttached($skin);
  //     // }
  //     return true;
  //   }
  //   return false;
  // },

  // /**
  //  * detach the skin from this shell, and destroy itself firstly.
  //  * You can config('prevent-detach', true) to prevent detaching and destroying.
  //  * @param {boolean} force - if not, detaching can be prevented, so this shell and the skin can be reused.
  //  */
  // detach: function detach(force) {
  //   if (Shell.prototype.detach.call(this, force)) {
  //     if (this.$skin) {
  //       try {
  //         this.emit('detached', this.$skin);
  //       } catch (e) {
  //         captureError(e, this, 'detached');
  //       }
  //     }
  //     try {
  //       this.emit('destroyed');
  //     } catch (e) {
  //       captureError(e, this, 'destroyed');
  //     }
  //     return true;
  //   }
  //   return false;
  // },

  /**
   * Update this shell and append it to the schedule for rendering.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
      return;
    }
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }
    try {
      this.emit('updating');
    } catch (e) {
      captureError(e, this, 'updating');
    }

    var type = this.$meta.type;
    if (type !== 0) {
      if ((this.$flag & FLAG_CHANGED_CACHE)) {
        config.HTMXEngine.transferProperties(this);
      }
    } else if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
      this._parent.invalidate(FLAG_CHANGED_CHILDREN);
    }

    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      // If this type is 0, we should ask its parent to render parent's children,
      // since its children are belong to its parent actually.
      if (type === 0 && this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        // this._parent.invalidate(2); 
        var parent = this.getParent(true);
        parent.$flag |= FLAG_CHANGED_CHILDREN;
        if ((parent.$flag & FLAG_WAITING_RENDERING) === 0) {
          parent.$flag |= FLAG_WAITING_RENDERING;
          Schedule.insertRenderQueue(parent);
        }
      }
      this.$flag |= FLAG_WAITING_RENDERING;
      Schedule.insertRenderQueue(this);
      // this.render();
    }

    // this.$flag ^= FLAG_WAITING_UPDATING;
    // this.render();
  },

  /**
   * Render the dirty parts of this shell to the attached skin 
   */
  render: function render() {
    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      return;
    }
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }
    // if (this.$meta.type !== 0) {
    //   elementPropto.render.call(this);
    // } else {
    //   fragmentProto.render.call(this);
    // }
    if (this.$skin && this.$meta.type !== 0 && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
      var viewEngine = Shell.getViewEngine(this);

      viewEngine.renderShell(this.$skin, this);
 
      DirtyMarker.clean(this);
  
      this._attrs && DirtyMarker.clean(this._attrs);
      this._style && DirtyMarker.clean(this._style);
      this._classes && DirtyMarker.clean(this._classes);

      this.__attrs && DirtyMarker.clean(this.__attrs);
      this.__style && DirtyMarker.clean(this.__style);
      this.__classes && DirtyMarker.clean(this.__classes);

      if (this._commands) {
        this._commands = null;
      }

      this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
    }

    var actions = this._actions;

    if (this.$flag & FLAG_MOUNTED === 0) {
      if (this.$meta.type === 0) {
        var parent = Parent.findParent(true);
        if (parent && parent.$skin) {
          this.$flag |= FLAG_MOUNTED;
        }
      } else if (this.$skin) {
        this.$flag |= FLAG_MOUNTED;
      }
      if (actions && actions.rendered && (this.$flag & FLAG_MOUNTED)) {
        Schedule.pushCallbackQueue((function() {
          try {
            this.emit('mounted');
          } catch (e) {
            captureError(e, this, 'mounted');
          }
        }).bind(this));
      }
    }
    
    if (actions && actions.updated) {
      Schedule.pushCallbackQueue((function() {
        try {
          this.emit('updated');
        } catch (e) {
          captureError(e, this, 'updated');
        }
      }).bind(this));
    }

    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_RENDERING);
  },

  getContents: function getContents() {
    return this._contents;
  },

  setContents: function setContents(value) {
    if (this._contents !== value) {
      this._contents = value;
      this.emit('changed', 'contents', value);
    }
  },

  /**
   * @param {string} name
   * @param {Shell} part
   */
  addNamedPart: function (name, part) {
    this[name] = part;
  }
});
  