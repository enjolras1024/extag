// src/base/Watcher.js

// import Event from 'src/base/Event'
import { FLAG_NONE, FLAG_ONCE, FLAG_CAPTURE, FLAG_PASSIVE } from 'src/share/constants'
import { slice, hasOwnProp, defineProp, defineClass } from 'src/share/functions'

export default function Watcher() {
  // this._actions = null;
}

var EVENT_LISTENERS = [
  function(event) {
    this.emit(event.type, event, FLAG_NONE);
  },
  function(event) {
    this.emit(event.type, event, FLAG_CAPTURE);
  },
  function(event) {
    this.emit(event.type, event, FLAG_PASSIVE);
  },
  function(event) {
    this.emit(event.type, event, (FLAG_CAPTURE | FLAG_PASSIVE));
  }
];

function getEventListener(watcher, flag) {
  return EVENT_LISTENERS[flag].bind(watcher);
}

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
    if (arguments.length === 2) {
      constructor.removeEventListener(watcher, action);
    } else {
      constructor.removeEventListener(watcher, action, handler);
    }
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
    // watcher._actions = actions;
    defineProp(watcher, '_actions', {
      value: actions, writable: false, enumerable: false, configurable: true
    });
  }

  var action = actions[type];

  if (!action) {
    action = actions[type] = { 
      type: type, 
      head: null,
      tail: null
      /*, listeners: null*/ 
    };
  }

  var flag = opts2flag(opts);

  if (func.__extag_handler__) {
    var curr = action.head;
    while(curr) {
      if (curr.func === func 
          && equalCapture(flag, curr.flag)) {
        return;
      }
      curr = curr.next;
    }
  }

  var handler = {
    func: func,
    flag: flag
  };

  func.__extag_handler__ = true;

  if (action.head) {
    action.tail.next = handler;
    action.tail = handler;
  } else {
    action.head = handler;
    action.tail = handler;
  }

  if (!('listeners' in action) || action.listeners) {
    addEventListener(watcher, action, handler);
  }
}

function removeEventHandler(watcher, type, func, opts) {
  var actions = watcher._actions;
  if (!actions) { return; }
  var action = actions[type];
  if (!action) { return; }

  if (arguments.length === 2) {
    if (action.listeners) {
      removeEventListener(watcher, action);
    }
    actions[type] = null;
    return;
  }
  
  var flag = opts2flag(opts);
  var curr = action.head;
  var prev = null;
  while(curr) {
    if (func === curr.func && equalCapture(flag, curr.flag)) {
      if (action.listeners) {
        var listener = action.listeners[curr.flag & (FLAG_CAPTURE | FLAG_PASSIVE)];
        if (listener) {
          removeEventListener(watcher, action, curr);
        }
      }
      if (!curr.next) {
        action.tail = prev;
      }
      if (prev) {
        prev.next = curr.next;
      } else {
        action.head = curr.next;
      }
      break;
    }
    prev = curr;
    curr = curr.next;
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
    getEventListener: getEventListener
  },

  /**
   * Add DOM event or custom event handler.
   * @param {string|Object} type
   * @param {Function} func
   * @param {Object} opts - like {once: true, capture: true, passive: true}
   */
  on: function on(type, func, opts) {
    if (typeof type === 'object') {
      opts = type;
      for (type in opts) {
        if (hasOwnProp.call(opts, type)) {
          var value = opts[type];
          if (!Array.isArray(value)) {
            addEventHandler(this, type, value);
          } else {
            addEventHandler(this, type, value[0], value[1]);
          }
        }
      }
    } else {
      addEventHandler(this, type, func, opts);
    }
  },


  /**
   * Use Watcher to remove DOM event or custom event handler.
   *
   * @param {string} type
   * @param {Function} func
   * @param {Object} opts - like {capture: true}
   */
  off: function off(type, func, opts) {
    var actions = this._actions;
    if (!actions) { return; }
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
      opts = type;
      for (type in opts) {
        if (hasOwnProp.call(opts, type)) { 
          var value = opts[type];
          if (!Array.isArray(value)) {
            if (value == null) {
              removeEventHandler(this, type);
            } else {
              removeEventHandler(this, type, value);
            }
          } else {
            removeEventHandler(this, type, value[0], value[1]);
          }
        }
      }
    }
  },

  /**
   * Dispatch custom event, handlers accept rest arguments.
   *
   * @example #emit('ok', a, b) may trigger function(a, b) {}
   * @param {string} type
   */
  emit: function emit(type/*, ...rest*/) {
    var actions = this._actions;
    if (!actions) { return; }
    var action = actions[type];
    if (action) {
      var flag = action.listeners ? arguments[2] : 0;
      var handler, handlers;
      handler = action.head;
      while (handler) {
        if (equalCapture(flag, handler.flag)) {
          handler.func.apply(null, slice.call(arguments, 1));
          if (handler.flag & FLAG_ONCE) {
            handlers = handlers || [];
            handlers.push(handler);
          }
        }
        handler = handler.next;
      }
      if (handlers) {
        for (var i = 0; i < handlers.length; ++i) {
          handler = handlers[i];
          this.off(type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
        }
      }
    }
  }
});