/**
 * extag.js v0.1.0
 * (c) enjolras.chen
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Extag = factory());
}(this, function () { 'use strict';

  // src/base/Path.js

  // var PATH_DELIMITER = /\[|\]?\./;
  var PATH_DELIMITER_1 = /\./;
  var PATH_DELIMITER_2 = /(\]\.)|\.|\[|\]/g;
  var PATH_REGEXP_1 = /^[\$_A-Z][\$_A-Z0-9]*(\.[\$_A-Z0-9]+)*$/i;
  var PATH_REGEXP_2 = /^[\$_A-Z][\$_A-Z0-9]*((\[\d+\])|(\.[\$_A-Z0-9]+))*$/i;

  /**
   * Find the resource in the scope
   *
   * @param {Array} path
   * @param {Object} scope
   * @returns {*}
   */
  function find(path, scope) {
    var i = -1, n = path.length, value = scope;

    while (++i < n) {
      value = value[path[i]];
      if (value == null) {
        return value;
      }
    }

    return value;
  }

  var Path = {
    /**
     * Parse property path from a string.
     * @param {string} text - like 'a.b.c' or 'a[0].c'...
     */
    parse: function parse(text) {
      var path = null;
      if (PATH_REGEXP_1.test(text)) {
        path = text.split(PATH_DELIMITER_1);
        // path.text = text;
      } else if (PATH_REGEXP_2.test(text)) {
        path = text.replace(PATH_DELIMITER_2, ' ').trim().split(' ');
        // path.text = text;
      }
      return path;
    },

    /**
     * Find the resource in local, then in RES if necessary.
     *
     * @param {Array|string} path
     * @param {Object} local
     * @param {boolean} stop
     * @returns {*}
     */
    search: function(path, local, stop) {
      var res;

      if (typeof path === 'string') {
        path = this.parse(path);
      }

      if (!path) {
        return;
      }

      if (local) {
        res = find(path, local);
      }

      if (res == null && !stop) {
        if (typeof window !== 'undefined') {
          res = find(path, window);
        } else if (typeof global !== 'undefined') {
          res = find(path, global);
        }
      }

      return res;
    },
  };

  // src/share/config.js 

  var _custom = {};

  var config = {
    JS_ENV: '',
    JSXEngine: null,
    HTMEngine: null,
    HTMXParser: null,
    // EVENT_SYMBOL: 'event',
    // CAPTURE_SYMBOL: '!',
    // CONTEXT_SYMBOL: 'this',
    // ONE_WAY_BINDING_BRACKETS: '{}',
    // TWO_WAY_BINDING_BRACKETS: '[]',
    // BINDING_OPERATORS: {
    //   DATA: '@', TEXT: '#', EVENT: '+', CONVERTER: '::', SCOPE_EVENT: '@', TWO_WAY: '@',  ANY_WAY: '^', ONE_TIME: '?', ASSIGN: '!'
    // },
    get: function get(name) {
      return _custom[name];
    },
    set: function set(name, value) {
      _custom[name] = value;
    }
  };

  // src/share/functions.js 

  var Array$slice = Array.prototype.slice;
  function slice(array, start, stop) {
    return Array$slice.call(array, start, stop);
  }

  function copy(source) {
    if (Array.isArray(source)) {
      var copy = source.__extag_copy__;
      if (copy == null) {
        copy = source.slice(0);
        copy.__extag_copy__ = source;
        source.__extag_copy__ = copy;
      } else {
        var i;
        var m = copy.length;
        var n = source.length;
        if (m <= n) {
          for (i  = 0; i < m; ++i) {
            copy[i] = source[i];
          } 
          for (; i < n; ++i) {
            copy.push(source[i]);
          }
        } else {
          for (i = m  - 1; i >= n; --i) {
            copy.pop();
          }
          for (;i >= 0; --i) {
            copy[i] = source[i];
          }
        }
      }
      return copy;
    } else if (typeof source === 'object' && source) {
      return assign({}, source);
    }
  }

  var assign = Object.assign || function assign(target/*,..sources*/) {
    if (target == null) {
      throw  new TypeError('Cannot convert undefined or null to object');
    }

    //if (!(target instanceof Object)) {
    //  var type = typeof target;
    //
    //  if (type === 'number') {
    //    target = new Number(target);
    //  } else if (type === 'string') {
    //    target = new String(target);
    //  } else if (type === 'boolean') {
    //    target = new Boolean(target);
    //  }
    //}

    var source, key, i, n = arguments.length;

    for (i = 1; i < n; ++i) {
      source = arguments[i];

      if (!(source instanceof Object)) {
        continue;
      }

      for (key in source) {
        if (source.hasOwnProperty(key)) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
      }
    }

    return target;
  };

  function isNativeFunc(func) {
    return typeof func === 'function' && /native code/.test(func.toString())
  }

  var setImmediate = (function(Promise, setImmediate, MutationObserver, requestAnimationFrame) {
    // setTimeout(function(){console.log('4')})
    // requestAnimationFrame(function() {console.log('3')})
    // thenFunc(function(){console.log('2')})
    // var p = Promise.resolve();
    // p.then(function() {console.log('1')});
    

    if (Promise) {
      var p = Promise.resolve();
      return function(callback) {
        if (typeof callback === 'function') {
          p.then(callback);
        }
      }
    }

    if (MutationObserver) {
      var cbs = [];
      var flag = 0;
      var text = document.createTextNode('');
      var observer = new MutationObserver(function() {
        var callback;

        while (callback = cbs.pop()) {
          callback();
        }

        flag = flag ? 0 : 1;
      });

      observer.observe(text, {
        characterData: true
      });

      return function(callback) {
        if (typeof callback === 'function') {
          cbs.unshift(callback);
          text.data = flag;
        }
      }
    }

    if (requestAnimationFrame) {
      return function(callback) {
        if (typeof callback === 'function') {
          var fired = false;
          var cb = function() {
            if (fired) return;
            fired = true;
            callback();
          };
          requestAnimationFrame(cb);
          // `requestAnimationFrame` does not run when the tab is in the background.
          // We use `setTimeout` as a fallback.
          setTimeout(cb);
        }
      }
    }

    return setImmediate ? setImmediate : setTimeout;
  })(
    typeof Promise !== 'undefined' && isNativeFunc(Promise) ? Promise : null,
    typeof setImmediate !== 'undefined' && isNativeFunc(setImmediate) ? setImmediate : null,
    typeof MutationObserver !== 'undefined' && isNativeFunc(MutationObserver) ? MutationObserver : null,
    typeof requestAnimationFrame !== 'undefined' && isNativeFunc(requestAnimationFrame) ? requestAnimationFrame : null
  );

  var defineProp;
  // check if Object.defineProperty is supported
  try {
    config['JS_ENV'] = '>=ES5'; // not use ">=ES5"
    defineProp = Object.defineProperty;
    defineProp({}, 'x', {get: function() {}});
  } catch (e) {
    config['JS_ENV'] = '<ES5'; // not use ">=ES5"
    defineProp = function defineProp(target, property, descriptor) {
      target[property] = descriptor.value;
    };
  }

  function defineProps(target, sources) {
    var i, n, source;
    for (i = 0, n = sources.length; i < n; ++i) {
      source = sources[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          defineProp(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
      }
    }
  }

  /**
   * Define a new class, supporting extends and mixins.
   * @param {Object} proto
   */
  function defineClass(proto) {
    var subClass, superClass, mixins, statics, sources;

    // superClass
    if (proto.hasOwnProperty('extends')) {
      superClass = proto.extends;

      if (typeof superClass !== 'function') {
        throw new TypeError('superClass must be a function');
      }
    } else {
      superClass = Object;
    }

    // subClass
    if (proto.hasOwnProperty('constructor')) {
      subClass = proto.constructor;
      //delete proto.constructor;
      if (typeof subClass !== 'function') {
        throw new TypeError('subClass must be a function');
      }
    } else {
      subClass = function() {
        superClass.apply(this, arguments);
      };
    }

    // proto
    subClass.prototype = Object.create(superClass.prototype);

    sources = [subClass.prototype];

    mixins = proto.mixins;
    if (Array.isArray(mixins)) {
      //delete proto.mixins;
      sources.push.apply(sources, mixins);
    }

    sources.push(proto);

    defineProps(subClass.prototype, sources);

    defineProp(subClass.prototype, 'constructor', {
      value: subClass, enumerable: false, writable: true, configurable: true
    });

    // static
    sources = [subClass, superClass];

    statics = proto.statics;

    if (statics) {
      mixins = statics.mixins;
      if (Array.isArray(mixins)) {
        //delete statics.mixins;
        sources.push.apply(sources, mixins);
      }

      sources.push(statics);
    }

    defineProps(subClass, sources);

    delete subClass.prototype.statics;
    delete subClass.prototype.entend;
    delete subClass.prototype.mixins;
    delete subClass.mixins;

    return subClass;
  }

  // /**
  //  * Get the descriptor of the attribute.
  //  * @param {Object} object 
  //  * @param {string} attrName 
  //  */
  // function getAttrDesc(object, attrName) {
  //   return object.__extag_descriptors__ ? object.__extag_descriptors__[attrName] : null;
  // }

  var HTML_CHAR_ENTITY_REGEXP = /\&[\w\#]{2,6};/;
  var encodeHTML, decodeHTML;

  try {
    var div = document.createElement('div');
    encodeHTML = function(text) {
      // div.innerText = text;
      div.textContent = text;
      return div.innerHTML;
    };
    decodeHTML = function(html) {
      if (!HTML_CHAR_ENTITY_REGEXP.test(html)) {
        return html;
      }
      div.innerHTML = html;
      return div.textContent;// || div.innerText || '';
    };
  } catch(e) {
    encodeHTML = function(text) {
      // var entities = config.get('html_char_entities');
      // if (entities) {
      //   for (var i = 0; i < entities.length; ++i) {
      //     var entity = entities[i];
      //     text = text.replace(new RegExp('\\' + entity.char, 'g'), entity.code);
      //   }
      // }
      if (!/[<>&"\u00a0]/.test(text)) {
        return text;
      }
      return  text.replace(/\&/g, '&amp;')
                  .replace(/\</g, '&lt;')
                  .replace(/\>/g, '&gt;')
                  .replace(/\"/g, '&quot;')
                  .replace(/\u00a0/g, '&nbsp;');
    };
    decodeHTML = function(html) {
      if (!HTML_CHAR_ENTITY_REGEXP.test(html)) {
        return html;
      }
    
      // var entities = config.get('html_char_entities');
      // if (entities) {
      //   for (var i = 0; i < entities.length; ++i) {
      //     var entity = entities[i];
      //     html = html.replace(new RegExp('\\' + entity.code, 'g'), entity.char);
      //   }
      // }
    
      return  html.replace(/\&nbsp;/g, String.fromCharCode(160))
                  .replace(/\&quot;/g, '"')
                  .replace(/\&lt;/g, '<')
                  .replace(/\&gt;/g, '>')
                  .replace(/\&amp;/g, '&');
    };
  }

  var WHITE_SPACES_REGEXG = /\s+/;
  /**
   * Convert the class list to a class map.
   * @param {Array|string} classList 
   */
  function toClasses(classList) {
    if (typeof classList === 'string') {
      classList = classList.trim().split(WHITE_SPACES_REGEXG);
    }
    if (Array.isArray(classList)) {
      var i, classes = {};
      for (i = 0; i < classList.length; ++i) {
        if (classList[i]) {
          classes[classList[i]] = true;
        }
      }
      return classes;
    }
  }

  // src/share/constants.js 

  // flags
  var FLAG_NORMAL = 0;
  var FLAG_CHANGED = 1;
  var FLAG_CHANGED_CHILDREN = 2;
  var FLAG_CHANGED_COMMANDS = 4;
  var FLAG_WAITING_TO_RENDER = 8;

  var VIEW_ENGINE = 'view-engine';
  var EMPTY_OBJECT = {};
  var EMPTY_ARRAY = [];
  // var CAPTURE_SYMBOL = '!',
  var CONTEXT_SYMBOL = 'this';
  var ONE_WAY_BINDING_BRACKETS = '{}';
  var BINDING_OPERATORS = {
    DATA: '@', 
    TEXT: '#', 
    EVENT: '+', 
    MODIFIER: '::',
    CONVERTER: '|=', 
    SCOPE_EVENT: '@', 
    ASSIGN: '!',
    TWO_WAY: '@',  
    ANY_WAY: '^', 
    ONE_TIME: '?'
  };

  // src/share/logger.js 

  function log(fn, args, prefix) {
    args = slice(args, 0);
    args.unshift(prefix);
    fn.apply(console, args);
  }

  var logger = {
    info: function info() {
      log(console.log, arguments, '[EXTAG INFO]');
    },
    warn: function warn() {
      log(console.warn, arguments, '[EXTAG WARN]');
    },
    error: function error() {
      log(console.error, arguments, '[EXTAG ERROR]');
    },
    debug: function debug() {
      log(console.log, arguments, '[EXTAG DEBUG]');
    }
  };

  // src/base/Parent.js

  /**
   * Construct a parent like array.
   * @class
   * @constructor
   */
  function Parent() {
    throw new Error('Parent is a base class and can not be instantiated');
  }

  function findParent(shell) {
    var temp = shell._parent;
    while (temp && temp.type === 0) {
      temp = temp._parent;
    }
    return temp;
  }

  function flattenChildren(shell, array) {
    var children = shell._children;
    var i, n = children.length, child;
    array = array || [];
    for (i = 0; i < n; ++i) {
      child = children[i];
      if (child.type === 0) {
        flattenChildren(child, array);
      } else {
        array.push(child);
      }
    }
    return array;
  }

  defineClass({
    constructor: Parent, // mixins: [Watcher.prototype],

    statics: {
      /**
       * Clean the parent.
       * @param {Parent} parent
       */
      clean: function(parent) {
        if (parent._children) {
          parent._children.isInvalidated = false;
        }
      },

      invalidate: function invalidate(parent) {
        if (parent._children) {
          parent._children.isInvalidated = true;
          parent.invalidate(FLAG_CHANGED_CHILDREN);
        }
      },

      findParent: findParent,
      flattenChildren: flattenChildren
    },

    // getParent: function getParent(actual) {
    //   return actual ? findParent(this) : this._parent;
    // },

    getChildren: function getChildren(actual) {
      if (actual) {
        return flattenChildren(this);
      }
      return this._children ? this._children.slice(0) : [];
    },

    /**
     * Reset this parent. Clear old items, push new items.
     * @param {Array} items
     */
    setChildren: function setChildren(children) {
      var i, n = 0;
      // if (this._children) {
      //   before = this._children[0];
      // }
      // if (children && children.length) {
      //   for (i = 0, n = children.length; i < n; ++i) {
      //     this.insertChild(children[i], before);
      //   }
      // }
      var _children = this._children;
      if (_children  && _children.length) {
        for (i = 0, n = _children.length; i < n; ++i) {
          _children[i]._parent = null;
        }
        _children.length = 0;
        // for (i = children.length - 1; i >= n; --i) {
        //   this.removeChild(children[i]);
        // }
      }
      if (children && children.length) {
        for (i = 0, n = children.length; i < n; ++i) {
          this.insertChild(children[i], null);
        }
      }
      return this;
    },

    /**
     * Insert child before another one which must be in this parent or be null, 
     * like `insertBofore` and `appendChild`.
     * @param {Shell} child     - child to be inserted into this parent
     * @param {Shell} brefore  - child that already exists in this parent. If null, child is appended.
     */
    insertChild: function insertChild(child, before) {
      if (child == null) {
        throw new Error('The new child to be inserted into this parent must not be null');
      }
      var i, j, n, children = this._children;

      if (!children) {
        children = [];
        defineProp(this, '_children', {
          value: children, writable: false, enumerable: false, configurable: true
        });
      }

      n = children.length;

      if (before != null) {
        for (i = 0; i < n; ++i) {
          if (children[i] === before && this === before._parent) {
            break;
          }
        }
        if (i === n) {
          throw new Error('The child before which the new child is to be inserted is not a child of this parent');
        }
        if (before === child) { 
          return this; 
        }
      } else {
        i = n;
      }

      // if ("development" === 'development') {
      //   if (child.guid < this.guid) {
      //     logger.warn('Do not insert the child ' + child.toString() + ' into ' + this.toString() + '. The parent\'s guid should be less than the child\'s for ordered updating from parent to child.');
      //   }
      // }

      if (child._parent) {
        if (child._parent === this) {
          for (j = 0; j < n; ++j) {
            if (children[j] === child) {
              if (j === i) {
                return this;
              }
              children.splice(j, 1);
              i = j < i ? i - 1 : i;
              n = children.length;
              break;
            }
          }
        } else {
          child._parent.removeChild(child);
        }
      } 

      if (i < n) {
        children.splice(i, 0, child);
      } else {
        children.push(child);
      }

      child._parent = this;

      this.invalidate(FLAG_CHANGED_CHILDREN);
      // Parent.invalidate(this, 'length');

      return this;
    },

    appendChild: function appendChild(child) {
      this.insertChild(child, null);
    },

    /**
     * Revome an child from this parent, like `removeChild`.
     * @param {Shell} child - an child that already exists in this parent
     */
    removeChild: function removeChild(child) {
      if (child == null) {
        throw new Error('The new child to be removed from this parent must not be null');
      }

      var i = 0, n = 0, children = this._children;

      if (children) {
        for (i = 0, n = children.length; i < n; ++i) {
          if (children[i] === child && this === child._parent) {
            break;
          }
        }
      }

      if (i === n) { 
        throw new Error('The child to be removed is not a child of this parent');
      }

      if (i < n -1) {
        children.splice(i, 1);
      } else {
        children.pop();
      }

      child._parent = null;
      this.invalidate(FLAG_CHANGED_CHILDREN);
      // Parent.invalidate(this, 'length');

      return this;
    },

    /**
     * Replace the exsited child with new one, like `replaceChild`.
     * @param {Object} child     - a new child as replacement
     * @param {Object} existed  - the exsited child in this parent
     */
    replaceChild: function replaceChild(child, existed) {
      if (child == null) {
        throw new Error('The new child to be inserted into this parent must not be null');
      }
      
      // if (child === existed) { return /*this*/; }

      var i = 0, j = 0, n = 0, children = this._children;

      if (children) {
        for (i = 0, n = children.length; i < n; ++i) {
          if (children[i] === existed && this === existed._parent) {
            break;
          }
        }
      }

      if (i === n) {
        throw new Error('The child to be replaced is not a child of this parent');
      }

      if (child === existed) { 
        return this; 
      }

      if (child._parent) {
        if (child._parent === this) {
          for (j = 0; j < n; ++j) {
            if (children[j] === child) {
              children.splice(j, 1);
              i = j < i ? i - 1 : i;
              n = children.length;
              break;
            }
          }
        } else {
          child._parent.removeChild(child);
        }
      }

      existed._parent = null;
      child._parent = this;
      children[i] = child;

      // Parent.invalidate(this);
      this.invalidate(FLAG_CHANGED_CHILDREN);

      return this;
    }
  });

  // src/base/Watcher.js

  function Watcher() {
    // this._actions = null;
  }

  function getEventTail(event) {
    var tail = '';

    if (event.key) {
      tail += '.' + event.key[0].toLowerCase() + event.key.slice(1);
    } else if (event.button) {
      tail += ['.left', '.middle', '.right'][event.button];
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
      this.emit(event.type + getEventTail(event), event, 0);
    },
    function(event) {
      this.emit(event.type + getEventTail(event), event, 1);
    },
    function(event) {
      this.emit(event.type + getEventTail(event), event, 2);
    },
    function(event) {
      this.emit(event.type + getEventTail(event), event, 3);
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
    var flag = 0;
    if (opts) {
      if (opts.capture) {
        flag |= 1;
      }
      if (opts.passive) {
        flag |= 2;
      }
      if (opts.once) {
        flag |= 4;
      }
    }
    return flag;
  }

  function flag2opts(flag) {
    var opts = {};
    if (flag & 1) {
      opts.capture = true;
    }
    if (flag & 2) {
      opts.passive = true;
    }
    if (flag & 4) {
      opts.once = true;
    }
    return opts;
  }

  function equalCapture(flag0, flag1) {
    return (flag0 & 1) === (flag1 & 1);
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

    // var idx = type.indexOf('.');
    // if (idx > 0) {
    //   var tail = type.slice(idx);
    //   type = type.slice(0, idx);
    // }

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
            // && (!tail || tail === handler.tail) 
              && equalCapture(flag, handler.flag)) {
        return;
      }
    }
    
    handler = {
      func: func,
      flag: flag
    };
    // if (tail) {
    //   handler.tail = tail;
    // }

    handlers.push(handler);

    if (!('listeners' in action) || action.listeners) {
      addEventListener(watcher, action, handler);
    }
  }

  function removeEventHandler(watcher, type, func, opts) {
    var actions = watcher._actions;
    
    if (!actions) { return; }

    // var idx = type.indexOf('.');
    // if (idx > 0) {
    //   var tail = type.slice(idx);
    //   type = type.slice(0, idx);
    // }
    var keys = type.split('.');
    if (keys.length > 2) {
      type = keys[0] + '.' + keys.slice(1).sort().join('.');
    }

    var action = actions[type];

    if (!action) { return; }

    var handlers = action.handlers;

    var handler, i, n = handlers.length, canClearAll = true;

    if (arguments.length === 2) {
      // handlers.length = 0; // handlers.splice(0);
      for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if (handler && handler.func) {
          removeEventHandler(watcher, type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
        }
      }
      return;
    }
    
    var flag = opts2flag(opts);
    for (i = 0; i < n; ++i) {
      handler = handlers[i];
      if (handler && func === handler.func 
          // && (!tail || tail === handler.tail) 
            && equalCapture(flag, handler.flag)) {
        handlers[i] = null;
      }
      if (handlers[i]) {
        canClearAll = false;
      }
    }

    if (action.listeners) {
      var listener = action.listeners[handler.flag & 3];
      if (listener) {
        removeEventListener(watcher, action, handler);
      }
    }

    if (canClearAll) {
      handlers.length = 0;
      delete actions[type];
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
        return listeners[flag & 3];
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
        var configs = type;
        for (type in configs) {
          if (configs.hasOwnProperty(type)) {
            var conf = configs[type];
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
        var configs = type;
        for (type in configs) {
          if (configs.hasOwnProperty(type)) { 
            var conf = configs[type];
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

    // /**
    //  * It works like `on`. But the handler will be removed once it executes for the first time.
    //  *
    //  * @param {Object|string} type
    //  * @param {Function} func
    //  * @returns {self}
    //  */
    // once: function(type, func) {
    //   return this.on(type, func, {once: true});
    // },

    // ison: function ison(type) {
    //   var actions = this._actions;
      
    //   if (!actions) {
    //     return false;
    //   }

    //   return !!actions[type];
    // },

    /**
     * Dispatch custom event, handlers accept rest arguments.
     *
     * @example #emit('ok', a, b) may trigger function(a, b) {}
     * @param {Event|Object|string} type
     * @returns {self}
     */
    emit: function emit(type/*, ...rest*/) {
      
      var actions = this._actions, action;
      
      if (!actions) { return this; }

      var keys = type.split('.');
      if (keys.length > 1) {
        var rest = slice(arguments, 1);
        this.emit.apply(this, keys.slice(0, 1).concat(rest));
        if (keys.length > 2) {
          // keydown.ctrl.alt.a="" becomes kewdown.a.alt.ctrl
          type = keys[0] + '.' + keys.slice(1).sort().join('.');
        }
      }

      action = actions[type];

      if (!action) { return this; }

      var flag = action.listeners ? arguments[2] : 0;

      // event.dispatcher = watcher;
      var handler, handlers = action.handlers;

      for (var i = 0, n = handlers.length; i < n; ++i) {
        handler = handlers[i];
        if (handler /*&& (tail === handler.tail || !handler.tail)*/ 
              && equalCapture(flag, handler.flag)) {
          if (handler.flag & 4) { // once: 0b1xx
            this.off(type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
          }
          handler.func.apply(null, slice(arguments, 1));
        }
      }

      return this;
    }
  });

  // src/base/Generator.js

  /**
   * Generating a value for the property declared in component attributes.
   * @class
   * @constructor
   */
  function Generator() {
    if (arguments.length > 1) {
      this.ctor = arguments[0];
      this.args = arguments[1];
    } else {
      this.gen = arguments[0];
    }
  }

  defineClass({
    constructor: Generator,
    statics: {
      /**
       * Get a new object
       * @param {Class} ctor
       */
      anew: function(ctor) {
        return new Generator(ctor, slice(arguments, 1));
      },
      /**
       * Get an instance
       * @param {Function} gen
       */
      inst: function(gen) {
        return new Generator(gen);
      }
    },
    /**
     * Default generator function for `anew`
     */
    gen: function() {
      var ctor = this.ctor;
      var args = this.args;
      if (!args) {
        return new ctor();
      } else {
        switch (args.length) {
          case 0:
            return new ctor();
            break;
          case 1:
            return new ctor(args[0]);
            break;
          case 2:
            return new ctor(args[0], args[1]);
            break;
          case 3:
            return new ctor(args[0], args[1], args[2]);
            break;
          case 4:
            return new ctor(args[0], args[1], args[2], args[3]);
            break;
          case 5:
            return new ctor(args[0], args[1], args[2], args[3], args[4]);
            break;
          default:
            {
              logger.warn('Sorry but `anew` only supports 6 argumnets at most. Using `inst` instead.');
            }
            throw new Error('`anew` arguments length must not exceed 6.');
            // break;
        }
      }
    }
  });

  // src/base/Accessor.js

  var descriptorShared = {
    configurable: true,
    enumerable: true
  };

  var getters = {}, setters = {};

  function makeGetter(key) {
    if (!getters.hasOwnProperty(key)) {
      getters[key] = function() {
        return this.get(key);
      };
    }
    return getters[key];
  }

  function makeSetter(key) {
    if (!setters.hasOwnProperty(key)) {
      setters[key] = function(val) {
        this.set(key, val);
      };
    }
    return setters[key];
  }

  var EMPTY_DESC = {};
  var SHARED_GET = function(props, key) { return props[key]; };

  function defineGetterSetter(prototype, key) {
    descriptorShared.get = makeGetter(key);
    descriptorShared.set = makeSetter(key);
    defineProp(prototype, key, descriptorShared);
  }

  function getAttributeDefaultValue(desc) {
    var type = typeof desc.value;
    if (type !== 'object') {
      return desc.value;
    } else if (desc.value != null) {
      if (!(desc.value instanceof Generator)) {
        return desc.value;
      } else {
        return desc.value.gen && desc.value.gen();
      }
    }
  }

  function getAttributeDefaultValues(target) {
    var defaultValues = {}, descriptors = target.__extag_descriptors__;
    if (descriptors) {
      for (var key in descriptors) {
        if (descriptors.hasOwnProperty(key)) {
          var desc = descriptors[key];
          var type = typeof desc.value;
          if (type === 'undefined') {
            continue;
          }
          if (type !== 'object') {
            defaultValues[key] = desc.value;
          } else if (desc.value != null) {
            if (!(desc.value instanceof Generator)) {
              defaultValues[key] = desc.value;
            } else {
              defaultValues[key] = desc.value.gen && desc.value.gen();
            }
          }
        }
      }
    }
    return defaultValues;
  }

  function applyAttributeDescriptors(prototype, descriptors, override) {
    if (prototype.hasOwnProperty('__extag_descriptors__')) {
      return;
    }
    if (Array.isArray(descriptors)) {
      // array to key-value descriptors
      var i, n, names = descriptors;
      descriptors = {};
      for (i = 0, n = names.length; i < n; ++i) {
        descriptors[names[i]] = EMPTY_DESC;
      }
    }
    // merge descriptors
    descriptors = assign({}, prototype.__extag_descriptors__, descriptors);

    var key, desc;

    for (key in descriptors) { // define getter/setter for each key
      if (descriptors.hasOwnProperty(key) /*&& !prototype.hasOwnProperty(key)*/) {
        if ((key in prototype) && !override) {
          {
            logger.warn('`' + key + '` is already defined in the prototype of ' + prototype.constructor);
          }
          continue;
        }
        desc = descriptors[key];
        if (typeof desc !== 'object') {
          descriptors[key] = {value: desc};
        } else if (desc instanceof Generator) {
          descriptors[key] = {value: desc};
        } else {
          if (desc) {
            if (desc.get && !desc.set) ; else if (desc.set && !desc.get) {
              desc.get = SHARED_GET;
            }
            descriptors[key] = desc;
          } else {
            descriptors[key] = EMPTY_DESC;
          }
        }
        desc = descriptors[key];
        if (!('bindable' in  desc)) {
          desc.bindable = true; // can dispatch `changed.${key}` event, default true
        }
        if (desc.bindable) {
          defineGetterSetter(prototype, key);
        }
      }
    }

    defineProp(prototype, '__extag_descriptors__', {value: descriptors});
  }

  /**
   * Get the descriptor of the attribute.
   * @param {Object} object 
   * @param {string} attrName 
   */
  function getAttrDesc(object, attrName) {
    return object.__extag_descriptors__ ? object.__extag_descriptors__[attrName] : null;
  }

  function Accessor() {
    throw new Error('Accessor is a partial class for mixins and can not be instantiated');
  }

  defineClass({
    constructor: Accessor,

    statics: { // TODO: move to functions.js
      getAttrDesc: getAttrDesc,
      defineGetterSetter: defineGetterSetter,
      getAttributeDefaultValue: getAttributeDefaultValue,
      getAttributeDefaultValues: getAttributeDefaultValues,
      applyAttributeDescriptors: applyAttributeDescriptors
    },

    get: function get(key) {
      throw new Error('Method `get` must be implemented by sub-class');
    },

    set: function set(key, value) {
      throw new Error('Method `set` must be implemented by sub-class');
    },

    assign: function assign(props) {
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          this.set(key, props[key]);
        }
      }
      return this;
    }
  });

  // src/base/Validator.js

  function getType(value) {
    if (value instanceof Object) {
      var constructor = value.constructor;
      return  constructor.fullName || constructor.name;
    }

    return typeof value;
  }

  function makeTypeError(constructorName, propertyName, expectedType, actualType) {
    return ('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
  }

  function makeTypesError(constructorName, propertyName, expectedTypes, actualType) {
    var types = [];
    for (var i = 0, n = expectedTypes.length; i < n; ++i) {
      types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
    }

    return ('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
  }

  /**
   * Validate the type of the value when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {string|Function} type
   * @returns {TypeError}
   */
  function validateType(target, key, value, type) {
    var t = typeof type, error, constructor;

    if (t === 'string' && typeof value !== type) { //TODO: type can be array
      t = type;
      error = true;
    } else if (t === 'function' && !(value instanceof type)) {
      t = type.fullName || type.name;
      error = true;
    }

    if (error) {
      constructor = target.constructor;
      return makeTypeError(constructor.fullName || constructor.name, key, t, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t = typeof type[i];
        if ((t === 'string' && typeof value === type[i]) || (t === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = target.constructor;
        return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
      }
    }
  }

  /**
   * Validate if the value matches the pattern.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {RegExp} pattern
   * @returns {Error}
   */
  function validatePattern(target, key, value, pattern) {
    if (!pattern.test(value)) {
      return (value + ' does not match the pattern ' + pattern.toString() + 
              ' of the property `' + key + '` in ' +  target.toString());
    }
  }

  /**
     * Check if there is a throuble when the key is set in target.
     *
     * @param {Object} target
     * @param {string} key
     * @param {*} value
     * @param {boolean} warn
     * @returns {boolean}
     */
  function troubleShoot(target, key, value, warn) {
    var desc = Accessor.getAttrDesc(target, key);//target.__extag_descriptors__[key];

    if (!desc || !desc.type && !desc.validator) { return; }

    var trouble, validator, type;

    type = desc.type;
    //required = desc.required;
    if (/*!trouble && */type) {
      trouble = validateType(target, key, value, type);
    }

    if (trouble) {
      {
        warn && logger.warn('Attribute Validation:', trouble);
      }
      return trouble;
    }

    validator = desc.validator;
    if (validator) {
      if (typeof validator === 'function') {
        trouble = validator.call(target, value, key);
      } else {
        trouble = validatePattern(target, key, value, validator);
      }
    }

    // if (validated && target.on && target.send) {
    //   target.send('validated.' + key, trouble);
    // }

    if (trouble) {
      {
        warn && logger.warn('Attribute Validation:', trouble);
      }
      return trouble;
    }
  }

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has attributes:
   *
   *  {
   *    name: 'string',
   *    list: Array,
   *    date: {
   *      type: [Date, 'number', 'string']
   *    },
   *    phone: {
   *      validator: /\d{13}/
   *    },
   *    price: {
   *      type: 'number',
   *      validator: function() {...} // returns error or not
   *    }
   *  }
   *
   *
   */
  var Validator = {
    validate0: function(target, props) {
      var key, desc;
      var descriptors = target.__extag_descriptors__;
      for (key in descriptors) {
        desc = descriptors[key];
        if (desc.required && (!props || !props.hasOwnProperty(key))) {
          logger.warn('Attribute Validation:', 'required `' + key + '` for ' + (target.constructor.fullName || target.constructor.name));
        }
      }
    },
    /**
     * Validate the value when the key is set in target.
     *
     * @param {Object} target
     * @param {string} key
     * @param {*} value
     * @param {boolean} warn
     * @returns {boolean}
     */
    validate: function validate(target, key, value, warn) {
      return !troubleShoot(target, key, value, warn);
    },
    /**
     * Check if there is a throuble when the key is set in target.
     *
     * @param {Object} target
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    troubleShoot: troubleShoot
  };

  // src/base/Evaluator.js

  /**
   * @class
   * @constructor
   * @param {Object} template 
   */
  function Evaluator(template) {
    this.paths = template.paths;  // property paths appeared in this evaluator
    this.func = template.func;    // function to be applied
    // this.args = template.args;    // arguments
  }

  defineClass({
    constructor: Evaluator,

    /**
     * @param {Array} scopes  - local varaibles
     * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
     */
    compile: function(scopes, value) {
      var args;
      if (arguments.length > 1) {
        args = scopes.slice(0);
        args[0] = value;
      } else {
        args = scopes;
      }
      { 
        try {
          return this.func.apply(scopes[0], args);
        } catch (e) {
          var constructor = scopes[0].constructor;
          logger.warn('The expression `' + this.expr + '` maybe illegal in the template of Component ' + (constructor.fullName || constructor.name));
          throw e;
        }
      } 
      return this.func.apply(scopes[0], args);
    }
  });

  // src/base/Expression.js

  /**
   * Expression parsed from `checked@="selected"` and so on, in the component pattern.
   * 
   * @class
   * @constructor
   * @param {Object} binding
   * @param {Object} pattern
   */
  function Expression(binding, pattern) {
    this.binding = binding;
    this.pattern = pattern;
  }

  defineClass({
    constructor: Expression,
    statics: {
      /**
       * Factory method
       *  @param {Object} binding
        * @param {Object} pattern
        */
      create: function(binding, pattern) {
        return new Expression(binding, pattern);
      },
      // /**
      //  * Compile all expressions related to the target in the scope.
      //  * @param {Object} expressions  - all expressions
      //  * @param {Object} target       - the target that is related to the expressions
      //  * @param {Object} scope        - the scope where the target is located
      //  * @param {Array}  locals       - some other local varibles
      //  */
      // compile: function(expressions, target, scope, locals) {  
      //   var key, expression;
      //   for (key in expressions) {
      //     if (expressions.hasOwnProperty(key)) {
      //       expression = expressions[key];
      //       expression.compile(key, target, scope, locals);
      //     }
      //   }
      // }
    },
    /**
     * Compile this expression related to the target in the scope.
     * @param {Object} property - the target property
     * @param {Object} target   - the target that is related to the expressions
     * @param {Object} scope    - the scope where the target is located
     * @param {Array}  locals   - some other local varibles
     */
    compile: function(property, target, scopes) {
      return this.binding.compile(this.pattern, property, target, scopes);
    }
  });

  // src/base/DirtyMarker.js

  function DirtyMarker() {
    throw new Error('DirtyMarker is a partial class for mixins and can not be instantiated');
  }

  defineClass({

    constructor: DirtyMarker,

    statics: {
      /**
       * Check and mark the changed property dirty
       *
       * @param {Object} object
       * @param {string} key
       * @param {*} val
       * @param {*} old
       * @returns {boolean}
       */
      check: function check(object, key, val, old) {
        var dirty = object._dirty;

        if (!dirty) {
          dirty = {};

          defineProp(object, '_dirty', {
              value: dirty, enumerable: false, writable: true, configurable: true}
          );
        }

        if (!(key in dirty)) {
          dirty[key] = old;
        } else if (dirty[key] === val) {
          delete dirty[key];
        }
      },

      /**
       * Clean all or make dirty property clean
       *
       * @param {Object} object
       * @param {string} key
       */
      clean: function clean(object, key) {
        if (!key) {
          object._dirty = null;
        } else {
          delete object._dirty[key];
        }
      }
    },

    /**
     * Check if some property is dirty.
     *
     * @param {string} key
     * @returns {boolean}
     */
    hasDirty: function hasDirty(key) {
      var _dirty = this._dirty;
      return _dirty ? (key == null || _dirty.hasOwnProperty(key)) : false;
    }
  });

  // src/core/Schedule.js


  // var buffers = [[], []];
  var updateQueue = []; 
  var renderQueue = [];
  var callbackQueue = [];
  var updateQueueCursor = 0;
  var turn = 0;
  // var 
  var waiting = false;
  var updating = false;

  function flushQueues() {
    // console.log('flushQueues', updating, waiting)
    if (updating || !waiting) {
      return;
    }
    try {
      turn++;
      updateQueueCursor = 0;
      updating = true;
      // console.log('>>>>>>>>>>>>>>>>>');
      var shell, i, n;
    
      // quene may be lengthen if the method `invalidate` is called when updating
      while (updateQueueCursor < updateQueue.length) {
        // if (updateQueueCursor > 999) {
        //   throw new Error('too much things to update');
        // }
        
        shell = updateQueue[updateQueueCursor];
        // console.log(turn, shell.$flag, shell.toString(), shell._children)
        shell.update();
        ++updateQueueCursor;
      }
    
      updateQueueCursor = 0;
      updateQueue.length = 0;
      updating = false;
      waiting = false;
    
      // renderQueue = buffers[index];
      
      // index = index ? 0 : 1;
    
      for (i = 0, n = renderQueue.length; i < n; ++i) {
        shell = renderQueue[i];
        shell.render();
      }
    
      renderQueue.length = 0;
    
      for (i = callbackQueue.length - 1; i >= 0; --i) {
        callbackQueue[i]();
      }

      callbackQueue.length = 0;
      // console.log('<<<<<<<<<<<<<<<<<');
    } catch (e) {
      updateQueueCursor = 0;
      updateQueue.length = 0;
      renderQueue.length = 0;
      callbackQueue.length = 0;
      updating = false;
      waiting = false;
      throw e;
    }
  }

  /**
   * Insert a shell into the updateQueue for updating accoring to its guid.
   * In order to rendering top-down  (parent to child), 
   * parent's guid must be less than its children's. 
   * Indeed, component template engine obeys this rule. 
   * If you do not obey this rule when creating elements and component manually by yourself, 
   * rendering maybe wrong.
   * @param {Shell} shell
   */
  function insertUpdateQueue(shell) {
    var i, n = updateQueue.length, id = shell.guid;

    if (!updating) {
      i = n - 1;
      while (i >= 0 && id < updateQueue[i].guid) {
        --i;
      }
      ++i;
    } else { // the method `invalidate` maybe called when updating
      i = updateQueueCursor + 1;
      // if (id < updateQueue[updateQueueCursor].guid) {
      //   if ("development" === 'development') {
      //     logger.warn('Do not change properties or emit event to parent component on updating.');
      //   }
      //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
      // }
      while (i < n && id >= updateQueue[i].guid) {
        ++i;
      }
    }

    if (i === n) {
      updateQueue.push(shell);
    } else {
      updateQueue.splice(i, 0, shell);
    }

    if (!waiting) {
      waiting = true;
      setImmediate(flushQueues);
      // console.log('##########');
    }
  }

  /**
   * Insert a shell into the renderQueue.
   * @param {Shell} shell 
   */
  function insertRenderQueue(shell) {
    var i, n = renderQueue.length, id = shell.guid;

    i = n - 1;
    while (i >= 0 && id < renderQueue[i].guid) {
      --i;
    }
    ++i;

    if (i === n) {
      renderQueue.push(shell);
    } else {
      renderQueue.splice(i, 0, shell);
    }
  }

  /**
   * Push a callback function into callbackQueue
   * @param {Function} func 
   */
  function pushCallbackQueue(callback) {
    callbackQueue.push(callback);
  }

  var Schedule = {
    flushQueues: flushQueues,
    insertUpdateQueue: insertUpdateQueue,
    insertRenderQueue: insertRenderQueue,
    pushCallbackQueue: pushCallbackQueue,
    /**
     * Insert a shell into the updateQueue for updating accoring to its guid.
     * In order to rendering top-down  (parent to child), 
     * parent's guid must be less than its children's. 
     * Indeed, component template engine obeys this rule. 
     * If you do not obey this rule when creating elements and component manually by yourself, 
     * rendering maybe wrong.
     * @param {Shell} shell
     */
    insert: function(shell) {
      var i, n = updateQueue.length, id = shell.guid;

      if (!updating) {
        i = n - 1;
        while (i >= 0 && id < updateQueue[i].guid) {
          --i;
        }
        ++i;
      } else { // the method `invalidate` maybe called when updating
        i = updateQueueCursor + 1;
        // if (id < updateQueue[updateQueueCursor].guid) {
        //   if ("development" === 'development') {
        //     logger.warn('Do not change properties or emit event to parent component on updating.');
        //   }
        //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
        // }
        while (i < n && id >= updateQueue[i].guid) {
          ++i;
        }
      }

      if (i === n) {
        updateQueue.push(shell);
      } else {
        updateQueue.splice(i, 0, shell);
      }

      if (!waiting) {
        waiting = true;
        setImmediate(flushQueues);
        // console.log('##########');
      }

      // console.log(updateQueue.length, id)
    },

    /**
     * Append a shell into a renderQueue for rendering.
     * @param {Shell} shell
     */
    append: function(shell) {
      // var renderQueue = buffers[index];
      renderQueue.push(shell);
    },

    /**
     * Push a function into callbackQueue
     * @param {Function} func 
     */
    push: function(func) {
      callbackQueue.push(func);
    }
  };

  // src/core/models/Store.js

  /**
   * Store for storing data an sending property-changed event with declaration.
   * It is like Component, but there is nothing to do with view, just the model.
   * @class
   * @constructor
   * @param {Object} props 
   */
  function Store(props) {
    Store.initialize(this, props);
  }

  defineClass({
    constructor: Store,

    mixins: [Accessor.prototype, Watcher.prototype],

    statics: {
      create: function create(props) {
        return new Store(props);
      },

      initialize: function initialize(store, props) {
        var constructor = store.constructor, prototype = constructor.prototype, descriptors = constructor.attributes;

        // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
          Accessor.applyAttributeDescriptors(prototype, descriptors, true); 
        // }

        if (props) {
          Accessor.applyAttributeDescriptors(store, props, false); 
        }

        var defaults = Accessor.getAttributeDefaultValues(store);

        defineProp(store, '$props', {
          value: defaults, writable: false, enumerable: false, configurable: false
        });

        {
          Validator.validate0(store, props);
        }
    
        if (props) {
          store.assign(props);
        }
      }
    },

    /**
     * Get property stored in $props.
     * @param {string} key
     */
    get: function get(key) {
      var desc = Accessor.getAttrDesc(this, key);
      if (desc) {
        // if (Dep.binding && !desc.compute) {
        //   Dep.add(this, key);
        // }
        return !desc.get ? 
                  this.$props[key] : 
                    desc.get.call(this, this.$props, key);
      }
      return this[key];
    },

    /**
     * Set custom property declared in attributes.
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

      var desc = Accessor.getAttrDesc(this, key);
      // usual property
      if (!desc) {
        // this[key] = val;
        old = this[key];
        if (old !== val) {
          this[key] = val;
          this.emit('changed.' + key, key, val, old);
        }
        return;
      }
      // validation in development 
      {
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
          this.emit('changed.' + key, key);
        }
      } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
        old = desc.get.call(this, props, key);
        desc.set.call(this, val, props);
        val = desc.get.call(this, props, key);
        if (old !== val) {
          this.emit('changed.' + key, key);
        }
      }

      return;
    }
  });

  // src/core/models/Cache.js

  var EMPTY_OWNER = {
    invalidate: function() {}
  };

  /**
   * @class
   * @constructor
   * @param {Object} owner 
   */
  function Cache(owner) { // internal class
    // defineProp(this, '_props', {value: props ? assign({}, props) : {}/*, configurable: true*/});
    defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
    defineProp(this, '_props', {value: {}/*, configurable: true*/});
    // this._owner = owner || EMPTY_OWNER;
  }

  defineClass({
    constructor: Cache, mixins: [Accessor.prototype, DirtyMarker.prototype],

    get: function(key) {
      return this._props[key];
    },

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
      if (val !== old) {
        props[key] = val;
        this._owner.invalidate(FLAG_CHANGED);
        DirtyMarker.check(this, key, val, old);
      }
    }
  });

  // src/core/shells/Shell.js

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

  function Shell() {
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
      {
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
        var type, action, actions = this._actions;
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }
          action = actions[type];
          if (!action) { continue; }
          var handlers = action.handlers, handler;
          for (var i = 0, n = handlers.length; i < n; ++i) {
            handler = handlers[i];
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

  // src/core/shells/Text.js

  function Text(data) {
    Text.initialize(this, data);
  }

  defineClass({
    constructor: Text, extends: Shell,

    statics: {
      /**
       * Create a text.
       * @param {string} data - as text content
       */
      create: function(data) {
        return new Text(data);
      },

      /**
       * initialize the text with data.
       * @param {Text} text
       * @param {string} data
       */
      initialize: function(text, data) {
        {
          if (text.constructor !== Text) {
            throw new TypeError('Text is final class and can not be extended');
          }
        }
        Shell.initialize(text, 3, '', '');
        text.set('data', data || '');
      }
    },

    /**
     * Update this shell and append it to the schedule for rendering.
     * @param {boolean} force - If true, update this shell anyway.
     */
    update: function update() {
      if (this.$flag === FLAG_NORMAL) {
        return false;
      }
      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        this.$flag |= FLAG_WAITING_TO_RENDER;
        Schedule.insertRenderQueue(this);
      }
      return true;
    },

    /**
     * Render the dirty parts of this shell to the attached skin 
     */
    render: function render() {
      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0 || !this.$skin) {
        this.$flag = FLAG_NORMAL;
        return false;
      }

      var viewEngine = Shell.getViewEngine(this);
      // if (!viewEngine) { return this; }
      viewEngine.renderShell(this.$skin, this);
      DirtyMarker.clean(this);

      this.$flag = FLAG_NORMAL;

      return true;
    },

    /**
     * return text content snapshot and its guid.
     * @override
     */
    toString: function() {
      var data = this.get('data');
      data = data == null ? '' : data.toString();
      return '"' + (data.length < 24 ? data : (data.slice(0, 21) + '...'))  + '"(' + this.guid +')';
    }
  });

  // src/core/shells/Element.js
  // import HTMXEngine from '../template/HTMXEngine';


  // function buildCache(element) {
  //   var cache = new Cache(element);
  //   cache.owner = element;
  //   return cache;
  // }

  function resetCache(cache, props) {
    var _props = cache._props, key;
    if (props) {
      cache.assign(props);
    } else {
      props = EMPTY_OBJECT;
    }
    if (_props) {
      for (key in _props) {
        if (!(key in props)) {
          cache.set(key, null);
        }
      }
    }
  }

  function toStyle(cssText, viewEngine) {
    if (!viewEngine || typeof cssText !== 'string') {
      return;
    }
    var style = {},  pieces = cssText.split(';'), piece, index, i;
    for (i = pieces.length - 1; i >= 0; --i) {
      piece = pieces[i];
      index = piece.indexOf(':');
      if (index > 0) {
        style[viewEngine.toCamelCase(piece.slice(0, index).trim())] = piece.slice(index + 1).trim();
      }
    }
    return style;
  }

  /**
   * 
   * @param {string} ns       - namespace, e.g. 'svg' for <rect>, '' for <div>
   * @param {string} tag      - tag name
   * @param {Object} props 
   * @param {Component} scope 
   * @param {Array} locals 
   */
  function Element(ns, tag, props, scopes, template) {
    Element.initialize(this, ns, tag, props, scopes, template);
  }

  defineClass({
    constructor: Element, extends: Shell, mixins: [Parent.prototype],

    statics: {
      initialize: function initialize(element, ns, tag, props, scopes, template) {
        {
          if (element.constructor !== Element) {
            throw new TypeError('Element is final class and can not be extended');
          }
        }

        Shell.initialize(element, 1, tag, ns);

        Element.defineMembers(element);

        
        if (scopes && template) {
          var HTMXEngine = config.HTMXEngine;
          if (props && template.props) {
            HTMXEngine.initProps(assign({}, template.props, props), scopes, element);
          } else if (template.props) {
            HTMXEngine.initProps(template.props, scopes, element);
          } else if (props) {
            HTMXEngine.initProps(props, scopes, element);
          }
          HTMXEngine.initOthers(template, scopes, element);
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
        var idx = tag.indexOf(':');
        if (idx > 0) {
          var ns = tag.slice(0, idx);
          tag = tag.slice(idx + 1);
        }
        return new Element(ns || '', tag, props, scope, locals);
      },

      /**
       * Always update the style and classes through member variables.
       * @param {Element|Compoent} element 
       */
      convert: function convert (element) {
        var _props = element._props;
      
        if (element.hasDirty('style')) {
          DirtyMarker.clean(element, 'style');
          var style = _props.style;
          if (typeof style === 'object') {
            element.style = style;
          } else if (typeof style === 'string') {
            // element.attrs.set('style', style);
            var viewEngine = Shell.getViewEngine(element);
            if (viewEngine) {
              style = toStyle(style, viewEngine);
            }
            element.style = style;
          }
        }
        // if (element.hasDirty('attrs')) {
        //   DirtyMarker.clean(element, 'attrs');
        //   if (typeof _props.attrs === 'object') {
        //     element.attrs = _props.attrs;
        //   } else {
        //     element.attrs = null;
        //   }
        // }
        if (element.hasDirty('classes')) {
          DirtyMarker.clean(element, 'classes');
          var classes = _props.classes;
          if (typeof classes !== 'object') {
            classes = toClasses(classes);
          }
          element.classes = classes;
        }
      },

      /**
       * Define getter/setter for attrs, style and classes
       * @param {Element|Component} element 
       */
      defineMembers: function defineMembers(element) {
        var prototype = element.constructor.prototype;
        if (!('classes' in prototype)) {
          defineProp(prototype, 'attrs', {
            get: function() {
              if (!this._attrs/* && this.tag*/) {
                defineProp(this, '_attrs', {
                  value: new Cache(this), 
                  configurable: true
                });
              }
              return this._attrs;
            },
            set: function(value) {
              resetCache(this.attrs, value);
            }
          });
          defineProp(prototype, 'style', {
            get: function() {
              if (!this._style/* && this.tag*/) {
                defineProp(this, '_style', {
                  value: new Cache(this), 
                  configurable: true
                });
              }
              return this._style;
            },
            set: function(value) {
              resetCache(this.style, value);
            }
          });
          defineProp(prototype, 'classes', {
            get: function() {
              if (!this._classes/* && this.tag*/) {
                defineProp(this, '_classes', {
                  value: new Cache(this), 
                  configurable: true
                });
              }
              return this._classes;
            },
            set: function(value) {
              resetCache(this.classes, value);
            }
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

      Element.convert(this);

      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        this.$flag |= FLAG_WAITING_TO_RENDER;
        Schedule.insertRenderQueue(this);
      }
      
      return true;
    },

    /**
     * Render the dirty parts of this shell to the attached skin 
     */
    render: function render() {
      // console.log('render', this.$flag, this.toString(), this.$skin)
      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0 || !this.$skin) {
        this.$flag = FLAG_NORMAL;
        return false;
      }

      var viewEngine = Shell.getViewEngine(this);
      // if (!viewEngine) { return this; }

      viewEngine.renderShell(this.$skin, this);
      this._children && Parent.clean(this);
      DirtyMarker.clean(this);

      this._attrs && DirtyMarker.clean(this._attrs);
      this._style && DirtyMarker.clean(this._style);
      this._classes && DirtyMarker.clean(this._classes);
      // this._children && Collection.clean(this._children);
      if (this._commands) {
        this._commands = null;
      }

      this.$flag = FLAG_NORMAL;
      return true;
    }
  });

  // src/core/shells/Fragment.js

  function Fragment(props, scopes, template) {
    Fragment.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Fragment, extends: Shell, mixins: [Parent.prototype],

    statics: {
      initialize: function initialize(fragment, props, scopes, template) {
        {
          if (fragment.constructor !== Fragment) {
            throw new TypeError('Fragment is final class and can not be extended');
          }
        }
        // fragment type is 0
        Shell.initialize(fragment, 0, 'x:frag', '');

        fragment.scopes = scopes;
        
        if (scopes && template) {
          template.compile('contents', fragment, scopes);
          
        }

        
      },

      create: function create(props, scopes, template) {
        return new Fragment(props, scopes, template);
      }
    },
    /**
     * Update this shell and append it to the schedule for rendering.
     */
    update: function update() {
      if (this.$flag === FLAG_NORMAL) {
        return false;
      }

      if (this.onUpdating) {
        this.onUpdating();
      }

      if (this.scopes && this.hasDirty('contents')) {
        var JSXEngine = config.JSXEngine;
        var contents = this._props.contents || [];
        JSXEngine.reflow(this.scopes[0], this, contents);
      }

      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
          // We should ask its parent to render parent's children, 
          // since its children are belong to its parent actually.
          // this._parent.invalidate(2); 
          var parent = this._parent;
          if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
            // parent.invalidate(FLAG_CHANGED_CHILDREN | FLAG_WAITING_TO_RENDER);
            parent.$flag |= FLAG_WAITING_TO_RENDER;
            parent.$flag |= FLAG_CHANGED_CHILDREN;
            Schedule.insertRenderQueue(parent);
          }
        }
        this.$flag |= FLAG_WAITING_TO_RENDER;
        Schedule.insertRenderQueue(this);
      }
      
      return true;
    },

    render: function render() {
      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        this.$flag = FLAG_NORMAL;
        return false;
      }
      this.$flag = FLAG_NORMAL;
      return true;
    }
  });

  // src/core/shells/Component.js
  // var emptyDesc = {};

  function Component(props, scope, locals) {
    Component.initialize(this, props, scope, locals);
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
            });
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
        {
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
      {
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
      Shell.prototype.attach.call(this, $skin);
      // this.send('attached');
      if (this.onAttached) {
        this.onAttached($skin);
      }

      // return this;
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

      Element.convert(this);

      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        // If this type is 0, we should ask its parent to render parent's children,
        // since its children are belong to its parent actually.
        if (this.type === 0 && this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
          // this._parent.invalidate(2); 
          var parent = this._parent;
          if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
            // parent.invalidate(FLAG_CHANGED_CHILDREN | FLAG_WAITING_TO_RENDER);
            parent.$flag |= FLAG_WAITING_TO_RENDER;
            parent.$flag |= FLAG_CHANGED_CHILDREN;
            Schedule.insertRenderQueue(parent);
          }
        }
        this.$flag |= FLAG_WAITING_TO_RENDER;
        Schedule.insertRenderQueue(this);
      }
      
      return true;
    },

    /**
     * Render the dirty parts of this shell to the attached skin 
     */
    render: function render() {
      if (this.type === 0) {
        return Fragment.prototype.render.call(this);
      } else if (Element.prototype.render.call(this)) {
        if (this.onRendered && this.$skin) {
          Schedule.pushCallbackQueue((function() {
            this.onRendered(this.$skin);
          }).bind(this));
        }
        return true;
      }
      return false;
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

  // src/core/shells/Block.js


  function Block(props, scopes, template) {
    Block.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Block, extends: Component,

    statics: {
      initialize: function initialize(block, props, scopes, template) {
        Component.initialize(block, props);

        block.mode = 0;

        if (!template) {
          return;
        }

        // block.template = template;
        block.scopes = scopes;
        block.template = assign({}, template);
        delete block.template.ctrls;
        
        block.set('condition', true);

        var ctrls = template.ctrls || {};
        var expression;

        if (ctrls.xIf) {
          block.mode = 1;
          expression = ctrls.xIf;
          expression.compile('condition', block, scopes);
          // Expression.compile({condition: expressions.xIf}, block, scope, locals);
        }

        if (ctrls.xFor) {
          block.mode = 2;
          expression = ctrls.xFor;
          // var path = expression.template.evaluator.paths[0]; // $.items in x-for="item of $.items | filter"
    
          // if (Array.isArray(path)) { // TODO:
          //   var local = locals[path[0]];
          //   var prop = path[path.length - 1];
          //   var src = path.length < 2 ? local : RES.search(path.slice(1, path.length - 1), local, true);
      
          //   if (src && src.on && src.emit) {
          //     var dst = src[prop];
      
          //     var handler = function() {
          //       src.emit('changed.' + prop);
          //     }
      
          //     if (dst && dst instanceof List) {
          //       dst.on('changed', handler);
          //     }
      
          //     src.on('changed.' + prop, function(event) {
          //       if (dst === src[prop]) { return; }
          //       if (dst && dst instanceof List) {
          //         dst.off('changed', handler);
          //       }
          //       dst = src[prop];
          //       if (dst && dst instanceof List) {
          //         dst.on('changed', handler);
          //       }
          //     })
          //   }
          // }
    
          // Expression.compile({iterable: expression}, block, scope, locals);
          expression.compile('iterable', block, scopes);
    
          if (ctrls.xKey) {
            block.keyEval = ctrls.xKey;//.evaluator;
          }
        }

        

        // block.on('update', block.onUpdating.bind(block));
      },
      template: '<x:frag></x:frag>'
    },

    onUpdating: function onUpdating() {
      if (!this.mode) {
        return;
      }

      var condition = this.get('condition');
      var template = this.template;
      var scopes = this.scopes;
      var fragment = [];
      var children;

      if (!condition) {
        this.setChildren(fragment);
        return;
      }

      var HTMXEngine = config.HTMXEngine;

      if (this.mode === 1) {
        if (template.tag === 'x:block') {
          children = template.children;
        } else {
          children = [template];
        }
        for (var i = 0, n = children.length; i < n; ++i) {
          content = HTMXEngine.makeContent(children[i], scopes);
          if (content) {
            fragment.push(content);
          }
        }
        this.setChildren(fragment);
        return;
      }

      var indices = {}, index, content, item, key, n, i;
      var iterable = this.get('iterable') || [];
      children = this._children || [];
      var keyEval = this.keyEval;
      var newScopes;
    
      // for (i = 0, n = children.size(); i < n; ++i) {
      //   key = children.get(i).__key__;
      for (i = 0, n = children.length; i < n; ++i) {
        key = children[i].__key__;
        if (key) {
          indices[key] = i;
        }
      }

      for (i = 0, n = iterable.length; i < n; ++i) {
        key = null;
        content = null;
        item = iterable[i];
        newScopes = scopes.concat([item]);
        // newScopes = scopes.concat([i, item]);
    
        if (keyEval) {
          key = keyEval.compile(newScopes);
          index = indices[key];
          if (index != null) {
            content = children[index];

          }
        }
    
        if (!content) {
          if (template.tag !== 'x:block') {
            content = HTMXEngine.makeContent(template, newScopes);
          } else if (template.children && template.children.length === 1) {
            content = HTMXEngine.makeContent(template.children[0], newScopes);
          }
          content.__key__ = key;
        }
    
        fragment.push(content);
      }

      // if (template.xName) {
      //   // scope[template.xName] = fragment;
      //   scope.addNamedPart(template.xName, fragment);
      // }

      this.setChildren(fragment);
    }
  });

  // src/core/template/HTMXEngine.js
  // import Block from './dynamic/Block';
  // import Slot from './dynamic/Slot';
  // import View from './dynamic/View';

  function initProps(props, scopes, target) {
    if (props) {
      var key, value;
      for (key in props) {
        value = props[key];
        if (typeof value === 'object' && value instanceof Expression) {
          value.compile(key, target, scopes);
        } else {
          target.set(key, value);
        }
      }
    }
  }

  function initAttrs(attrs, scopes, target) {
    if (attrs) {
      initProps(attrs, scopes, target.attrs);
    }
  }

  function initStyle(style, scopes, target) {
    if (style) {
      initProps(style, scopes, target.style);
    }
  }

  function initClasses(classes, scopes, target) {
    if (classes) {
      initProps(classes, scopes, target.classes);
    }
  }

  function initActions(actions, scopes, target) {
    if (actions) {
      var type, value;
      for (type in actions) {
        value = actions[type];
        if (typeof value === 'object' && value instanceof Expression) {
          value.compile(type, target, scopes);
        } else if (typeof value === 'function') {
          target.on(type, value);
        }
      }
    }
  }

  // function initCache(props, member, scopes) {
  //   var key, value;
  //   for (key in props) {
  //     value = props[key];
  //     if (typeof value === 'object' && value instanceof Expression) {
  //       value.compile(key, member, scopes);
  //     } else {
  //       member.set(key, value);
  //     }
  //   }
  // }

  // function initShell(target, props, scopes, node) {
  //   if (props && node.props) {
  //     props = assign({}, node.props, props);
  //   }
  //   // initProps(node.props, target, scopes);
  //   initProps(props, target, scopes);
  //   initAttrs(node.attrs, target, scopes);
  //   initStyle(node.style, target, scopes);
  //   initClasses(node.classes, target, scopes);
  //   initActions(node.actions, target, scopes);
  // }

  // function initProps() {}

  function initOthers(node, scopes, target) {
    initAttrs(node.attrs, scopes, target);
    initStyle(node.style, scopes, target);
    initClasses(node.classes, scopes, target);
    initActions(node.actions, scopes, target);
    
    var contents = makeContents(node.children, scopes);
    if (node.type) {
      target.setContents(contents);
    } else {
      target.setChildren(contents);
    }
  }

  function makeContents(children, scopes) {
    var i, n, content, contents = [];

    if (!children || !children.length) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      content = makeContent(children[i], scopes);
      if (content) {
        contents.push(content);
      }
    }

    return contents;
  }


  function makeContent(node, scopes) {
    var tag = node.tag, type, content;

    if (typeof node === 'string') {
      content = Text.create(node);
    } else if (node instanceof Expression) { // like "hello, @{ $.name }..."
      content = Fragment.create(null, scopes, node);
      // node.compile('contents', content, scopes);
    } else if (node.ctrls == null && node.tag !== '!') {
      type = node.type;
      if (type) {
        // TODO: Component.create(type, props, options, scopes);
        content = Component.create(type, null, scopes, node);
      } else if (node.tag !== '!') {
        // if (node.ns == null) {
        //   node.ns = node.ns;
        // }
        content = Element.create(node.ns ? node.ns + ':' + tag : tag, null, scopes, node);
      }
      // start(node, content, scopes);
      if (content && node.name) {
        scopes[0].addNamedPart(node.name, content); // TODO: removeNamedPart
        defineProp(content, '$owner', {
          value: scopes[0]
        });
      }
    } else if (node.ctrls) {
      content = Component.create(Block, null, scopes, node);
    }

    return content;
  }

  // function start(node, target, scopes) { // TODO: host, data, event
  //   scope = scope || target;

  //   if (scope === target) {
  //     locals = [scope];
  //   }

  //   build(node, target, scopes);
  // }



  // function fillShell(target, scopes, node) {
  //   var i, n, content, contents = [], children = node.children;

  //   if (!children || !children.length) { return; }

  //   for (i = 0, n = children.length; i < n; ++i) {
  //     content = makeShell(children[i], scopes);
  //     if (content) {
  //       contents.push(content);
  //     }
  //   }

  //   /*if (target === scope) {
  //     target._content.setChildren(contents);
  //   } else*/ if (!node.type/* || target === scope*/) {
  //     target.setChildren(contents);
  //   } else {
  //     target.setContents(contents);
  //   }
  // }

  var HTMXEngine = {
    initProps: initProps,
    initOthers: initOthers,
    makeContent: makeContent
  };

  config.HTMXEngine = HTMXEngine;

  // src/core/shells/Slot.js

  function Slot(props, scopes, template) {
    Slot.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Slot, extends: Component,
    statics: {
      initialize: function initialize(slot, props, scopes, template) {
        // Shell.initialize(slot, 0, 'x:slot', '');
        var name = template && template.props && template.props.name;

        Component.initialize(slot, props, scopes, {
          props: {
            name: name || ''
          }
        });

        slot.template = assign({}, template);
        if (name) {
          delete slot.template.props.name;
        }

        slot.scopes = scopes;

        slot.invalidate(FLAG_CHANGED);
        // slot.invalidate = slot.invalidate.bind(slot);
        scopes[0].on('changed.contents', function() {
          slot.invalidate(FLAG_CHANGED);
        });
      },
      template: '<x:frag></x:frag>'
    },

    onUpdating: function onUpdating() {
      // if (!this.hasDirty('scopeContents') && !this.hasDirty('name')) {
      //   return;
      // }

      var fragment = [], children, content, n, i;
      var scopeContents = this.scopes[0].getContents();
      var template = this.template, scopes = this.scopes;

      if (scopeContents && scopeContents.length > 0) {
        var name = this.get('name') || '';
        for (i = 0, n = scopeContents.length; i < n; ++i) {
          content = scopeContents[i];
          if (name === (content.attrs.get('x:slot') || '')) {
            fragment.push(content);
          }
        }
      } else if (template.children) {
        children = template.children;
        for (i = 0, n = children.length; i < n; ++i) {
          content = HTMXEngine.makeContent(scopes, children[i]);
          if (content) {
            fragment.push(content);
          }
        }
      }

      this.setChildren(fragment);
    }
  });

  // src/core/bindings/Binding.js

  // var LETTERS = '0123456789ABCDEFGHIGKLMOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz';

  var Binding = defineClass({
    constructor: function Binding() {},

    statics: {
      // guid: function guid(length) {
      //   // var LETTERS = '0123456789ABCDEFGHIGKLMOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz';
      //   var r = Math.random() * Math.pow(10, length), i = Date.now() % 1000, s = '';
      //   while (s.length < length) {
      //     i += r % 10;
      //     s += LETTERS.charAt(i % LETTERS.length);
      //     r = (r - r % 10) / 10;
      //   }
      //   return s;
      // },
      assign: function assign(target, key, val, binding) {
        if (binding.locked) {
          return;
        }
        binding.locked = true;
        if (target.set) {
          target.set(key, val);
        } else {
          target[key] = val;
        }
        binding.locked = false;
      },

      record: function record(target, binding) {
        var _bindings = target._bindings;

        if (_bindings) {
          _bindings.push(binding);
        } else {
          defineProp(target, '_bindings', {
            value: [binding], writable: false, enumerable: false, configurable: true
          });
        }
      },

      remove: function remove(target, binding) {
        var _bindings = target._bindings;

        if (_bindings && _bindings.length) {
          _bindings.splice(_bindings.lastIndexOf(binding), 1);
        }
      },

      search: function search(target, targetProp) {
        var _bindings = target._bindings;
        
        if (_bindings && _bindings.length) {
          for (var i = _bindings.length - 1; i >= 0; --i) {
            if (_bindings[i].targetProp === targetProp) {
              return _bindings[i];
            }
          }
        }
      }
    }
  });

  // src/core/bindings/DataBinding.js

  var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

  function DataBinding(pattern) {
    this.pattern = pattern;
    // this.id = Binding.guid(8);
    this.flag = 0;
    // this.active = true;
    // this.mode = pattern.mode;
    // this.paths = pattern.paths;
    // this.event = pattern.event;
    // this.evaluator = pattern.evaluator;
    // this.converters = pattern.converters;
  }

  defineClass({
    constructor: DataBinding,
    statics: {
      MODES: MODES,

      create: function(pattern) {
        return new DataBinding(pattern);
      },

      compile: function(pattern, property, target, scopes) {
        return DataBinding.create(pattern).link(property, target, scopes);
      },

      destroy: function(binding) {
        var pattern = binding.pattern,
          source = binding.source,
          target = binding.target,
          scopes = binding.scopes;

        //if (mode === MODES.ONE_TIME) { return; }

        if (pattern.mode === MODES.TWO_WAY)  {
          // target.off && target.off('changed.' + binding.targetProp, binding.back);
          if (isBindable(binding.target, binding.targetProp)) {
            binding.target.off('changed.' + binding.targetProp, binding.back);
          }
        }

        scopes[0].off(binding.event ? binding.event : 'update', binding.exec);
        
        Binding.remove(target, binding);

        delDeps(binding);
      }
    },

    link: function(property, target, scopes) {
      var pattern = this.pattern;

      this.flag = 0;
      this.scopes = scopes;
      this.target = target;
      this.targetProp = property;

      // this.exec();

      if (pattern.mode === MODES.ASSIGN) {
        // this.invalidate(1);
        Binding.assign(this.target, this.targetProp, this.eval(), this);
        return;
      }

      // this.invalidate = this.invalidate.bind(this);

      this.exec = this.exec.bind(this); // TODO: use different exec in different mode

      var event = pattern.event;
      if (event) ; else {
        addDeps(this);
        if (this.deps) { // TODO: on different event according to deps
          Binding.record(target, this);
          this.scopes[0].on('update', this.exec);
        }
      }

      if (pattern.mode === MODES.TWO_WAY) {
        this.back = this.back.bind(this);
        var path = Path.parse(pattern.paths[0]);
        var from = pattern.identifiers.indexOf(path[0]);
        this.sourceProp = path[path.length - 1];
        this.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);

        if (isBindable(this.target, this.targetProp)) {
          this.target.on('changed.' + this.targetProp, this.back);
        }
      }

      // this.exec();
      // this.invalidate(1);
      Binding.assign(this.target, this.targetProp, this.eval(), this);
    },

    eval: function(back) {
      var pattern = this.pattern;
      var converters = pattern.converters;

      if (pattern.mode === MODES.TWO_WAY) {
        if (converters && converters.length) {
          if (back) {
            return converters[1].compile(this.scopes, this.target[this.targetProp]);
          } else {
            return converters[0].compile(this.scopes, this.source[this.sourceProp]);
          }
        } else {
          if (back) {
            return this.target[this.targetProp];
          } else {
            return this.source[this.sourceProp];
          }
        }
      } 

      if (converters && converters.length) {
        return applyConverters(converters, this.scopes, pattern.evaluator.compile(this.scopes));
      } else {
        return pattern.evaluator.compile(this.scopes);
      }
    },

    exec: function exec() {
      // console.log('exec', this.flag, this.targetProp, this.target.toString(), this.pattern.event)
      if (!this.pattern.event && !this.flag) {
        return;
      }
      
      

      if (this.flag > 1) {
        DataBinding.destroy(this);
        DataBinding.compile(this.pattern, this.targetProp, this.target, this.scopes);
      } else {
        Binding.assign(this.target, this.targetProp, this.eval(), this);
      }
      // console.log(this.target, this.targetProp, this.target[this.targetProp]);
      // if (this.flag > 1) {
        this.flag = 0;
      // }

      if (this.pattern.mode === MODES.ONE_TIME) {
        this.scopes[0].off('update', this.exec);
      }
    },

    back: function back() {
      Binding.assign(this.source, this.sourceProp, this.eval(true), this);
    },

    invalidate: function(flag) {
      // console.log('invalidate', flag, this.targetProp, this.target.toString())
      this.scopes[0].invalidate(FLAG_CHANGED);
      if (this.flag < flag) {
        this.flag = flag;
      }
    }
  });

  function depend(i, prop, paths, source, origin) {
    // var descriptors = source.__extag_descriptors__;

    var desc = Accessor.getAttrDesc(source, prop); //descriptors && descriptors[prop];

    if (desc && desc.depends) {
      var j, n, depends = desc.depends;

      for (j = 0, n = depends.length; j < n; ++j) {
        // path = Path.parse(depends[j]); 
        // path.unshift(origin);
        // paths.push(path);
        paths.push(CONTEXT_SYMBOL + '.' + depends[j]);
      }

      paths[i] = null;

      return true;
    }
  }

  function isBindable(src, prop) {
    var desc = Accessor.getAttrDesc(src, prop);
    return (desc && desc.bindable) || src instanceof Store;
  }

  function addDeps(binding) {
    var pattern = binding.pattern;
    var identifiers = pattern.identifiers;
    var paths = pattern.paths;
    var scopes =  binding.scopes;
    if (!scopes || !paths || !paths.length) { return; }
    // Dep.begin(binding);
    var i, j, k, path, temp, deps, scope;
    paths = paths.slice(0);
    for (i = 0; i < paths.length; ++i) {
      // path = paths[i];
      // if (!path) {
      //   continue;
      // }

      if (paths[i] == null) {
        continue;
      }

      path = Path.parse(paths[i]);
      k = identifiers.indexOf(path[0]);
      if (k < 0) { continue; }
      
      deps = [];
      scope = scopes[k];
      // console.log('path', path)
      for (j = 1; j < path.length; ++j) {
        if (!(scope instanceof Object)) {
          break;
        }
        var dep = null;
        temp = path[j];
        if (isBindable(scope, temp)) {
          dep = {
            src: scope,
            prop: temp,
            index: j
          };
        }

        if (dep && depend(i, dep.prop, paths, dep.src, path[0])) {
          paths[i] = null;
          dep = null;
        }
        if (dep) {
          deps.push(dep);
        }
        scope = scope[temp];
      }

      for (j = 0; j < deps.length; ++j) {
        dep = deps[j];
        dep.func = 
          (j === deps.length - 1) ? 
          function() {
            binding.invalidate(1);
          } : 
          function() {
            binding.invalidate(2);
          };
        dep.src.on('changed.' + dep.prop, dep.func);
      }

      if (deps.length > 0) {
        if (!binding.deps) {
          binding.deps = [];
        }
        binding.deps.push.apply(binding.deps, deps);
      }
    }
    // Dep.end();
    // return flag;
  }

  function delDeps(binding) {
    var i, dep, deps = binding.deps;
    for (i = 0; i < deps.length; ++i) {
      dep = deps[i];
      dep.src.off('changed.' + dep.prop, dep.func);
    }
    deps.length = 0;
    delete binding.deps;
  }

  function applyConverters(converters, scopes, value) {
    if (!converters || !converters.length) { return value; }
    for (var i = 0; i < converters.length; ++i) {
      value = converters[i].compile(scopes, value);
    }
    return value;
  }

  // src/core/bindings/EventBinding.js

  function EventBinding(pattern) {
    this.pattern = pattern;
  }

  defineClass({
    constructor: EventBinding,

    statics: {
      create: function(pattern) {
        return new EventBinding(pattern);
      },

      compile: function(pattern, type, target, scopes) {
        EventBinding.create(pattern).link(type, target, scopes);
      }
    },

    link: function(type, target, scopes) {
      var wrapper, pattern = this.pattern, handler = pattern.handler, evaluator = pattern.evaluator, modifiers = pattern.modifiers;

      if (handler) {
        var func = scopes[0][handler];

        
        if (!func) {
          {
            logger.warn('No such handler method named ' + handler + ' in ' + scopes[0], scopes[0]);
          }
          return;
        }

        // var keys = type.split('.');
        // if (keys.length > 2) {
        //   type = keys.slice(0, 2).concat(keys.slice(2).sort()).join('.')
        // }
        
        //if (!func.__bound__to__) { // TODO: __exact__bound__
        //  func = func.bind(context);
        //  defineProp(func, '__bound__to__', {
        //    value: context, writable: false, enumerable: false, configurable: true
        //  });
        //  context[handler] = func;
        //}
        if (!modifiers || !modifiers.length) {
          target.on(type, func);
        } else if (modifiers[0] === 'bind' && modifiers.length === 1) {
          target.on(type, func.bind(scopes[0]));
        } else {
          wrapper = function(event) {
            // process(event, type, target, wrapper, modifiers);
            processModifiers(modifiers, event);
            if (modifiers.indexOf('bind') >= 0) {
              func.apply(scopes[0], arguments);
            } else {
              func.apply(null, arguments);
            }
            
          };
          target.on(type, wrapper, extractOptions(modifiers));
        }
      } else {
        if (!modifiers || !modifiers.length) {
          target.on(type, function(event) {
            // if (event) {
            //   evaluator.compile(scopes.concat([event]));
            // } else {
              evaluator.compile(scopes);
            // }
          });
        } else {
          wrapper = function(event) {
            // process(event, type, target, wrapper, modifiers);
            processModifiers(modifiers, event);
            // if (event) {
            //   evaluator.compile(scopes.concat([event]));
            // } else {
              evaluator.compile(scopes);
            // }
          };
          target.on(type, wrapper, extractOptions(modifiers));
        }
      }
      // target.on(type, wrapper);
    }
  });

  function extractOptions(modifiers) {
    var options = {
      once: modifiers.indexOf('once') >= 0,
      capture: modifiers.indexOf('capture') >= 0,
      passive: modifiers.indexOf('passive') >= 0
    };
    return options;
  }

  function processModifiers(modifiers, event) {
    if ((typeof event === 'object') && event && modifiers && modifiers.length) {
      if (modifiers.indexOf('stop') >= 0 && event.stopPropagation) {
        event.stopPropagation();
      }
      if (modifiers.indexOf('prev') >= 0 && event.preventDefault) {
        event.preventDefault();
      }
    }
  }

  // function process(event, type, target, wrapper, modifiers) {
  //   if (event && modifiers && modifiers.length) {
  //     for (var i = 0, n = modifiers.length; i < n; ++i) {
  //       switch (modifiers[i]) {
  //         // case 'once':
  //         //   target.off(type, wrapper);
  //         //   break;
  //         case 'prev':
  //           event.preventDefault && event.preventDefault();
  //           break;
  //         case 'stop':
  //           event.stopPropagation && event.stopPropagation();
  //           break;
  //       }
  //     }
  //   }
  // }

  // src/core/bindings/FragmentBinding.js

  // var Array$join = Array.prototype.join;

  function FragmentBinding(pattern) {
    this.pattern = pattern;
  }

  defineClass({
    /**
     * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
     */
    constructor: FragmentBinding,

    statics: {
      create: function(pattern) {
        return new FragmentBinding(pattern);
      },

      compile: function(pattern, property, target, scopes) {
        FragmentBinding.create(pattern).link(property, target, scopes);
      },

      destroy: function(binding) {
        binding.scopes[0].off('update', binding.exec);

        var bindings = binding.cache._bindings;

        if (bindings) {
          for (var i = bindings.length - 1; i >= 0; --i) {
            DataBinding.destroy(bindings[i]);
          }
        }

        Binding.remove(binding.target, binding);
      }
    },

    link: function(property, target, scopes) {
      var i, n, piece, pattern = this.pattern;

      this.scopes = scopes;
      this.target = target;
      this.property = property;

      var cache = this.cache = new Cache(scopes[0]);
      // cache.owner = scopes[0];

      for (i = 0, n = pattern.length; i < n; ++i) {
        piece = pattern[i];

        if (piece instanceof Expression) {
          piece.compile(i, cache, scopes);
        } else {
          cache.set(i, piece);
        } 
      }

      cache.set('length', n);

      Binding.record(target, this);

      this.exec();

      this.exec = this.exec.bind(this);

      scopes[0].on('update', this.exec);
    },

    exec: function() {
      var cache = this.cache;

      if (!cache.hasDirty()) { return; }

      var value = slice(cache._props, 0);

      if (this.pattern.asStr) {
        value = value.join('');
      }

      Binding.assign(this.target, this.property, value, this);

      DirtyMarker.clean(cache);
    }
  });

  // src/core/template/JSXEngine.js

  var RESERVED_PARAMS = {
    ns: null,
    // tag: null,
    xkey: null,
    xname: null,
    //type: null,
    props: null,
    // attrs: null,
    // style: null,
    // 'class': null,
    // classes: null,
    // className: null,
    
    events: null,
    // directs: null,
    children: null,
    contents: null
  };

  /**
   * e.g. node('div', null, [
   *        node('h1', null, 'title'),
   *        node('ul', null,
   *          node('a', {
   *              'href@': 'link.url',
   *              classes: {link: true, 'active@': 'link.active'},
   *              directs: {'for': 'link of $.links', key: 'link.url'}
   *            },
   *            ['tip: @{ link.tip }']
   *          )
   *        ),
   *        node(Button, { label: 'OK', 'click+': '$.onClick' })
   *      ])
   *
   * @param {string|Function} tagOrType
   * @param {Object} params
   * @param {string|Array|Object} children
   * @returns {Object}
   */
  function node(type, params, children) {
    var node = {
      __extag__node__: true
    };

    var t = typeof type;
    if (t === 'string') {
      var i = type.indexOf(':');
      if (i < 0) {
        node.ns = '';
        node.tag = type;
      } else {
        node.ns = type.slice(0, i);
        node.tag = type.slice(i + 1);
      }
    } else if (t === 'function') {
      node.type = type;
    } else {
      throw new TypeError('First argument must be string or constructor');
    }

    if (arguments.length === 2 && (Array.isArray(params) || typeof params !== 'object')) {
      children = params;
      params = null;
    }

    if (params) {
      if (params.xkey) {
        node.key = param.xkey;
      }
      if (params.xname) {
        node.name = params.xname;
      }
      // if (params.style) {
      //   node.style = params.style;
      // }
      // if (params.xattrs) {
      //   node.attrs = params.xattrs;
      // }
      // if (params.xclass) { // TODO: className
      //   node.classes = params.xclass;
      // }
      if (params.events) {
        node.events = params.events;
      }

      // node.directs = params.directs;

      var props = node.props = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && !RESERVED_PARAMS.hasOwnProperty(key)) {
          props[key] = params[key];
        }
      }
    }

    if (children) {
      if (Array.isArray(children)) {
        children = flatten(children);
      } else {
        children = [children];
      }
      if (node.type) {
        node.contents = children;
      } else {
        node.children = children;
      }
    }

    return node;
  }

  // function slot(name, children) {
  //   return {
  //     tag: 'x-slot',
  //     type: Slot,
  //     directs: {
  //       name: name || ''
  //     },
  //     children: children
  //   }
  // }

  function flatten(list, array) {
    var i, n = list.length;
    if (!array) {
      for (i = 0; i < n; ++i) {
        if (Array.isArray(list[i])) {
          array = [];
          break;
        }
      }
    }
    if (array) {
      for (i = 0; i < n; ++i) {
        var item = list[i];
        if (Array.isArray(item)) {
          flatten(item, array);
        } else {
          array.push(item);
        }
      }
    }
    return array ? array : list;
  }

  /**
   * Check if the node matches the child element or child component.
   * @param {Shell} oldChild  - child element or component
   * @param {Object} newChild - node
   */
  function matchesChild(oldChild, newChild) {
    return oldChild.xkey === newChild.xkey && 
            (newChild.type ? oldChild.constructor === newChild.type : 
              (oldChild.tag === newChild.tag && oldChild.ns === newChild.ns));
  }

  /**
   * Create a child from node.
   * @param {Object} node 
   * @param {Shell} target      - parent element or component
   * @param {Component} scope   - scope component
   */
  function createChild(node, target, scope) {
    var child, ns;
    if (node == null) {
      child = Text.create('');
      return child;
    } else if (node.type) {
      child = Component.create(
        node.type, 
        node.props, 
        [scope]//, node
      );
    } else if (node.tag) {
      ns = node.ns || target.ns;
      child = Element.create(
        ns ? ns + ':' + node.tag : node.tag, 
        node.props, 
        [scope]//, node
      );
    } else {
      child = Text.create(node);
      return child;
    }

    if (node.name) {
      // console.log('x:name=' + node.name);
      // scope[node.xName] = child; // TODO: addNamedPart
      scope.addNamedPart(node.name, child);
      defineProp(child, '$owner', {
        value: scope
      });
    }

    if (node.xkey) {
      child.__key__ = node.xkey;
    }

    return child;
  }

  function updatePropsAndEvents(node, target, scope) {
    var name;
    var newProps = node.props;
    var newEvents = newProps && newProps.events;
    var oldProps = target._vnode && target._vnode.props;
    var oldEvents = target._vnode && target._vnode.events;
    
    if (oldEvents) {
      for (name in oldEvents) {
        if (!newEvents || !(name in newEvents)) {
          target.off(name, oldEvents[name]);
        }
      }
    }

    if (newEvents) {
      target.on(newEvents);
    }
    
    if (oldProps) {
      if (target instanceof Component) {
        for (name in oldProps) {
          if (!newProps || !(name in newProps)) {
            desc = Accessor.getAttrDesc(name);
            if (desc) {
              target.set(name, Accessor.getAttributeDefaultValue(desc));
            } else {
              target.set(name, null);
            }
          }
        }
      } else {
        for (name in oldProps) {
          if (!newProps || !(name in newProps)) {
            target.set(name, null);
          }
        }
      }
    }
    
    if (newProps) {
      target.assign(newProps);
    }
    
    if (target._vnode) {
      target._vnode = node;
    } else {
      defineProp(target, '_vnode', {
        value: node, writable: true, enumerable: false, configurable: true
      });
    }
  }

  function updateChildrenOrContents(node, target, scope) { // refer to Vue (http://vuejs.org/)
    var oldChildren, newChildren;

    if (target instanceof Component && target !== scope) {
      oldChildren = target._contents || EMPTY_ARRAY;
      newChildren = node.contents || EMPTY_ARRAY;
    } else if (!(target instanceof Slot)) {
      oldChildren = target._children || EMPTY_ARRAY;
      newChildren = node.children || EMPTY_ARRAY;
    } else {
      return;
    }

    var contents = new Array(newChildren.length), indices, key, i;

    var oldBeginIndex = 0, oldEndIndex = oldChildren.length - 1;
    var newBeginIndex = 0, newEndIndex = newChildren.length - 1;

    var oldBeginChild = oldChildren[oldBeginIndex];
    var oldEndChild = oldChildren[oldEndIndex];
    var newBeginChild = newChildren[newBeginIndex];
    var newEndChild = newChildren[newEndIndex];
    // console.log(oldBeginIndex, oldEndIndex, newBeginIndex, newEndIndex)
    while (oldBeginIndex <= oldEndIndex && newBeginIndex <= newEndIndex) {
      
      if (oldBeginChild == null) {
        oldBeginChild = oldChildren[++oldBeginIndex];
      } else if (oldEndChild == null) {
        oldEndChild = oldChildren[--oldEndIndex];
      } else if (matchesChild(oldBeginChild, newBeginChild)) {
        contents[newBeginIndex] = oldBeginChild; 
        updateShell(newBeginChild, oldBeginChild, scope);
        oldBeginChild = oldChildren[++oldBeginIndex];
        newBeginChild = newChildren[++newBeginIndex];
      } else if (matchesChild(oldEndChild, newEndChild)) {
        contents[newEndIndex] = oldEndChild;
        updateShell(newEndChild, oldEndChild, scope);
        oldEndChild = oldChildren[--oldEndIndex];
        newEndChild = newChildren[--newEndIndex];
      } else if (matchesChild(oldBeginChild, newEndChild)) {
        contents[newEndIndex] = oldBeginChild;
        updateShell(newEndChild, oldBeginChild, scope);
        oldBeginChild = oldChildren[++oldBeginIndex];
        newEndChild = newChildren[--newEndIndex];
      } else if (matchesChild(oldEndChild, newBeginChild)) {
        contents[newBeginIndex] = oldEndChild;
        updateShell(newBeginChild, oldEndChild, scope);
        oldEndChild = oldChildren[--oldEndIndex];
        newBeginChild = newChildren[++newBeginIndex];
      } else  {
        if (!indices) {
          indices = {};
          for (i = oldBeginIndex; i <= oldEndIndex; ++i) {
            key = oldChildren[oldBeginIndex].__key__;
            if (key) {
              indices[key] = i;
            }
          }
        }

        key = newBeginChild.xkey;
        i = key && indices[key];

        if (i != null && matchesChild(oldChildren[i] || EMPTY_OBJECT, newBeginChild)) {
          contents[newBeginIndex] = oldChildren[i];
        } else {
          // child = createChild(newBeginChild, scope);
          contents[newBeginIndex] = createChild(newBeginChild, target, scope);
        }

        updateShell(newBeginChild, contents[newBeginIndex], scope);

        newBeginChild = newChildren[++newBeginIndex];
      }
      // console.log(oldBeginIndex, oldEndIndex, newBeginIndex, newEndIndex)
    }

    if (oldBeginIndex > oldEndIndex) {
      while (newBeginIndex <= newEndIndex) {
        contents[newBeginIndex] = createChild(newBeginChild, target, scope);
        updateShell(newBeginChild, contents[newBeginIndex], scope);
        newBeginChild = newChildren[++newBeginIndex];
      }
    }
    
    if (target instanceof Component && target !== scope) {
      target.setContents(contents);
    } else {
      target.setChildren(contents);
    }
  }

  function updateShell(node, target, scope) {
    if (typeof node === 'object' && node.__extag__node__) {
      // updateSelf(node, target, scope);
      // updateProps(node.props, target, scope);
      // updateStyle(node.style, target, scope);
      // updateEvents(node.events, target, scope);
      updatePropsAndEvents(node, target);
      updateChildrenOrContents(node, target, scope);
    } else /*if (target instanceof Text)*/ {
      target.set('data', node);
    }
  }

  // function reflow(nodes, target, scope) {
  //   if (target instanceof Component && target !== scope) {
  //     updateChildrenOrContents({contents: nodes}, target, scope);
  //   } else {
  //     updateChildrenOrContents({children: nodes}, target, scope);
  //   }
  // }

  function reflow(scope, target, nodes) {
    if (arguments.length === 2) {
      nodes = target;
      target = scope;
    } 
    // console.log(nodes)
    if (target instanceof Component && target !== scope) {
      updateChildrenOrContents({contents: flatten(nodes)}, target, scope);
    } else {
      updateChildrenOrContents({children: flatten(nodes)}, target, scope);
    }
  }

  var JSXEngine = {
    node: node,
    // slot: slot,
    reflow: reflow
  };

  config.JSXEngine = JSXEngine;

  // src/core/shells/View.js

  function View(props, scopes, template) {
    View.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: View, extends: Component,
    statics: {
      initialize: function initialize(view, props, scopes, template) {
        var xtype = template && template.attrs && template.attrs['x:type'];

        Component.initialize(view, props, scopes, {
          props: {
            xtype: xtype
          }
        });

        view.template = assign({}, template);
        view.template.attrs = assign({}, template.attrs);
        delete view.template.attrs['x:type'];

        view.scopes = scopes;
        
        // var directs = template.directs;
        // delete template.directs;
        // delete template.dynamic;
        // if (directs) {
        //   view.assign(directs);
        //   if (scope && locals && directs.expressions) {
        //     Expression.compile(directs.expressions, view, scope, locals);
        //   }
        // }
        view.invalidate(FLAG_CHANGED);
      },
      template: '<x:frag></x:frag>'
    },

    onUpdating: function onUpdating() {
      // TODO: x:cache
      var type = this.get('xtype');//this.attrs.get('x:type');
      var fragment = [], content, ctor;
      var template = this.template, scopes = this.scopes;

      if (typeof type === 'function') {
        ctor = type;
      } else if (typeof type === 'string') {
        if (/^url\(.*\)$/.test(type)) {
          // TODO: check `require`
          require([type], (function(ctor) {
            // this.attrs.set('x:type', ctor);
            this.set('xtype', ctor);
          }).bind(this));
          return;
        } else {
          ctor = scope.res(type);//RES.search(xType, scope.constructor.resources);
        }
      } else if (typeof type === 'object' && typeof Promise === 'function' && type instanceof Promise) {
        type.then((function(ctor) {
          // this.attrs.set('x:type', ctor);
          this.set('xtype', ctor);
        }).bind(this));
      }

      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        // throw new Error('No such component type `' + xType + '`');
        return;
      }
      
      template.tag = '?';
      template.type = ctor;
      content = HTMXEngine.build(template, scopes);
      fragment.push(content);

      this.setChildren(fragment);
    }
  });

  // src/core/template/parsers/EvaluatorParser.js

  var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield Array Date Infinity Math NaN Number Object String Boolean';
  var JS_KEYWORD_MAP = {};
  (function() {
    var keywords = JS_KEYWORDS.split(/\s+/);
    for (var i = 0, n = 0; i < n; ++i) {
      JS_KEYWORD_MAP[keywords[i]] = true;
    }
  })();

  function skipWhiteSpace(expression, index) {
    while (expression.charCodeAt(index) === 32) { // 32: ' '
      ++index;
    }
    return index;
  }

  function isLegalVarStartCharCode(cc) {
    //       a-z                       A-Z                       _            $
    return  (cc >= 97 && cc <= 122) || (cc >= 65 && cc <= 90) || cc === 95 || cc === 36;
  }

  function extract(expression) {
    var indices = [];
    var b0, b1, b2, cb, cc;
    for (var i = 0, n = expression.length; i < n; ++i) {
      cb = cc;
      // cs = expression.charAt(i);
      cc = expression.charCodeAt(i);
      switch (cc) {
        case 39: // '
          if (!b0) b0 = true; 
          else if (cb !== 92) b0 = false; // 92: \
          break;
        case 34: 
          if (!b1) b1 = true; 
          else if (cb !== 92) b1 = false; // 92: \
          break;
        default:
          if (!b0 && !b1 && !b2 && cb !== 46 && isLegalVarStartCharCode(cc)) {
            indices.push(i);
            b2 = true;
            continue;
          }
          break;
      }
      //          a-zA-Z\_\$                     0-9                       \.
      if (b2 && !(isLegalVarStartCharCode(cc) || (cc >= 48 && cc <= 57) || cc === 46)) {
        b2 = false;
        var j = skipWhiteSpace(expression, i+1);
        if (expression.charCodeAt(j) === 92) { // :
          indices.push(-1);
        } else {
          indices.push(i);
        }
      }
    }
    
    if (b2) {
      indices.push(n);
    }

    return indices;
  }

  var EvaluatorParser = {
    /**
     * @param {string} expression
     * @param {Object} prototype
     * @param {Array} identifiers
     * @returns {Object}
     */
    parse: function parse(expression, prototype, identifiers) {
      var paths = [], lines = [], expanded = 0, expr = expression, i = 0;
      var resources = prototype.constructor.resources || EMPTY_OBJECT;
      var constructor = prototype.constructor;
      var indices = extract(expression);

      var args = identifiers.slice(0);
      args[0] = '$_0'; 

      // if ("development" === 'development') {
      //   lines.push('try {');
      // } 

      for (i = 0; i < indices.length; i += 2) {
        if (indices[i+1] < 0) { continue; }
        var piece = expression.slice(indices[i] + expanded, indices[i+1] + expanded);
        if (JS_KEYWORD_MAP.hasOwnProperty(piece)) {
          continue;
        }
        var path = Path.parse(piece);
        // var k = identifiers.indexOf(path[0]);
        if (identifiers.indexOf(path[0]) >= 0) {
          paths.push(piece);
        } else if (path[0] in prototype) {
          expression = expression.slice(0, indices[i] + expanded) + 'this.' + piece + expression.slice(indices[i+1] + expanded);
          paths.push('this.' + piece);
          expanded += 5;
        } /*else if (path[0] in resources) {
          expression = expression.slice(0, indices[i] + expanded) + 'this.R.' + piece + expression.slice(indices[i+1] + expanded);
          paths.push('this.R.' + piece);
          expanded += 7;
        } else if (path[0] in resources) {
          lines.push('  var ' + path[0] + ' = this.res("' + path[0] + '");')
        } */ else if (path[0] in resources) {
          // lines.push('  var ' + path[0] + ' = this.$res("' + path[0] + '");'); // from local resources or global
          lines.push('  var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
        }
      }

      lines.push('  return ' + expression);

      // if ("development" === 'development') {
      //   lines.push('} catch (e) {');
      //   lines.push('  console.warn("[EXTAG WARN] The expression `' + 
      //               expr.replace(/('|")/g, '\\$1') + 
      //               '` may be illegal in the template of Component `' + 
      //               (constructor.fullName || constructor.name) + 
      //               '`");');
      //   lines.push('  throw e;')
      //   lines.push('}');
      // } 
    
      args.push(lines.join('\n'));
    
      try {
        var func = Function.apply(null, args);
        return new Evaluator({
          func: func,
          // expr: expr,
          paths: paths,
          identifiers: identifiers
        });
      } catch (e) {
        { 
          logger.warn('Illegal expression `' + expr + '` in the template of Component ' + (constructor.fullName || constructor.name));
        }
        throw(e);
      }
      
      
      
    }
  };

  // src/core/template/parsers/PrimaryLiteralParser.js

  var PrimaryLiteralParser = {
    tryParse: function tryParse(expr) {
      if (expr === 'false') {
        return false;
      }
      if (expr === 'true') {
        return true;
      }
      if (!isNaN(expr)) {
        return Number(expr);
      }
    }
  };

  // src/core/template/parsers/DataBindingParser.js

  var DATA_BINDING_MODES = DataBinding.MODES;

  function collectPaths(evaluator, collection) {
    var paths = evaluator.paths;
    for (var i = 0; i < paths.length; ++i) {
      if (collection.indexOf(paths[i]) < 0) {
        collection.push(paths[i]);
      }
    }
  }

  var DataBindingParser = {
    /**
     *
     * @param {string} expression
     * @param {Object} prototype
     * @param {Array} identifiers
     * @returns {*}
     */
    parse: function parse(expression, prototype, identifiers) {
      var mode = -1, paths = [], n = expression.length, i;

      if (expression[0] === BINDING_OPERATORS.TWO_WAY) {              // <text-box model@="@text"/>
        mode = DATA_BINDING_MODES.TWO_WAY;
        expression = expression.slice(1, n); 
      } else if (expression[0] === BINDING_OPERATORS.ANY_WAY) {       // <h1 title@="^title">@{^title}</h1>
        mode = DATA_BINDING_MODES.ANY_WAY;
        expression = expression.slice(1, n);
      } else if (expression[n-1] === BINDING_OPERATORS.ASSIGN) {      // <h1 title@="title!">@{title!}</h1>
        mode = DATA_BINDING_MODES.ASSIGN;
        expression = expression.slice(0, n-1);
      } else if (expression[n-1] === BINDING_OPERATORS.ONE_TIME) {    // <div x-type="Panel" x-once@="showPanel?"></div>
        mode = DATA_BINDING_MODES.ONE_TIME;
        expression = expression.slice(0, n-1);
      } else {                                                  // <h1 title@="title">@{title}</h1>
        mode = DATA_BINDING_MODES.ONE_WAY;
      }

      var pieces = expression.indexOf(BINDING_OPERATORS.CONVERTER) < 0 ? 
                    [expression] : expression.split(BINDING_OPERATORS.CONVERTER); // EvaluatorParser.splitExpr(expression);

      var evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);

      collectPaths(evaluator, paths);
      
      if (pieces.length > 1) {
        var converters;
        if (mode === DATA_BINDING_MODES.TWO_WAY) {
          if (pieces.length > 2) {
            logger.warn(('Only one two-way converter is supported in two-way binding expression, but ' + (pieces.length - 1) + ' converters are detected in `' + expression + '`'));
            throw new Error('Invalid two-way binding expression `' + expression + '`');
          }
          piece = pieces[1].trim();
          if (!piece) {
            logger.warn('There is an empty converter in the expression `' + expression + '`');
            throw new Error('Converter must not be empty!');
          }
          // if (!/[$_\w]+\.call\(?/.test(piece)) {
            if (!/[\$\_\w]+\.exec\(?/.test(piece)) { // TODO:
            logger.warn('`' + piece + '` is not a valid two-way converter expression in `' + expression + '`');
            throw new Error('Invalid two-way binding converter `' + piece + '`');
          }
          index = piece.indexOf('.exec');
          var conv = piece.slice(0, index);
          index = piece.indexOf('(', index+5);
          var exec, back;
          if (index < 0) {
            conv = piece;
            exec = piece + '.exec($_0)';
            back = piece + '.back($_0)';
          } else {
            conv = piece;
            // exec = piece.replace(/\?\s*(\,|\))/, '$_0$1');
            // back = exec.replace(/\.\s*exec\s*\(/, '.back(');
            exec = piece + '.exec($_0,' + piece.slice(index+1);
            back = piece + '.back($_0,' + piece.slice(index+1);
          }
          var converter = Path.search(conv, prototype.constructor.resources);
          if (!converter) {
            logger.warn('Cannot find this converter named `' + conv + '`');
            throw new Error('Unknown converter named ' + conv);
          } else if (!converter.exec || !converter.back) {
            logger.warn('`' + conv + '` is not a valid two-way converter');
            throw new Error('Invalid two-way converter named `' + conv + '`');
          }
          converters = [ 
            EvaluatorParser.parse(exec, prototype, identifiers),
            EvaluatorParser.parse(back, prototype, identifiers)
          ];
          collectPaths(converters[0], paths);
        } else {
          for (i = 1; i < pieces.length; ++i) {
            var piece = pieces[i].trim();
            if (!piece) {
              logger.warn('There is an empty converter in the expression `' + expression + '`');
              throw new Error('Converter must not be empty!');
            }
            var index = piece.indexOf('(');
            if (index > 0) {
              // piece = piece.replace(/\?\s*(\,|\))/, '$_0$1');
              piece = piece.slice(0, index) + '($_0,' + piece.slice(index+1);
            } else {
              piece = piece + '($_0)';
            }
            converter = EvaluatorParser.parse(piece, prototype, identifiers);
            collectPaths(converter, paths);
            converters = converters || [];
            converters.push(converter);
          }
        }
      }

      return {
        // type: DataBinding,
        mode: mode,
        // event: event,
        paths: paths,
        evaluator: evaluator,
        converters: converters,
        identifiers: identifiers
      }
    }
  };

  // src/core/template/parsers/FragmentBindingParser.js

  var BINDING_LIKE_REGEXP = new RegExp(
    BINDING_OPERATORS.DATA +'\\' + ONE_WAY_BINDING_BRACKETS[0] + '.*?\\' + ONE_WAY_BINDING_BRACKETS[1]
  );

  var FragmentBindingParser = {
    like: function like(expression) {
      return BINDING_LIKE_REGEXP.test(expression);
    },

    parse: function(expression, prototype, identifiers) {
      var i, n, template = [], start = 0, stop;
      var b0, b1, b2, ct = 0, cc, cb;

      for (i = 0, n = expression.length; i < n; ++i) {
        cb = cc;
        cc = expression.charCodeAt(i);
        if (b2) {
          if (cc === 125 && !b0 && !b1) { // }
            --ct;
            if (ct === 0) {
              if (start < stop) {
                template.push(expression.slice(start, stop));
              }
              template.push(
                // DataBindingParser.parse(expression.slice(stop+2, i), prototype, identifiers)
                Expression.create(DataBinding, DataBindingParser.parse(expression.slice(stop+2, i), prototype, identifiers))
              );
              start = stop = i + 1;
              b2 = false;
            }
          } else if (cc === 39) {
            if (!b0) b0 = true; 
            else if (cb !== 92) b0 = false; // 92: \
          } else if (cc === 34) {
            if (!b1) b1 = true; 
            else if (cb !== 92) b1 = false; // 92: \
          } else if (cc === 123 && !b0 && !b1) {
            ++ct;
          } 
        } else if (cb === 64 && cc === 123) { // @{
          b2 = true;
          stop = i-1; 
          ct = 1;
        }
      }

      if (0 < start && start < n) {
        template.push(expression.slice(start, n));
      }
      
      return template.length ? template : null;
    }
  };

  // src/core/template/parsers/ClassStyleParser.js

  var ClassStyleParser = {
    /**
     * 
     * @param {string} expression 
     * @param {Object} prototype 
     * @param {Array} identifiers 
     * @param {boolean} camelCase  using camel case for x:style="...", not for x:calss="..."
     */
    parse: function parse(expression, prototype, identifiers, viewEngine, camelCase) {
      var group = {};
      var pieces = expression.split(/;/g); // as constant
      var operator, result, piece, expr, name, names, m, n, i, j;
      // var viewEngine = config.get(VIEW_ENGINE);
      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i].trim();
        m = piece.indexOf(':');
        
        if (m < 0) {
          if (piece) {
            // extact a and b from x:class="a b; c@: c;"
            names = piece.split(/\s+/);
            for (j = 0; j < names.length; ++j) {
              group[names[j]] = true;
            }
          }
          continue;
        } 
    
        name = piece.slice(0, m).trim();
        expr = piece.slice(m + 1).trim();
    
        if (camelCase) {
          name = viewEngine.toCamelCase(name);
        }
    
        m = name.length;
        operator = name[m-1];

        switch (operator) {
          case '@':
            if (m <= 1) { continue; }
            result = PrimaryLiteralParser.tryParse(expr);
            if (result != null) {
              group[name.slice(0, m-1)] = result;
            } else {
              result = DataBindingParser.parse(expr, prototype, identifiers);
              group[name.slice(0, m-1)] = Expression.create(DataBinding, result);
            }
            break;
          case '#':
            if (m <= 1) { continue; }
            result = FragmentBindingParser.parse(expr, prototype, identifiers);
            if (result) {
              result.asStr = true;
              group[name.slice(0, m-1)] = Expression.create(FragmentBinding, result);
            } else {
              group[name.slice(0, m-1)] = expr;
            }
            break;
          default:
            if (name) {
              group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
            }
        }
      }

      return group;
    }
  };

  // src/core/template/parsers/EventBindingParser.js

  // var CONVERTER_OPERATOR = BINDING_OPERATORS.CONVERTER;
  var CONTEXT_REGEXP = new RegExp('^' + CONTEXT_SYMBOL + '\\.');
  var HANDLER_REGEXP = new RegExp('^(' + CONTEXT_SYMBOL + '\\.)?[\\w\\$\\_]+$');
  // var ONE_WAY_BINDING_BRACKETS = config.ONE_WAY_BINDING_BRACKETS;

  var EventBindingParser = {
    /**
     * e.g. click+="close() ::once::stop" change+="this.onClick"
     */
    parse: function parse(expression, prototype, identifiers) {
      var pieces = expression.indexOf(BINDING_OPERATORS.MODIFIER) < 0 ? 
                    [expression] : expression.split(BINDING_OPERATORS.MODIFIER); // EvaluatorParser.splitExpr(expression);

      pieces[0] = pieces[0].trim();

      var template = {};

      if (HANDLER_REGEXP.test(pieces[0])) {
        template.handler = pieces[0].replace(CONTEXT_REGEXP, ''); // TODO:
      }  else {
        template.identifiers = identifiers;//.concat(['event']);
        template.evaluator = EvaluatorParser.parse(pieces[0], prototype, template.identifiers);
      }

      if (pieces.length > 1) {
        var modifiers = [];
        for (var i = 1; i < pieces.length; ++i) {
          modifiers.push(pieces[i].trim());
        }
        template.modifiers = modifiers;
      }

      return template;//Expression.create(EventBinding, template);
    }
  };

  // src/core/template/parsers/HTMXParser.js

  // var TAGNAME_STOP = /[\s\/>]/
  // var FOR_LOOP_REGEXP = /^(([\_\$\w]+)|(\[\s*(\w+),\s*(\w+)\s*\]))\s+of\s+(.+)$/;
  var FOR_LOOP_REGEXP = /^([\_\$\w]+)\s+of\s+(.+)$/;
  var LETTER_REGEXP = /[a-z]/i;
  var TAGNAME_STOP = /[\s\/>]/;

  var viewEngine = null;

  var SELF_CLOSING_TAGS = {
    '!': true,
  	br: true,
  	hr: true,
  	area: true,
  	base: true,
  	img: true,
  	input: true,
  	link: true,
  	meta: true,
  	basefont: true,
  	param: true,
  	col: true,
  	frame: true,
  	embed: true,
  	keygen: true,
  	source: true,
  	command: true,
  	track: true,
  	wbr: true
  };

  var DIRECTIVES = {
    'x:ns': true,
    'x:if': true,
    'x:for': true,
    'x:key': true,
    'x:name': true,
    'x:type': true,
    // 'x:attrs': true,
    'x:class': true,
    'x:style': true
  };

  function getGroup(node, name) {
    var group = node[name];
    if (group == null) {
      node[name] = group = {};
    }
    return group;
  }

  function isDirective(name) {
    return name.charCodeAt(0) === 120 && (name in DIRECTIVES);
  }

  function isSelfClosingTag(tagName) {
    return SELF_CLOSING_TAGS.hasOwnProperty(tagName);
  }

  function parseDirective(name, expr, node, prototype, identifiers) {
    var result;// = getGroup(node, 'directs');
    if (name === 'x:class') {
      node.classes = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, false);
    } else if (name === 'x:style') {
      node.style = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, true);
    } else if (name === 'x:type') {
      var ctor = Path.search(expr, prototype.constructor.resources);
      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        {
          logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in local resources or global RES.');
        }
        throw new TypeError('Can not find such component type `' + expr + '`');
      }
      // _directs.xType = ctor;
      node.type = ctor;
    } else if (name === 'x:name') {
      node.name = expr;
    } else if (name === 'x:key') {
      getGroup(node, 'ctrls').xKey = EvaluatorParser.parse(expr, prototype, identifiers);
    } else if (name === 'x:for') {
      var matches = expr.trim().match(FOR_LOOP_REGEXP);

      if (!matches || !matches[2].trim()) {
        // throw new Error('x:for="' + expr + '" is illegal');
        logger.warn('Illegal x:for="' + expr + '"');
        return;
      }

      // if (matches[6].lastIndexOf('::') < 0) {
      //   matches[6] += '::[].slice(0)';
      // }

      // var expression = DataBindingParser.parse('{' + matches[2] + '}', prototype, resources, identifiers);
      result = DataBindingParser.parse(matches[2], prototype, identifiers);

      if (result) {
        getGroup(node, 'ctrls').xFor = Expression.create(DataBinding, result);
      } else {
        logger.warn('Illegal x:for="' + expr + '"');
        return;
      }

      node.identifiers = identifiers.concat([matches[1]]);
    } else if (name === 'x:for') {
      var matches = expr.trim().match(FOR_LOOP_REGEXP);

      if (!matches || !matches[6].trim()) {
        // throw new Error('x:for="' + expr + '" is illegal');
        logger.warn('Illegal x:for="' + expr + '"');
        return;
      }

      // if (matches[6].lastIndexOf('::') < 0) {
      //   matches[6] += '::[].slice(0)';
      // }

      // var expression = DataBindingParser.parse('{' + matches[2] + '}', prototype, resources, identifiers);
      result = DataBindingParser.parse(matches[6], prototype, identifiers);

      if (result) {
        getGroup(node, 'ctrls').xFor = Expression.create(DataBinding, result);
      } else {
        logger.warn('Illegal x:for="' + expr + '"');
        return;
      }

      if (matches[2]) {
        identifiers = identifiers.concat(['$_' + identifiers.length, matches[2]]);
      } else {
        identifiers = identifiers.concat([matches[4], matches[5]]);
      }
      node.identifiers = identifiers;
    } else if (name === 'x:if') {
      result = DataBindingParser.parse(expr, prototype, identifiers);
      if (result) {
        getGroup(node, 'ctrls').xIf = Expression.create(DataBinding, result);
      }
    } else if (name === 'x:ns') {
      node.ns = expr;
    }
  }

  function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
    var lastChar = attrName[attrName.length - 1];
    var result, group, key;

    if (lastChar === '+') {
      group = getGroup(node, 'actions');
      key = viewEngine.toCamelCase(attrName.slice(0, -1));
      result = EventBindingParser.parse(attrValue, prototype, identifiers);
      group[key] = Expression.create(EventBinding, result);
    } else {
      group = attrName.indexOf(':') < 0 ? getGroup(node, 'props') : getGroup(node, 'attrs');
      switch (lastChar) {
        case '@':
          key = viewEngine.toCamelCase(attrName.slice(0, -1));
          result = PrimaryLiteralParser.tryParse(attrValue);
          if (result != null) {
            group[key] = result;
          } else {
            result = DataBindingParser.parse(attrValue, prototype, identifiers);
            group[key] = Expression.create(DataBinding, result);
          }
          break;
        case '#': 
          key = viewEngine.toCamelCase(attrName.slice(0, -1));
          result = FragmentBindingParser.parse(attrValue, prototype, identifiers);
          if (result) {
            result.asStr = true;
            group[key] = Expression.create(FragmentBinding, result);
          } else {
            group[key] = attrValue;
          }
          break;
        // case '+':
        //   name = viewEngine.toCamelCase(attrName.slice(0, -1));
        //   result = EventBindingParser.parse(attrValue, prototype, identifiers);
        //   getGroup(node, 'actions')[name] = Expression.create(EventBinding, result);
        //   break;
        default:
          key = viewEngine.toCamelCase(attrName);
          group[key] = viewEngine.isBoolProp(key) || attrValue;
          break;
      }
    }
  }

  function getStopOf(regex, htmx, from) {
    var end = htmx.length, idx = from;
    while (idx < end) {
      if (regex.test(htmx[idx])) {
        return idx;
      }
      idx = idx + 1;
    }
    return -1;
  }

  function parseAttributes(htmx, from, node, prototype, identifiers) {
    var idx = from, start = from, stop = from, end = htmx.length;
    var cc, attrName, attrNames;//, operator, attributes = [];
  	while (idx < end) {
      cc = htmx[idx];
      if (attrName) {
        if (!/\s/.test(cc)) {
          if (cc === '"' || cc === "'") {
            start = idx + 1;
            stop = htmx.indexOf(cc, start);
          } else {
            start = idx;
            stop = getStopOf(TAGNAME_STOP, htmx, start);
          }

          stop = stop > 0 ? stop : end;

          if (node) {
            if (isDirective(attrName)) {
              parseDirective(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
            } else {
              parseAttribute(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
            }
          }

          if (htmx[stop] === '>') {
            return stop;
          }

          attrName = null;
          idx = stop + 1;
          start = stop = idx;
          continue;
        }
      } else if (cc === '>') {
        stop = idx;
        if (start < stop) {
          attrNames = htmx.slice(start, stop).trim().split(/\s+/);
          while(attrNames.length > 0) {
            attrName = attrNames.shift();
            if (attrName && node) {
              getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = true;
            }
          }
        }
        return stop;
      } else if (cc === '=') {
        stop = idx;
        if (start < stop) {
          attrNames = htmx.slice(start, stop).trim().split(/\s+/);
          while(attrNames.length > 1) {
            attrName = attrNames.shift();
            if (attrName && node) {
              getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = true;
            }
          }
          attrName = attrNames.shift();
        }
        idx = stop + 1;
        start = stop = idx;
        continue;
      }
      idx = idx + 1;
    }
  }

  function parseTextNode(text, parent, prototype, identifiers) {
    var children = parent.children || [];

    if (FragmentBindingParser.like(text)) {
      var result = FragmentBindingParser.parse(text, prototype, identifiers);
      if (result) {
        children.push(Expression.create(FragmentBinding, result));
      } else {
        children.push(text);
      }
    } else {
      children.push(text);
    }

    parent.children = children;
  }

  function parseHTMX(htmx, prototype) {
    var cc, nc;
    var node, tagName;
    // var range = [0, 0];
    var start = 0, stop = 0;
    var parent, parents = [];
    var idx = 0, end = htmx.length;

    // if (htmx[0] !== '<' || htmx[end-1] !== '>' || !LETTER_REGEXP.test(htmx[1])) {
    //   throw new Error('');
    // }

    parent = {
      tag: '[]',
      children: [],
      identifiers: [CONTEXT_SYMBOL] // ['this']
    };
    parents.push(parent);

    while (idx < end) {
      cc = htmx[idx];
      if (cc === '<') {
        nc = htmx[idx + 1];
        if (LETTER_REGEXP.test(nc)) {
          if (start < idx) {
            parseTextNode(decodeHTML(htmx.slice(start, idx)), parent, prototype, parent.identifiers);
          }

          start = idx + 1;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
          tagName = htmx.slice(start, stop);
     
          node = {};
          node.tag = tagName;
          node.__extag__node__ = true;

          {
            node.range = [start, -1];
          }
          
          node.identifiers = parent.identifiers;
          

          // console.log('start tag: ' + tagName)

          if ('>' !== htmx[stop]) {
            start = stop = stop + 1;
            stop = parseAttributes(htmx, start, node, prototype, node.identifiers);
          }

          if (!node.ns) {
            if (node.props && node.props.xmlns) {
              node.ns = viewEngine.toNameSpace(node.props.xmlns);
            } else if (parent.ns) {
              node.ns = parent.ns;
            }
          }
          if (node.type == null && /^A-Z/.test(tagName)) {
            // var type, ctor;
            // if (tagName.indexOf('-') < 0) {
            //   type = tagName;
            // } else {
            //   type = viewEngine.toCamelCase(tagName);
            //   type = type[0].toUpperCase() + type.slice(1);
            // }
            var ctor = Path.search(type, prototype.constructor.resources);
            if (typeof ctor === 'function' && ctor.__extag_component_class__) {
              node.type = ctor;
            }
          }
          if (node.type == null) {
            switch (tagName) {
              case 'x:slot':
                node.type = Slot;
                break;
              case 'x:view':
                node.type = View;
                break;
              case 'x:block':
                node.type = Block;
                break;
            }
          }
          
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
          
          if (htmx[stop - 1] !== '/' && !isSelfClosingTag(tagName)) {
            parents.push(node);
            parent = node;
          }

          {
            node.range[1] = stop;
          }

          idx = stop + 1;
          start = stop = idx;
          continue;
        } else if ('/' === nc && LETTER_REGEXP.test(htmx[idx + 2])) {
          if (start < idx) {
            parseTextNode(decodeHTML(htmx.slice(start, idx)), parent, prototype, parent.identifiers);
          }

          start = idx + 2;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
          tagName = htmx.slice(start, stop);
          // console.log('end tag: ' + htmx.slice(start, stop))
          if (tagName !== parent.tag) {
            throw new Error('Unclosed tag ' + parent.tag);
          }

          if ('>' !== htmx[stop]) {
            start = stop = stop + 1;
            stop = parseAttributes(htmx, start);
          }

          // start = stop = stop + 1;

          if (parents.length > 1) {
            parents.pop();
          } else {
            if (stop < end) {
              throw new Error('');
            }
            return parents[0];
          }

          if (parents.length > 0) {
            parent = parents[parents.length - 1];
          } 

          idx = stop + 1;
          start = stop = idx;
          continue;
        } else if ('!' === nc && '<!--' === htmx.slice(idx, idx + 4)) {
          start = idx + 4;
          // stop = idx + 4;
          // node = parseComment(htmx, range);
          stop = htmx.indexOf('-->', start);
          stop = stop > 0 ? stop : htmx.length;
          node =  {
            tag: '!',
            comment: htmx.slice(start, stop)
          };
          parent.children = parent.children || [];
          parent.children.push(node);
          idx = stop + 3;
          start = stop = idx;
          continue;
        }
      }

      idx = idx + 1;
    }

    if (start < end) {
      parseTextNode(decodeHTML(htmx.slice(start, end)), parent, prototype, parent.identifiers);
    }

    // if (parent) {
    //   throw new Error('Unclosed tag ' + parent.tagName);
    // }

    return parents;
  }

  var HTMXParser = {
    parse: function(htmx, prototype) {
      viewEngine = viewEngine ||config.get(VIEW_ENGINE);

      var constructor = prototype.constructor;
      var nodes = parseHTMX(htmx.trim(), prototype);
      var children = nodes[0].children;
      var root = children[0];
      if (children.length !== 1) {
        logger.warn('The template of Component ' + (constructor.fullName || constructor.name) + ' must have only one root tag.');
        throw new Error('')
      }
      if (root.tag === '!' || root.tag === '#') {
        logger.warn('Component template root tag must be a DOM element.');
        throw new Error('')
      }
      if (root.type) {
        logger.warn('Do not use a component as the template root tag.');
        throw new Error('')
      }
      return root;//children.length == 1 ? children[0] : nodes[0];
    }
  };

  config.HTMXParser = HTMXParser;

  // src/Extag.js 


  if (typeof window !== 'undefined' && window.ExtagDom) {
    config.set('view-engine', ExtagDom);
  }

  // RES.register('XSlot', Slot);

  var Extag = {
    anew: Generator.anew,
    inst: Generator.inst,

    conf: function(key, val) {
      if (arguments.length === 1) {
        return config.get(key);
      }
      config.set(key, val);
    },
    // config: config,

    // functions
    // help: help, 
    // defineProp: defineProp, 
    defineClass: defineClass, 
    // setImmediate: setImmediate,
    // slice: slice,
    // encodeHTML: encodeHTML,
    // decodeHTML: decodeHTML,

    // base
    // Accessor: Accessor,
    // DirtyMarker: DirtyMarker,
    // Evaluator: Evaluator,
    // Expression: Expression,
    // Generator: Generator,
    // Parent: Parent,
    // Path: Path,
    // RES: RES,
    // Schedule: Schedule,
    Validator: Validator,
    Watcher: Watcher, 
    

    // models
    // List: List,
    Store: Store,
    Cache: Cache,
    // Collection: Collection, 
    
    // shells
    // Shell: Shell,
    //
    Slot: Slot,
    Text: Text, 
    Element: Element, 
    // Fragment: Fragment,
    Component: Component,

    // bindings
    // Binding: Binding,
    // DataBinding: DataBinding,
    // TextBinding: TextBinding,
    // EventBinding: EventBinding,

    // parsers
    // HTMLParser: HTMLParser,
    // HTMXParser: HTMXParser,
    // EvaluatorParser: EvaluatorParser,
    // DataBindingParser: DataBindingParser,
    // TextBindingParser: TextBindingParser,
    // EventBindingParser: EventBindingParser,

    // JSXEngine: JSXEngine,
    // HTMXEngine: HTMXEngine,
    node: JSXEngine.node,
    // slot: JSXEngine.slot,
    reflow: JSXEngine.reflow,

    copy: copy,

    attach: function(shell, $skin, sync) {
      shell.attach($skin);
      if (sync) {
        Schedule.flushQueues();
      }
    },
    
    version: "0.1.0"
  };

  return Extag;

}));
