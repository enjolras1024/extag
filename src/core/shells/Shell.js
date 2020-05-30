// src/core/shells/Shell.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import DirtyMarker from 'src/base/DirtyMarker'
import Schedule from 'src/core/Schedule'
import config from 'src/share/config'
import logger from 'src/share/logger'
import { VIEW_ENGINE } from 'src/share/constants'
import { slice, hasOwnProp, defineClass } from 'src/share/functions'
import {
  FLAG_CAPTURE, 
  FLAG_PASSIVE,
  FLAG_NORMAL, 
  // FLAG_CHANGED, 
  FLAG_CHANGED_CACHE, 
  FLAG_CHANGED_COMMANDS,
  // FLAG_CHANGED_CHILDREN,
  FLAG_WAITING_TO_RENDER
} from 'src/share/constants'

var shellGuid = 0;//Number.MIN_VALUE;

var defaultViewEngine = null;

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
      Schedule.insertUpdateQueue(this);
    }
    if ((this.$flag & flag) === 0) {
      this.$flag |= flag;
    }
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
    if (this.$meta.type === 0) {
      return false;
    }
    
    var viewEngine = Shell.getViewEngine(this);
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      if (!viewEngine) {
        logger.warn('There is no available viewEngine, so the error occurs below. Usually that is ExtagDom. You can use <script> to include extag-dom.js in broswer.');
      }
    }
    viewEngine.attachShell($skin, this);

    // defineProp(this, '$skin', {
    //   value: $skin,
    //   writable: true,
    //   enumerable: false,
    //   configurable: true
    // });
    this.$skin = $skin;

    if (this._actions) {
      var type, action, actions = this._actions;
      for (type in actions) {
        if (!hasOwnProp.call(actions, type) || 
            !viewEngine.mayDispatchEvent($skin, type)) { 
            continue; 
        }
        action = actions[type];
        if (!action) { continue; }
        var handler = action.head;
        while(handler) {
          Shell.addEventListener(this, action, handler);
          handler = handler.next;
        }
      }
    }

    // this.invalidate(FLAG_CHANGED_CHILDREN);
    if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      this.$flag |= FLAG_WAITING_TO_RENDER;
      Schedule.insertRenderQueue(this);
    }

    return true;
  },

  /**
   * detach the skin from this shell, and destroy itself firstly.
   * You can config('prevent-detach', true) to prevent detaching and destroying.
   * @param {boolean} force - if not, detaching can be prevented, so this shell and the skin can be reused.
   */
  detach: function detach(force) {
    // if (!force && this._props && hasOwnProp.call(this._props, 'preventDetach')) {
    //   return false;
    // }

    var parent = this._parent;
    if (parent && !parent._parent/* && parent.$body === this*/) {
      this._parent = null;
      parent.detach(force);
      return;
    }

    if (this.$owner) {
      this.$owner = null;
    }

    this.constructor.destroy(this);

    return true;
  },

  getSkin: function getSkin() {
    return this.$skin;
  },

  // getParent: function getParent(actual) {
  //   return actual ? Parent.findParent(this) : this._parent;
  // },

  /**
   * return this shell's name, tag and guid.
   * @override
   */
  toString: function toString() {
    var meta = this.$meta;
    var ctor = this.constructor;
    return (ctor.fullName || ctor.name) + '<' + meta.tag + '>(' + meta.guid + ')';
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
    var props = this._props;
  
    var old = props[key];
  
    if (old !== val) {
      props[key] = val;
      this.invalidate(FLAG_CHANGED_CACHE);
      DirtyMarker.check(this, key, val, old);
    }

    // return this;
  },

  /**
   * order the skin to do something when rendering, so all commands are async in order.
   * @param {string} method - like 'focus', 'blur'... 
   */
  cmd: function cmd(method/*, ...rest*/) {
    if (!this._commands) {
      this._commands = [];
    }
    this._commands.push({
      name: method,
      args: slice.call(arguments, 1)
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
      if (!hasOwnProp.call(shell, '_props')) {
        // defineProp(shell, '_props', {
        //   value: {}, writable: false, enumerable: false, configurable: true
        // });
        shell._props = {};
      }

      // defineProp(shell, '$flag', {
      //   value: FLAG_NORMAL, writable: true, enumerable: false, configurable: true
      // });
      shell.$flag = FLAG_NORMAL;
      
      shell.$meta = {
        guid: shellGuid++,
        type: type,
        tag: tag,
        ns: ns
      }
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (Object.freeze) {
          shell.$meta = Object.freeze(shell.$meta);
        }
      }

      // defineProp(shell, '$guid', {
      //   value: shellGuid++, writable: false, enumerable: false, configurable: true
      // }); // should be less than Number.MAX_SAFE_INTEGER

      // defineProp(shell, '$type', {
      //   value: type, writable: false, enumerable: false, configurable: true
      // });

      // defineProp(shell, 'tag', {
      //   value: tag, writable: false, enumerable: false, configurable: true
      // });

      // defineProp(shell, 'ns', {
      //   value: ns, writable: true, enumerable: false, configurable: true
      // });

      // defineMembersOf(shell);
    },

    /**
     * destroy the shell, including removing event linsteners and data bindings, and detaching skin
     * @param {Shell} shell
     */
    destroy: function(shell) {
      var i;
      // removing event linsteners and handlers
      shell.off();
      // cleaning
      DirtyMarker.clean(shell);
      // destroying data bindings
      var binding, bindings = shell._bindings; //
      if (bindings) {
        for (i = bindings.length - 1; i >= 0; --i) {
          binding = bindings[i];
          binding.destroy();
        }
        bindings.length = 0;
      }
      // destroying children
      var child, children = shell._children;
      if (children) {
        for (i = children.length - 1; i >= 0; --i) {
          child = children[i];
          child._parent = null;
          child.detach();
          // child.constructor.destroy(child);
        }
        shell._children.length = 0;
      }
      
      
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
      var ns = shell.$meta.ns;
      if (defaultViewEngine == null) {
        defaultViewEngine = config.get(VIEW_ENGINE);
      }
      if (ns && !defaultViewEngine.hasNameSpace(ns)) {
        return config.get(ns + ':' + VIEW_ENGINE);
      }
      return defaultViewEngine;
    },

    /**
     * ask viewEngine to add native event listeners
     * @param {Shell} shell     - elemnet or component
     * @param {Object} action   - event action
     * @param {string} handler  - event handler
     */
    addEventListener: function addEventListener(shell, action, handler) {
      var $skin = shell.getSkin();
      var viewEngine = Shell.getViewEngine(shell);
      if (!$skin || !viewEngine) { return; }
      if (viewEngine.mayDispatchEvent($skin, action.type)) {
        var flag = handler.flag & (FLAG_CAPTURE | FLAG_PASSIVE);
        action.listeners = action.listeners || [];
        var listener = action.listeners[flag];
        if (listener) { 
          listener.count++;
          return;
        }
        listener = Watcher.getEventListener(shell, handler.flag);
        viewEngine.addEventListener($skin, action.type, listener, flag && Watcher.flag2opts(flag));
        action.listeners[flag] = listener;
        listener.count = 1;
      } else {
        action.listeners = null;
      }
    },

    /**
     * ask viewEngine to remove native event listeners
     * @param {Shell} shell     - elemnet or component
     * @param {Object} action   - event action
     * @param {string} handler  - event handler
     */
    removeEventListener: function removeEventListener(shell, action, handler) {
      var i, flag, listener;
      var $skin = shell.getSkin();
      var listeners = action.listeners;
      var viewEngine = Shell.getViewEngine(shell);
      if (!$skin || !listeners || !viewEngine) { return; }
      if (!viewEngine.mayDispatchEvent($skin, action.type)) { return; }
      if (arguments.length === 2) {
        for (i = 0; i < listeners.length; ++i) {
          listener = listeners[i];
          if (!listener) { continue; }
          listener.count = 0;
          listeners[i] = null;
          viewEngine.removeEventListener($skin, action.type, listener, Watcher.flag2opts(i));
        }
      } else {
        flag = handler.flag & (FLAG_CAPTURE | FLAG_PASSIVE)
        listener = listeners[flag];
        if (!listener) { return; }
        listener.count--;
        if (listener.count < 1) {
          viewEngine.removeEventListener($skin, action.type, listener, Watcher.flag2opts(flag));
          listeners[flag] = null;
        }
      }
      
    }
  }
});