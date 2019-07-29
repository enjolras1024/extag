// src/core/shells/Shell.js

// import Event from 'src/base/Event'
import Parent from 'src/base/Parent'
import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import DirtyMarker from 'src/base/DirtyMarker'
// import Utility from 'src/core/Utility'
import Schedule from 'src/core/Schedule'
// import Cache from 'src/core/models/Cache'

// import Collection from 'src/core/models/Collection'
import config from 'src/share/config'
import logger from 'src/share/logger'
import { VIEW_ENGINE } from 'src/share/constants'
import { slice, assign, defineProp, defineClass } from 'src/share/functions'
import {
  FLAG_NORMAL, 
  FLAG_CHANGED, 
  FLAG_CHANGED_CHILDREN,
  FLAG_CHANGED_COMMANDS
} from 'src/share/constants'

var guid = 0;//Number.MIN_VALUE;

var defaultViewEngine = null;

// var ids = [0], id0 = 0;
// function guid() {
//   if (id0 < 100) {
//     return id0++;
//   }
//   var n = ids.length;
//   var id = ids[n - 1];
//   if (id < 100) {
//     ids[n - 1] = id + 1;
//   } else {
//     ids.push(0);
//   }
//   var arr = [String(id0)], i;
//   for (i = 0, n = ids.length; i < n; ++i) {
//     arr.push(String(ids[i]));
//   }
//   return arr.join(',')
// }

// var TAG_NAME_REGEXP = /^[a-z](\-?[a-z0-9])*/i;

export default function Shell() {
  throw new Error('Shell is a base class and can not be instantiated');
}

defineClass({
  constructor: Shell,

  mixins: [Watcher.prototype, Accessor.prototype, DirtyMarker.prototype],

  // /**
  //  * 
  //  */
  // config: function config(name, value) {
  //   var arg = arguments[0];
  //   if (typeof arg === 'object') {
  //     if (!this._config) {
  //       defineProp(this, '_config', {value: {}});
  //     }
  //     assign(this._config, arg);
  //   } else if (arguments.length > 1) {
  //     if (!this._config) {
  //       defineProp(this, '_config', {value: {}});
  //     }
  //     this._config[name] = value;
  //   } else if (this._config) {
  //     return this._config[name];
  //   }
  // },

  /**
   * invalidate this shell and insert it to the schedule, so this shell can be updated and rendered in async mode.
   * @param {number} flag - 1: changed things, 2: changed children, 4: changed commands
   */
  invalidate: function invalidate(flag) {
    if (this.$flag === FLAG_NORMAL) {
      this.$flag = FLAG_CHANGED;
      Schedule.insertUpdateQueue(this);
    }
    // if (flag) {
      this.$flag |= flag;
    // }
    // return this;
  },

  update: function() {
    throw new Error('The method `update` must be implemented by sub-class');
  },

  render: function() {
    throw new Error('The method `render` must be implemented by sub-class');
  },

  /**
   * attach a skin to this shell.
   * You should use this method for a root component in browser. 
   * For the child texts, elements and components, the viewEngine (ExtagSkin as default) help them attach the skins.
   * On the server-side, the shell do not need to attach some skin, since there is no skin on server-side actually.
   * @param {HTMLElement} $skin
   */
  attach: function attach($skin) {
    var viewEngine = Shell.getViewEngine(this);
    if (__ENV__ === 'development') {
      if (!viewEngine) {
        logger.warn('There is no available viewEngine, so the error occurs below. Usually that is ExtagDom. You can use <script> to include extag-dom.js in broswer.');
      }
    }
    viewEngine.attachShell($skin, this);

    defineProp(this, '$skin', {
      value: $skin,
      writable: true,
      enumerable: false,
      configurable: true
    });

    if (this._actions) {
      var type, event, action, actions = this._actions;
      for (type in actions) {
        if (!actions.hasOwnProperty(type)) { continue; }
        action = actions[type];
        if (!action) { continue; }
        var handlers = action.handlers, handler;
        for (var i = 0, n = handlers.length; i < n; ++i) {
          handler = handlers[i]
          if (!handler) { continue; }
          Shell.addEventListener(this, action, handler);
        }
      }
    }

    this.invalidate(FLAG_CHANGED_CHILDREN);

    // this.send('attached');
    // if (this.onAttached) {
    //   this.onAttached($skin);
    // }

    // return this;
  },

  /**
   * detach the skin from this shell, and destroy itself firstly.
   * You can config('prevent-detach', true) to prevent detaching and destroying.
   * @param {boolean} force - if not, detaching can be prevented, so this shell and the skin can be reused.
   */
  detach: function detach(force) {
    if (!force && this._props && this._props.hasOwnProperty('preventDetach')) {
      return false;
    }

    var parent = this._parent;
    if (parent && !parent._parent/* && parent.$body === this*/) {
      this._parent = null;
      parent.detach(force);
      return;
    }

    this.constructor.destroy(this);

    return true;
  },

  getSkin: function getSkin() {
    return this.$skin;
  },

  getParent: function getParent(actual) {
    return actual ? Parent.findParent(this) : this._parent;
  },

  /**
   * return this shell's name, tag and guid.
   * @override
   */
  toString: function toString() {
    var constructor = this.constructor;
    return (constructor.fullName || constructor.name) + '<' + this.tag + '>(' + this.guid + ')';
  },

  /**
   * get property stored in this._props
   */
  get: function get(key) {
    return this._props[key];
  },
  
  /**
   * set property, check the changes and invalidate this shell
   * @param {string} key
   * @param {any} val
   */
  set: function set(key, val) {
    // if (arguments.length === 1) {
    //   var opts = key;
    //   for (key in opts) {
    //     this.set(key, opts[key]);
    //   }
    //   return this;
    // }
    var props = this._props;
  
    var old = props[key];
  
    if (old !== val) {
      props[key] = val;
      this.invalidate(FLAG_CHANGED);
      DirtyMarker.check(this, key, val, old);
    }

    // return this;
  },

  /**
   * order the skin to do something when rendering, so all commands are async in order.
   * @param {string} method - like 'focus', 'blur'... 
   */
  order: function order(method/*, ...rest*/) {
    if (!this._commands) {
      this._commands = [];
    }
    this._commands.push({
      name: method,
      args: slice(arguments, 1)
    });
    this.invalidate(FLAG_CHANGED_COMMANDS);
  },

  statics: {
    /**
     * initialize the shell, defining some important properties and members
     * @param {Shell} shell   - text, element, fragment or component
     * @param {number} type   - 3: Text, 1: Element, 0: Fragment
     * @param {string} tag    - tag name, like 'div', 'input'...,  and '' for text
     * @param {string} ns     - namespace, defalut '', can be 'svg', 'math'...
     */
    initialize: function initialize(shell, type, tag, ns) {
      defineProp(shell, '_props', {
        value: {}, writable: false, enumerable: false, configurable: false
      });

      defineProp(shell, '$flag', {
        value: 0, writable: true, enumerable: false, configurable: false
      });

      // defineProp(shell, '$symb', {
      //   value: '', writable: true, enumerable: false, configurable: false
      // });

      defineProp(shell, 'guid', {
        value: guid++, writable: false, enumerable: false, configurable: false
      }); // should be less than Number.MAX_SAFE_INTEGER

      defineProp(shell, 'type', {
        value: type, writable: false, enumerable: false, configurable: false
      });

      defineProp(shell, 'tag', {
        value: tag, writable: false, enumerable: false, configurable: false
      });

      defineProp(shell, 'ns', {
        value: ns, writable: true, enumerable: false, configurable: false
      });

      // defineMembersOf(shell);
    },

    /**
     * destroy the shell, including removing event linsteners and data bindings, and detaching skin
     * @param {Shell} shell
     */
    destroy: function(shell) {
      // destroying children
      var i, child, children = shell._children;
      if (children) {
        for (i = children.length - 1; i >= 0; --i) {
          child = children[i];
          child._parent = null;
          child.constructor.destroy(child);
        }
        shell._children.length = 0;
      }
      // destroying data bindings
      var binding, bindings = shell._bindings; //
      if (bindings) {
        for (i = bindings.length - 1; i >= 0; --i) {
          binding = bindings[i];
          binding.constructor.destroy(binding);
        }
        delete shell._bindings;
      }
      // removing event linsteners and handlers
      shell.off();
      // cleaning
      DirtyMarker.clean(shell);
      // detaching
      var $skin = shell.$skin;
      if ($skin) {
        var viewEngine = Shell.getViewEngine(shell);
        viewEngine.detachShell($skin, shell);
        shell.$skin = null;
        // if (shell.onDetached) {
        //   shell.onDetached($skin);
        // }
      }
      // destroyed
      // if (shell.onDestroyed) {
      //   shell.onDestroyed();
      // }
    },

    getViewEngine: function(shell) {
      if (defaultViewEngine == null) {
        defaultViewEngine = config.get(VIEW_ENGINE);
      }
      if (shell.ns && !defaultViewEngine.hasNameSpace(shell.ns)) {
        return config.get(shell.ns + ':' + VIEW_ENGINE);
      }
      return defaultViewEngine;
    },

    /**
     * ask viewEngine to add native event listeners
     * @param {Shell} shell - elemnet or component
     * @param {Object} action - event action without listener but handlers
     * @param {string} type   - event type 
     * @param {string} opts   - like {once: true, capture: true, passive: true}
     */
    addEventListener: function addEventListener(shell, action, handler) {
      var $skin = shell.getSkin();
      var viewEngine = Shell.getViewEngine(shell);

      if (!$skin || !viewEngine) { return; }

      var index = action.type.indexOf('.');
      var event = index < 0 ? action.type : action.type.slice(0, index);

      if (viewEngine.mayDispatchEvent($skin, event)) {
        action.listeners = action.listeners || [];
        var listener = action.listeners[handler.flag & 3];
        if (listener) { 
          listener.count++;
          return;
        }
        listener = Watcher.getListenerByFlag(handler.flag).bind(shell);
        viewEngine.addEventListener($skin, event, listener, Watcher.flag2opts(handler.flag & 3));
        action.listeners[handler.flag & 3] = listener;
        listener.count = 1;
        // console.log('addEventListener', action.type)
      } else {
        action.listeners = null;
      }
    },

    /**
     * ask viewEngine to remove native event listeners
     * @param {Shell} shell - elemnet or component
     * @param {Object} action - event action with listener
     * @param {string} type   - event type 
     * @param {string} opts   - like {capture: true}
     */
    removeEventListener: function removeEventListener(shell, action, handler) {
      var $skin = shell.getSkin();
      var viewEngine = Shell.getViewEngine(shell);
      if (!$skin || !viewEngine) { return; }
      var listener = action.listeners && action.listeners[handler.flag & 3];
      if (!listener) { return; }
      listener.count--;
      var index = action.type.indexOf('.');
      var event = index < 0 ? action.type : action.type.slice(0, index);
      if (listener.count < 1 && viewEngine.mayDispatchEvent($skin, event)) {
        viewEngine.removeEventListener($skin, event, listener, Watcher.flag2opts(handler.flag & 3));
        // console.log('removeEventListener', action.type)
      }
    }
  }
});