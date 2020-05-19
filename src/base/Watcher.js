// src/base/Watcher.js

// import Event from 'src/base/Event'
import { FLAG_NONE, FLAG_ONCE, FLAG_CAPTURE, FLAG_PASSIVE } from 'src/share/constants'
import { slice, hasOwnProp, defineProp, defineClass } from 'src/share/functions'

export default function Watcher() {
  // this._actions = null;
}

function getEventTail(event) {
  var tail = '';

  if (event.key) {
    tail += '.' + event.key[0].toLowerCase() + event.key.slice(1);
  } else if (event.button) {
    tail += ['.left', '.middle', '.right'][event.button]
  }

  if (event.altKey) {
    tail += '.alt';
  }
  if (event.ctrlKey) {
    tail += '.ctrl';
  }
  if (event.metaKey) {
    tail += '.meta';
  }
  if (event.shiftKey) {
    tail += '.shift';
  }
  
  return tail;
}

var listeners = [
  function(event) {
    this.emit(event.type + getEventTail(event), event, FLAG_NONE);
  },
  function(event) {
    this.emit(event.type + getEventTail(event), event, FLAG_CAPTURE);
  },
  function(event) {
    this.emit(event.type + getEventTail(event), event, FLAG_PASSIVE);
  },
  function(event) {
    this.emit(event.type + getEventTail(event), event, (FLAG_CAPTURE | FLAG_PASSIVE));
  }
];

function addEventListener(watcher, action, handler) {
  var constructor = watcher.constructor;
  if (typeof constructor.addEventListener === 'function') {
    constructor.addEventListener(watcher, action, handler);
  } else {
    action.listeners = null;
  }
}
function removeEventListener(watcher, action, handler) {
  var constructor = watcher.constructor;
  if (typeof constructor.removeEventListener === 'function') {
    constructor.removeEventListener(watcher, action, handler);
  }
}

function opts2flag(opts) {
  var flag = FLAG_NONE;
  if (opts) {
    if (opts.capture) {
      flag |= FLAG_CAPTURE;
    }
    if (opts.passive) {
      flag |= FLAG_PASSIVE;
    }
    if (opts.once) {
      flag |= FLAG_ONCE;
    }
  }
  return flag;
}

function flag2opts(flag) {
  var opts = {};
  if (flag & FLAG_CAPTURE) {
    opts.capture = true;
  }
  if (flag & FLAG_PASSIVE) {
    opts.passive = true;
  }
  if (flag & FLAG_ONCE) {
    opts.once = true;
  }
  return opts;
}

function equalCapture(flag0, flag1) {
  return (flag0 & FLAG_CAPTURE) === (flag1 & FLAG_CAPTURE);
}

function addEventHandler(watcher, type, func, opts) {
  var actions = watcher._actions;
  
  if (typeof func !== 'function') { return; }

  if (!actions) {
    actions = {};
    defineProp(watcher, '_actions', {
      value: actions, writable: false, enumerable: false, configurable: true
    });
  }

  var keys = type.split('.');
  if (keys.length > 2) {
    type = keys[0] + '.' + keys.slice(1).sort().join('.');
  }

  var action = actions[type];

  //  Create action
  if (!action) {
    action = actions[type] = { 
      type: type, 
      handlers: []/*, listening: null*/ 
    };
  }

  var flag = opts2flag(opts);

  var handlers = action.handlers;

  var handler, i, n = handlers.length;
  // Check if func exists in handlers.
  for (i = 0; i < n; ++i) {
    handler = handlers[i];
    if (handler && func === handler.func 
        && equalCapture(flag, handler.flag)) {
      return;
    }
  }
  
  handler = {
    func: func,
    flag: flag
  };

  handlers.push(handler);

  if (!('listeners' in action) || action.listeners) {
    addEventListener(watcher, action, handler);
  }
}

function removeEventHandler(watcher, type, func, opts) {
  var actions = watcher._actions;
  
  if (!actions) { return; }

  var keys = type.split('.');
  if (keys.length > 2) {
    type = keys[0] + '.' + keys.slice(1).sort().join('.');
  }

  var action = actions[type];

  if (!action) { return; }

  var handlers = action.handlers;
  var handler, matched, listener;
  var i, n = handlers.length;

  if (arguments.length === 2) {
    if (action.listeners) {
      for (i = n - 1; i >= 0; --i) {
        handler = handlers[i];
        if (handler) { 
          listener = action.listeners[handler.flag & (FLAG_CAPTURE | FLAG_PASSIVE)];
          if (listener) {
            removeEventListener(watcher, action, handler);
          }
         }
      }
    }
    handlers.length = 0;
    delete actions[type];
    // for (i = 0; i < n; ++i) {
    //   handler = handlers[i];
    //   if (handler && handler.func) {
    //     removeEventHandler(watcher, type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
    //   }
    // }
    return;
  }
  
  var flag = opts2flag(opts);
  for (i = 0; i < n; ++i) {
    handler = handlers[i];
    if (handler && func === handler.func 
        // && (!tail || tail === handler.tail) 
          && equalCapture(flag, handler.flag)) {
      handlers[i] = null;
      matched = handler;
      break;
    }
  }

  for (i = n - 1; i >= 0; --i) {
    if (!handlers[i]) {
      handlers.splice(i, 1);
    }
  }

  if (action.listeners && matched) {
    listener = action.listeners[matched.flag & (FLAG_CAPTURE | FLAG_PASSIVE)];
    if (listener) {
      removeEventListener(watcher, action, matched);
    }
  }
}

defineClass({
  /**
   * A watcher can add and remove event handlers, emit or send event with or without extra parameters.
   * @constructor
   */
  constructor: Watcher,

  statics: {
    opts2flag: opts2flag,
    flag2opts: flag2opts,
    getListenerByFlag: function(flag) {
      return listeners[flag & (FLAG_CAPTURE | FLAG_PASSIVE)];
    }
  },

  /**
   * Add DOM event or custom event handler.
   * @param {string|Object} type
   * @param {Function} func
   * @param {Object} opts - like {once: true, capture: true, passive: true}
   * @returns {this}
   */
  on: function on(type, func, opts) {
    if (typeof type === 'object') {
      var config = type;
      for (type in config) {
        if (hasOwnProp.call(config, type)) {
          var conf = config[type];
          if (!Array.isArray(conf)) {
            addEventHandler(this, type, conf);
          } else {
            addEventHandler(this, type, conf[0], conf[1]);
          }
        }
      }
      return this;
    } 

    addEventHandler(this, type, func, opts);

    return this;
  },


  /**
   * Use Watcher to remove DOM event or custom event handler.
   *
   * @param {string} type
   * @param {Function} func
   * @param {Object} opts - like {capture: true}
   * @returns {this}
   */
  off: function off(type, func, opts) {
    var actions = this._actions;
    
    if (!actions) { return this; }

    var n = arguments.length, t = typeof type;

    if (n === 0) {      // e.g. off()
      for (type in actions) {
        removeEventHandler(this, type);
      }
    } else if (t === 'string') {
      if (n === 1) {    // e.g. off('click');
        removeEventHandler(this, type);
      } else {          // e.g. off('click', onClick);
        removeEventHandler(this, type, func, opts);
      }
    } else if (t === 'object') { // e.g. off({click: onClick})
      var config = type;
      for (type in config) {
        if (hasOwnProp.call(config, type)) { 
          var conf = config[type];
          if (!Array.isArray(conf)) {
            if (conf == null) {
              removeEventHandler(this, type);
            } else {
              removeEventHandler(this, type, conf);
            }
          } else {
            removeEventHandler(this, type, conf[0], conf[1]);
          }
        }
      }
    }

    return this;
  },

  /**
   * Dispatch custom event, handlers accept rest arguments.
   *
   * @example #emit('ok', a, b) may trigger function(a, b) {}
   * @param {Event|Object|string} type
   * @returns {self}
   */
  emit: function emit(type/*, ...rest*/) {
    var actions = this._actions;
    
    if (!actions) { return this; }

    var keys = type.split('.');

    if (keys.length > 2) {
      type = keys[0] + '.' + keys.slice(1).sort().join('.');
    }

    var action = actions[type];

    if (action) {
      var flag = action.listeners ? arguments[2] : 0;
      var handler, handlers = action.handlers;
      for (var i = 0, n = handlers.length; i < n; ++i) {
        handler = handlers[i];
        if (handler
              && equalCapture(flag, handler.flag)) {
          if (handler.flag & 4) { // once: 0b1xx
            this.off(type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
          }
          try {
            handler.func.apply(null, slice(arguments, 1));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    if (keys.length > 1 && actions[keys[0]]) {
      var args = slice(arguments, 1);
      args.unshift(keys[0]);
      this.emit.apply(this, args);
    }
    
    return this;
  }
});