/**
 * Extag v0.2.1
 * (c) enjolras.chen
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Extag = factory());
}(this, (function () { 'use strict';

  // src/base/Path.js

  // var PATH_DELIMITER = /\[|\]?\./;
  var PATH_DELIMITER_1 = /\./;
  var PATH_DELIMITER_2 = /(\]\.)|\.|\[|\]/g;
  var PATH_REGEXP_1 = /^[$_A-Z][$_A-Z0-9]*(\.[$_A-Z0-9]+)*$/i;
  var PATH_REGEXP_2 = /^[$_A-Z][$_A-Z0-9]*((\[\d+\])|(\.[$_A-Z0-9]+))*$/i;

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
    test: function(text) {
      return PATH_REGEXP_1.test(text);
    },
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
     * Search the resource in local, then in global if necessary.
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
          // eslint-disable-next-line no-undef
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

  var hasOwnProp = Object.prototype.hasOwnProperty;

  function Helper(target) {
    this.target = target;
  }

  Helper.prototype.bind = function() {
    var name, method, target = this.target;
    for (var i = 0; i < arguments.length; ++i) {
      name = arguments[i];
      method = target[name];
      if (typeof method === 'function') {
        target[name] = method.bind(target);
      }
    }
  };

  function help(target) {
    return new Helper(target);
  }

  var assign = Object.assign || function assign(target/*,..sources*/) {
    if (target == null) {
      throw  new TypeError('Cannot convert undefined or null to object');
    }

    if (!(target instanceof Object)) {
     var type = typeof target;
    
     if (type === 'number') {
       target = new Number(target);
     } else if (type === 'string') {
       target = new String(target);
     } else if (type === 'boolean') {
       target = new Boolean(target);
     }
    }

    var source, key, i, n = arguments.length;

    for (i = 1; i < n; ++i) {
      source = arguments[i];

      if (!(source instanceof Object)) {
        continue;
      }

      for (key in source) {
        if (hasOwnProp.call(source, key)) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
      }
    }

    return target;
  };

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

        while ((callback = cbs.pop())) {
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
    config['JS_ENV'] = '>=ES5'; // not use config.env
    defineProp = Object.defineProperty;
    defineProp({}, 'x', {get: function() {}});
  } catch (e) {
    config['JS_ENV'] = '<ES5'; // not use config.env
    defineProp = function defineProp(target, property, descriptor) {
      target[property] = descriptor.value;
    };
  }

  function defineProps(target, sources) {
    var i, n, source;
    for (i = 0, n = sources.length; i < n; ++i) {
      source = sources[i];
      for (var key in source) {
        if (hasOwnProp.call(source, key)) {
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
    if (hasOwnProp.call(proto, 'extends')) {
      superClass = proto.extends;

      if (typeof superClass !== 'function') {
        throw new TypeError('superClass must be a function');
      }
    } else {
      superClass = Object;
    }

    // subClass
    if (hasOwnProp.call(proto, 'constructor')) {
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

  var HTML_CHAR_ENTITY_REGEXP = /&[\w#]{2,6};/;
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
      return  text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
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
    
      return  html.replace(/&nbsp;/g, String.fromCharCode(160))
                  .replace(/&quot;/g, '"')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&');
    };
  }

  function throwError(err, opts) {
    var error = err instanceof Error ? err : new Error(err);
    if (opts) {
      assign(error, opts);
    }
    throw error;
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
  var CONTEXT_SYMBOL = 'this';
  var BINDING_FORMAT = '@{0}';
  var BINDING_BRACKETS = '{}';
  var BINDING_OPERATORS = {
    DATA: '@', 
    TEXT: '#', 
    EVENT: '+', 
    MODIFIER: '::',
    CONVERTER: '|=', 
    // SCOPE_EVENT: '@', 
    ASSIGN: '!',
    TWO_WAY: '@',  
    ANY_WAY: '^', 
    ONE_TIME: '?'
  };

  // regex
  var WHITE_SPACES_REGEXP = /\s+/;
  var WHITE_SPACE_REGEXP = /\s/g;
  var CAPITAL_REGEXP = /^[A-Z]/;
  var CONTEXT_REGEXP = /^this\./;
  var HANDLER_REGEXP = /^(this\.)?[\w$_]+$/;

  // src/base/Parent.js

  /**
   * Construct a parent like array.
   * @class
   * @constructor
   */
  function Parent() {
    throwError('Parent is a base class and can not be instantiated!');
  }

  function findParent(shell) {
    var temp = shell._parent;
    while (temp && temp.$type === 0) {
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
      if (child.$type === 0) {
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

    getParent: function (actual) {
      return actual ? findParent(this) : this._parent;
    },

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
      var i;
      var _children = this._children;
      var n = children ? children.length : 0;
      var m = _children ? _children.length : 0;

      if (m === n) {
        for (i = 0; i < n; ++i) {
          if (_children[i] !== children[i]) {
            break;
          }
        }
        if (i === n) { // nothing change
          return this;
        }
      }
   
      if (m) {
        for (i = 0; i < m; ++i) {
          _children[i]._parent = null;
        }
        _children.length = 0;
      }
      if (n) {
        for (i = 0; i < n; ++i) {
          this.insertChild(children[i], null);
        }
      } else if (m) {
        this.invalidate(FLAG_CHANGED_CHILDREN);
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
        throwError('The new child to be inserted into this parent must not be null!');
      }
      // if (child.$guid <= this.$guid) {
      //   throwError('The child must be created after its parent for rendering top-down (parent to child)!')
      // }
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
          throwError('The child before which the new child is to be inserted is not a child of this parent!');
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
        throwError('The new child to be removed from this parent must not be null!');
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
        throwError('The child to be removed is not a child of this parent!');
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
        throwError('The new child to be inserted into this parent must not be null!');
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
        throwError('The child to be replaced is not a child of this parent!');
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
        // event.dispatcher = watcher;
        var handler, handlers = action.handlers;

        for (var i = 0, n = handlers.length; i < n; ++i) {
          handler = handlers[i];
          if (handler
                && equalCapture(flag, handler.flag)) {
            if (handler.flag & 4) { // once: 0b1xx
              this.off(type, handler.func, handler.flag ? flag2opts(handler.flag) : null);
            }
            handler.func.apply(null, slice(arguments, 1));
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

  // src/share/logger.js 

  function log(fn, args, prefix) {
    args = slice(args, 0);
    // args.unshift(prefix);
    args[0] = prefix + ' ' + args[0];
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
          case 1:
            return new ctor(args[0]);
          case 2:
            return new ctor(args[0], args[1]);
          case 3:
            return new ctor(args[0], args[1], args[2]);
          case 4:
            return new ctor(args[0], args[1], args[2], args[3]);
          case 5:
            return new ctor(args[0], args[1], args[2], args[3], args[4]);
          default:
            // eslint-disable-next-line no-undef
            {
              logger.warn('Sorry but `anew` only supports 6 argumnets at most. Using `inst` instead.');
            }
            throw new Error('`anew` arguments length must not exceed 6.');
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
    if (!hasOwnProp.call(getters, key)) {
      getters[key] = function() {
        return this.get(key);
      };
    }
    return getters[key];
  }

  function makeSetter(key) {
    if (!hasOwnProp.call(setters, key)) {
      setters[key] = function(val) {
        this.set(key, val);
      };
    }
    return setters[key];
  }

  var EMPTY_DESC = {};
  var SHARED_GET = function(key, props) { return props[key]; };

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
        if (hasOwnProp.call(descriptors, key)) {
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
    if (hasOwnProp.call(prototype, '__extag_descriptors__')) {
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
      if (hasOwnProp.call(descriptors, key) /*&& !prototype.hasOwnProperty(key)*/) {
        if ((key in prototype) && !override) {
          // eslint-disable-next-line no-undef
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

    // eslint-disable-next-line no-unused-vars
    get: function get(key) {
      throw new Error('Method `get` must be implemented by sub-class');
    },

    // eslint-disable-next-line no-unused-vars
    set: function set(key, value) {
      throw new Error('Method `set` must be implemented by sub-class');
    },

    assign: function assign(props) {
      for (var key in props) {
        if (hasOwnProp.call(props, key)) {
          this.set(key, props[key]);
        }
      }
      // return this;
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
      // eslint-disable-next-line no-undef
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
      // eslint-disable-next-line no-undef
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
        if (desc.required && (!props || !hasOwnProp.call(props, key))) {
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
      return _dirty ? (key == null || hasOwnProp.call(_dirty, key)) : false;
    }
  });

  /* eslint-disable no-unused-vars */

  var updateQueue = []; 
    var renderQueue = [];
    var callbackQueue = [];
    var updateQueueCursor = 0;
    var renderQueueCursor = 0;
    var turn = 0;
    // var 
    var waiting = false;
    var updating = false;
    var rendering = false;

    function flushQueues() {
      if (updating || !waiting) {
        return;
      }
      try {
        turn++;
        updating = true;
        updateQueueCursor = 0;

        var shell, i, n;
      
        // quene may be lengthen if the method `invalidate` is called when updating
        while (updateQueueCursor < updateQueue.length) {
          // if (updateQueueCursor > 999) {
          //   throw new Error('too much things to update');
          // }
          shell = updateQueue[updateQueueCursor];
          // try {
            shell.update();
          // } catch (e) {
          //   logger.error(e);
          // }
          ++updateQueueCursor;
        }
      
        
        updateQueue.length = 0;
        updateQueueCursor = 0;
        updating = false;
        waiting = false;
      
        rendering = true;
        renderQueueCursor = 0;
        while (renderQueueCursor < renderQueue.length) {
          // if (updateQueueCursor > 999) {
          //   throw new Error('too much things to update');
          // }
          shell = renderQueue[renderQueueCursor];
          // try {
            shell.render();
          // } catch (e) {
          //   logger.error(e);
          // }
          ++renderQueueCursor;
        }
      
        renderQueue.length = 0;
        renderQueueCursor = 0;
        rendering = false;
      
        for (i = callbackQueue.length - 1; i >= 0; --i) {
          // try {
            callbackQueue[i]();
          // } catch (e) {
          //   logger.error(e);
          // }
        }

        callbackQueue.length = 0;
      } catch (e) {
        updateQueueCursor = 0;
        renderQueueCursor = 0;
        updateQueue.length = 0;
        renderQueue.length = 0;
        callbackQueue.length = 0;
        rendering = false;
        updating = false;
        waiting = false;
        throw e;
      }
    }

  /**
   * Insert a shell into the updateQueue for updating accoring to its guid.
   * In order to rendering top-down (parent to child), 
   * parent's guid must be less than its children's. 
   * Indeed, component template engine obeys this rule. 
   * If you do not obey this rule when creating elements and component manually by yourself, 
   * rendering maybe wrong.
   * @param {Shell} shell
   */
  function insertUpdateQueue(shell) {
    var i, n = updateQueue.length, id = shell.$guid;

    if (!updating) {
      i = n - 1;
      while (i >= 0 && id < updateQueue[i].$guid) {
        --i;
      }
      ++i;
    } else { // the method `invalidate` maybe called when updating
      i = updateQueueCursor + 1;
      // if (id < updateQueue[updateQueueCursor].$guid) {
      //   if ("development" === 'development') {
      //     logger.warn('Do not change properties or emit event to parent component on updating.');
      //   }
      //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
      // }
      while (i < n && id >= updateQueue[i].$guid) {
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
      var i, n = renderQueue.length, id = shell.$guid;

      if (!rendering) {
        i = n - 1;
        while (i >= 0 && id < renderQueue[i].$guid) {
          --i;
        }
        ++i;
      } else {
        i = renderQueueCursor + 1;
        while (i < n && id >= renderQueue[i].$guid) {
          ++i;
        }
      }

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
    insertUpdateQueue: insertUpdateQueue,
    insertRenderQueue: insertRenderQueue,
    pushCallbackQueue: pushCallbackQueue
  };

  // src/core/Dependency.js

  // refer to Vue (https://vuejs.org/)
  var _binding;
  var _bindingStack = [];

  var Dependency = {
    binding: function() {
      return _binding != null;
    },
    begin: function begin(binding) {
      _binding = binding;
      _binding.execTimes = _binding.execTimes ? _binding.execTimes + 1 : 1;
      _binding.depsCountNew = 0;
      _binding.depsCountOld = 0;
      if (!_binding.deps) {
        _binding.deps = {};
      }
      _bindingStack.unshift(binding);
    },
    end: function end() {
      if (_binding == null) { return; }
      if (_binding.depsCountOld < _binding.depsCount) {
        var uid, dep;
        for (uid in _binding.deps) {
          dep = _binding.deps[uid];
          if (dep.cnt !== _binding.execTimes) {
            delete _binding.deps[uid];
            dep.src.off('changed.' + dep.key, _binding.invalidate);
          }
        }
      }
      _binding.depsCount = _binding.depsCountOld + _binding.depsCountNew;
      //
      _bindingStack.shift();
      _binding = _bindingStack[0];
    },
    add: function(src, key) {
      if (_binding == null) { return; }
      var uid = src.$guid + '.' + key;
      var dep = _binding.deps[uid];
      if (dep) {
        dep.cnt = _binding.execTimes;
        _binding.depsCountOld++;
      } else {
        src.on('changed.' + key, _binding.invalidate);
        _binding.depsCountNew++;
        _binding.deps[uid] = {
          src: src,
          key: key,
          cnt: _binding.execTimes
        };
      }
    },
    clean: function(binding) {
      var deps = binding.deps;
      if (!deps) { return; }
      var uid, dep;
      for (uid in deps) {
        dep = deps[uid];
        dep.src.off('changed.' + dep.key, binding.invalidate);
      }
      binding.deps = null;
    },
  };

  // src/core/models/Store.js

  var storeGuid = -1;

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
        var prototype = store.constructor.prototype;
        var attributes = store.constructor.attributes;

        // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
          Accessor.applyAttributeDescriptors(prototype, attributes, true); 
        // }

        // if (props) {
        //   Accessor.applyAttributeDescriptors(store, props, false); 
        // }

        var defaults = Accessor.getAttributeDefaultValues(store);

        defineProp(store, '$props', {
          value: defaults, writable: false, enumerable: false, configurable: true
        });

        defineProp(store, '$guid', {
          value: storeGuid--, writable: false, enumerable: false, configurable: true
        });

        if (this.setup) {
          this.setup();
        }

        // eslint-disable-next-line no-undef
        {
          Validator.validate0(store, props);
        }
    
        if (props) {
          Accessor.applyAttributeDescriptors(store, props, false);
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
      if (desc && desc.bindable) {
        // if (Dep.binding && !desc.compute) {
        //   Dep.add(this, key);
        // }
        if (Dependency.binding()) {
          Dependency.add(this, key);
        }
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
      var desc = Accessor.getAttrDesc(this, key);
      // usual property
      if (!desc) {
        // old = this[key];
        // if (old !== val) {
        //   this[key] = val;
        //   this.emit('changed.' + key, key, val, old);
        // }
        this[key] = val;
        return;
      }
      // validation in development 
      // eslint-disable-next-line no-undef
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
    defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
    defineProp(this, '_props', {value: {}/*, configurable: true*/});
  }

  defineClass({
    constructor: Cache, mixins: [Accessor.prototype, DirtyMarker.prototype],

    get: function(key) {
      return this._props[key];
    },

    set: function set(key, val) {
      var props = this._props;
      var old = props[key];
      if (val !== old) {
        props[key] = val;
        this._owner.invalidate(FLAG_CHANGED);
        DirtyMarker.check(this, key, val, old);
      }
    },

    reset: function(props) {
      var _props = this._props, key;
      if (_props) {
        for (key in _props) {
          if (!props || !(key in props)) {
            this.set(key, null);
          }
        }
      }
      if (props) {
        this.assign(props);
      }
    }
  });

  // src/core/shells/Shell.js

  var shellGuid = 0;//Number.MIN_VALUE;

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
      if (this.$type === 0) {
        return false;
      }
      
      var viewEngine = Shell.getViewEngine(this);
      // eslint-disable-next-line no-undef
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
          if (!hasOwnProp.call(actions, type)) { continue; }
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
      var constructor = this.constructor;
      return (constructor.fullName || constructor.name) + '<' + this.tag + '>(' + this.$guid + ')';
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
    cmd: function cmd(method/*, ...rest*/) {
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
        if (!hasOwnProp.call(shell, '_props')) {
          defineProp(shell, '_props', {
            value: {}, writable: false, enumerable: false, configurable: true
          });
        }

        defineProp(shell, '$flag', {
          value: 0, writable: true, enumerable: false, configurable: true
        });

        // defineProp(shell, '$symb', {
        //   value: '', writable: true, enumerable: false, configurable: true
        // });

        defineProp(shell, '$guid', {
          value: shellGuid++, writable: false, enumerable: false, configurable: true
        }); // should be less than Number.MAX_SAFE_INTEGER

        defineProp(shell, '$type', {
          value: type, writable: false, enumerable: false, configurable: true
        });

        defineProp(shell, 'tag', {
          value: tag, writable: false, enumerable: false, configurable: true
        });

        defineProp(shell, 'ns', {
          value: ns, writable: true, enumerable: false, configurable: true
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
        // eslint-disable-next-line no-undef
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
      // this.render();
      return true;
    },

    /**
     * Render the dirty parts of this shell to the attached skin 
     */
    render: function render() {
      // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0 || !this.$skin) {
      //   this.$flag = FLAG_NORMAL;
      //   return false;
      // }
      if (this.$flag === FLAG_NORMAL) {
        return false;
      }

      if (this.$skin) {
        var viewEngine = Shell.getViewEngine(this);
        // if (!viewEngine) { return this; }
        viewEngine.renderShell(this.$skin, this);
        DirtyMarker.clean(this);
      }

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
      return '"' + (data.length < 24 ? data : (data.slice(0, 21) + '...'))  + '"(' + this.$guid +')';
    }
  });

  // src/core/shells/Element.js


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
  function Element(tag, props, scopes, template) {
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
        {
          if (element.constructor !== Element) {
            throw new TypeError('Element is final class and can not be extended');
          }
        }

        Shell.initialize(element, 1, tag, ns);

        Element.defineMembers(element);

        if (scopes && template) ; else if (props) {
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
              if (!this._attrs/* && this.tag*/) {
                defineProp(this, '_attrs', {
                  value: new Cache(this), 
                  configurable: true
                });
              }
              return this._attrs;
            }//,
            // set: function(value) {
            //   resetCache(this.attrs, value);
            // }
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
            }//,
            // set: function(value) {
            //   resetCache(this.style, value);
            // }
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
      // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0 || !this.$skin) {
      //   this.$flag = FLAG_NORMAL;
      //   return false;
      // }

      if (this.$flag === FLAG_NORMAL) {
        return false;
      }

      if (this.$skin) {
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

  // src/core/shells/Fragment.js

  function Fragment(props, scopes, template) {
    Fragment.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Fragment, extends: Shell, mixins: [Parent.prototype],

    statics: {
      initialize: function initialize(fragment, props, scopes, template) {
        // eslint-disable-next-line no-undef
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

      // if (this.onUpdating) {
      //   this.onUpdating();
      // }

      if (this.scopes && this.hasDirty('contents')) {
        var JSXEngine = config.JSXEngine;
        var contents = this._props.contents || [];
        JSXEngine.reflow(this.scopes[0], this, contents);
      }

      if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
        if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
          var parent = this.getParent(true);
          parent.$flag |= FLAG_CHANGED_CHILDREN;
          if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
            parent.$flag |= FLAG_WAITING_TO_RENDER;
            Schedule.insertRenderQueue(parent);
          }
        }
        this.$flag |= FLAG_WAITING_TO_RENDER;
        Schedule.insertRenderQueue(this);
      }
      

      // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      //   if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
      //     // We should ask its parent to render parent's children, 
      //     // since its children are belong to its parent actually.
      //     // this._parent.invalidate(2); 
      //     // var parent = this._parent;
      //     // if ((parent.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      //     //   // parent.invalidate(FLAG_CHANGED_CHILDREN | FLAG_WAITING_TO_RENDER);
      //     //   parent.$flag |= FLAG_WAITING_TO_RENDER;
      //     //   parent.$flag |= FLAG_CHANGED_CHILDREN;
      //     //   // Schedule.insertRenderQueue(parent);
      //     //   parent.render();
      //     // }
      //     var parent = this.getParent(true);
      //     parent.invalidate(FLAG_CHANGED_CHILDREN);
      //   }
      //   this.$flag |= FLAG_WAITING_TO_RENDER;
      //   // Schedule.insertRenderQueue(this);
      //   this.render();
      // }

      // this.render();
      
      return true;
    },

    render: function render() {
      // if ((this.$flag & FLAG_WAITING_TO_RENDER) === 0) {
      //   this.$flag = FLAG_NORMAL;
      //   return false;
      // }
      if (this.$flag === FLAG_NORMAL) {
        return false;
      }
      this.$flag = FLAG_NORMAL;
      return true;
    }
  });

  // src/core/bindings/Binding.js

  function Binding(scope, target, property, collect, reflect) {
    this.sync = true;
    this.scope = scope;
    this.target = target;
    this.property = property;

    if (typeof collect === 'function') {
      this.invalidate = this.invalidate.bind(this);
      this.exec = this.exec.bind(this);
      this.collect = collect;
      this.flag = 1;
      this.exec();
      
      if (this.depsCount > 0) {
        Binding.record(target, this);
      }
      // var deps = this.deps;
      // var keys = Object.keys(deps);
      // if (deps && keys.length) {
      //   Binding.record(target, this);
      //   if (keys.length > 1) {
      //     this.sync = false;
      //     scope.on('updating', this.exec);
      //   }
      // }

      if (typeof reflect === 'function') {
        this.reflect = reflect;
        this.back = this.back.bind(this);
        target.on('changed.' + property, this.back);
      }
    }
  }

  defineClass({
    constructor: Binding,

    statics: {
      // assign: function assign(target, key, val, binding) {
      //   if (binding.locked) {
      //     return;
      //   }
      //   binding.locked = true;
      //   if (target.set) {
      //     target.set(key, val);
      //   } else {
      //     target[key] = val;
      //   }
      //   binding.locked = false;
      // },

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

      create: function(scope, target, property, collect, reflect) {
        return new Binding(scope, target, property, collect, reflect);
      },

      destroy: function(binding) {
        var target = binding.target, scope = binding.scope;

        if (typeof binding.reflect == 'function') {
          target.off('changed.' + binding.property, binding.back);
        }
        
        if (!binding.sync && typeof binding.collect === 'function') {
          scope.off('updating', binding.exec);
        }

        Dependency.clean(binding);

        Binding.remove(scope, binding);
      }
    },

    exec: function() {
      if (this.flag === 0) {
        return;
      }

      Dependency.begin(this);
      var value = this.collect.call(this.scope);
      Dependency.end();
      this.target.set(this.property, value);
      this.flag = 0;

      if (this.depsCount > 1 && this.sync) {
        this.scope.on('updating', this.exec);
        this.sync = false;
      }
    },

    back: function() {
      this.reflect.call(this.scope, this.target[this.property]);
    },

    invalidate: function() {
      this.flag = 1;
      if (this.sync) {
        this.exec();
      } else {
        this.scope.invalidate(FLAG_CHANGED);
      }
    }
  });

  // src/core/shells/Component.js


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

  function Component(props, scopes, template) {
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

        // eslint-disable-next-line no-undef
        {
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
            })();
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
            });
          } else {
            throw new TypeError('The template must be legal HTML string or DOM element');
          }
        }

        // 4. initialize the component as normal element
        Shell.initialize(component, _template.tag !== 'x:frag' ? 1 : 0, _template.tag, _template.ns || '');

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
            defineProp(component, key, Object.getOwnPropertyDescriptor(model, key));
          }
        }

        var HTMXEngine = config.HTMXEngine;

        HTMXEngine.driveComponent(component, _template, scopes, template, props);

        // 8. initialized
        component.emit('created');
        // if (component.onInited) {
        //   component.onInited();
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
      // eslint-disable-next-line no-undef
      {
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
        this.emit('attached', $skin);
        // if (this.onAttached) {
        //   this.onAttached($skin);
        // }
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
        if ($skin) {
          this.emit('detached', $skin);
        }
        this.emit('destroyed');
        // if (this.onDetached && $skin) {
        //   this.onDetached($skin);
        // }
        // if (this.onDestroyed) {
        //   this.onDestroyed();
        // }
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

      // if (this.onUpdating) {
      //   this.onUpdating();
      // }

      this.emit('updating', this.$flag);
      // this.emit('update', this.$flag);

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
      var actions = this._actions;
      if (actions && actions['rendered'] && this.$skin) {
        Schedule.pushCallbackQueue((function() {
          this.emit('rendered', this.$skin);
        }).bind(this));
      }
      // if (this.onRendered && this.$skin) {
      //   Schedule.pushCallbackQueue((function() {
      //     this.onRendered(this.$skin);
      //   }).bind(this));
      // }
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

        block.scopes = scopes;
        block.template = assign({}, template);
        delete block.template.xkey;
        delete block.template.xfor;
        delete block.template.xif;
        
        block.set('condition', true);

        // var ctrls = template.ctrls || {};
        var expression;

        if (template.xif) {
          block.mode = 1;
          expression = template.xif;
          expression.compile('condition', block, scopes);
        }

        if (template.xfor) {
          block.mode = 2;
          expression = template.xfor[1];
          expression.compile('iterable', block, scopes);
          if (template.xkey) {
            block.keyEval = template.xkey;//.evaluator;
          }
        }

        block.on('updating', block.onUpdating.bind(block));
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

      if (!condition) {
        this.setChildren(fragment);
        return;
      }

      var HTMXEngine = config.HTMXEngine;

      if (this.mode === 1) {
        content = HTMXEngine.makeContent(template, scopes);
        if (content) {
          fragment.push(content);
        }
        this.setChildren(fragment);
        return;
      }

      var indices = {}, index, content, item, key, n, i;
      var iterable = this.get('iterable') || [];
      var children = this._children || [];
      var keyEval = this.keyEval;
      var newScopes;
    
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

        if (keyEval) {
          key = keyEval.execute(newScopes);
          index = indices[key];
          if (index != null) {
            content = children[index];

          }
        }
    
        if (!content) {
          content = HTMXEngine.makeContent(template, newScopes);
          content.__key__ = key;
        }
    
        fragment.push(content);
      }

      this.setChildren(fragment);
    }
  });

  // src/base/Evaluator.js

  /**
   * @class
   * @constructor
   * @param {Function} func 
   * @param {string} expr
   */
  function Evaluator(func, expr) {
    this.func = func;    // function to be applied
    this.expr = expr;
  }

  defineClass({
    constructor: Evaluator,

    /**
     * @param {Array} scopes  - local varaibles
     * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
     */
    execute: function(scopes, value) {
      var args = scopes.slice(1);
      if (arguments.length > 1) {
        args.push(value);
      }
      
      // eslint-disable-next-line no-undef
      { 
        try {
          return this.func.apply(scopes[0], args);
        } catch (e) {
          var constructor = scopes[0].constructor;
          logger.warn('The expression `' + (this.expr || this.func.toString()) + 
                      '` maybe illegal in the template of Component ' + (constructor.fullName || constructor.name));
          throw e;
        }
      }
    }
  });

  // src/template/Expression.js

  // function parseEvaluator(expr, prototype, identifiers) {
  //   var type = typeof expr;
  //   if (type === 'string') {
  //     // if (PROP_EXPR_REGEXP.test(expr)) {
  //     //   return new PropEvaluator(expr.trim());
  //     // }
  //     return EvaluatorParser.parse(expr, prototype, identifiers);
  //   } else if (type === 'function') {
  //     // var evaluator = new FuncEvaluator(expr);
  //     // evaluator.connect(prototype, identifiers);
  //     // return evaluator;
  //     return new Evaluator(expr, null);
  //   }
  // }

  /**
   * Expression parsed from 'checked@="selected"' and so on, in the component pattern.
   * 
   * @class
   * @constructor
   * @param {Object} binding
   * @param {Object} pattern
   */
  function Expression(binding, pattern, unparsed) {
    this.binding = binding;
    this.pattern = pattern;
    this.unparsed = unparsed;
  }

  defineClass({
    constructor: Expression,
    statics: {
      /**
       * Factory method
       *  @param {Object} binding
        * @param {Object} pattern
        */
      // create: function(binding, pattern) {
      //   return new Expression(binding, pattern);
      // },
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
    // eslint-disable-next-line no-unused-vars
    connect: function(prototype, identifiers) {
      if (!this.unparsed) {
        return;
      }
      var pattern = this.pattern;
      var evaluator = pattern.evaluator;
      var converters = pattern.converters;
      if (typeof evaluator === 'function') {
        pattern.evaluator = new Evaluator(evaluator);
      } 
      if (converters) {
        for (var i = 0; i < converters.length; ++i) {
          if (typeof converters[i] === 'function') {
            pattern.converters[i] = new Evaluator(converters[i]);
          }
        }
      }
      this.unparsed = false;
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

  // src/core/template/HTMXEngine.js

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

  function toClasses(classList) {
    if (typeof classList === 'string') {
      classList = classList.trim().split(WHITE_SPACES_REGEXP);
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

  function driveProps(target, props, scopes) {
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

  function driveEvents(target, events, scopes) {
    if (events) {
      var type, value;
      for (type in events) {
        value = events[type];
        if (typeof value === 'object' && value instanceof Expression) {
          value.compile(type, target, scopes);
        } else if (typeof value === 'function') {
          target.on(type, value);
        }
      }
    }
  }

  function driveChildren(target, children, scopes) {
    var contents = makeContents(children, scopes);
    target.setChildren(contents);
  }

  function driveContents(target, children, scopes) {
    var contents = makeContents(children, scopes);
    target.setContents(contents);
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
      content = new Text(node);
    } else if (node instanceof Expression) { // like "hello, @{ $.name }..."
      content = new Fragment(null, scopes, node);
      // node.compile('contents', content, scopes);
    } else if (node.xif || node.xfor) {
      content = new Block(null, scopes, node);
    } else if (node.tag !== '!') {
      type = node.type;
      if (type) {
        content = new type(null, scopes, node);
      } else if (node.tag !== '!') {
        // if (node.ns == null) {
        //   node.ns = node.ns;
        // }
        content = new Element(node.ns ? node.ns + ':' + tag : tag, null, scopes, node);
        if (node.events) {
          driveEvents(content, node.events, scopes);
        }
        if (node.props) {
          driveProps(content, node.props, scopes);
        }
        if (node.attrs) {
          driveProps(content.attrs, node.attrs, scopes);
        }
        if (node.style) {
          driveProps(content.style, node.style, scopes);
        }
        if (node.classes) {
          driveProps(content.classes, node.classes, scopes);
        }
        if (node.children) {
          driveChildren(content, node.children, scopes);
        }
      }

      if (content && node.name) {
        scopes[0].addNamedPart(node.name, content); // TODO: removeNamedPart
        defineProp(content, '$owner', {
          configurable: true,
          enumarable: false,
          writable: false,
          value: scopes[0]
        });
      }
    }

    return content;
  }

  function driveComponent(target, _template, scopes, template, props) {
    var _scopes = [target];

    if (template && scopes) {
      if (props && template.props) {
        props = assign({}, template.props, props);
      } else if (!props && template.props) {
        props = template.props;
      }
      // eslint-disable-next-line no-undef
      {
        Validator.validate0(target, props);
      }
      driveProps(target, props, scopes);

      if (template.events) {
        driveEvents(target, template.events, scopes);
      }
      if (template.attrs) {
        driveProps(target.attrs, template.attrs, scopes);
      }
      if (template.style) {
        driveProps(target.style, template.style, scopes);
      }
      if (template.classes) {
        driveProps(target.classes, template.classes, scopes);
      }
      if (template.children) {
        driveContents(target, template.children,scopes);
      }
    } else if (props) {
      // eslint-disable-next-line no-undef
      {
        Validator.validate0(target, props);
      }
      driveProps(target, props, scopes);
    }
    
    if (_template.events) {
      driveEvents(target, _template.events, _scopes);
    }
    if (_template.props) {
      defineProp(target, '__props', {
        value: new Cache(target), 
        configurable: true
      });
      driveProps(target.__props, _template.props, _scopes);
    }
    if (_template.attrs) {
      defineProp(target, '__attrs', {
        value: new Cache(target), 
        configurable: true
      });
      driveProps(target.__attrs, _template.attrs, _scopes);
    }
    if (_template.style) {
      defineProp(target, '__style', {
        value: new Cache(target), 
        configurable: true
      });
      driveProps(target.__style, _template.style, _scopes);
    }
    if (_template.classes) {
      defineProp(target, '__classes', {
        value: new Cache(target), 
        configurable: true
      });
      driveProps(target.__classes, _template.classes, _scopes);
    }
    if (_template.children) {
      driveChildren(target, _template.children, _scopes);
    }
  }

  function transferProperties(shell) {
    if (!shell.tag) {
      return;
    }

    var _props = shell._props;
    var style, classes, viewEngine;
      
    if (shell.hasDirty('style')) {
      DirtyMarker.clean(shell, 'style');
      style = _props.style;
      if (typeof style === 'object') {
        shell.style.reset(style);
      } else if (typeof style === 'string') {
        viewEngine = Shell.getViewEngine(shell);
        if (viewEngine) {
          style = toStyle(style, viewEngine);
        }
        shell.style.reset(style);
      }
    }
    if (shell.hasDirty('classes')) {
      DirtyMarker.clean(shell, 'classes');
      classes = _props.classes;
      if (typeof classes !== 'object') {
        classes = toClasses(classes);
      }
      shell.classes.reset(classes);
    }

    if (!shell.__props || !shell.constructor.__extag_component_class__) { 
        return; 
    }

    var __props = shell.__props;
    
    if (__props && __props.hasDirty('style')) {
      var __style = shell.__style;
      if (!__style) {
        __style = new Cache(shell);
        defineProp(shell, '__style', {
          value: __style, 
          configurable: true
        });
      }
      DirtyMarker.clean(__props, 'style');
      style = __props.style;
      if (typeof style === 'object') {
        __style.reset(style);
      } else if (typeof style === 'string') {
        viewEngine = Shell.getViewEngine(shell);
        if (viewEngine) {
          style = toStyle(style, viewEngine);
        }
        __style.reset(style);
      }
    }
    if (__props && __props.hasDirty('classes')) {
      var __classes = shell.__classes;
      if (!__classes) {
        __classes = new Cache(shell);
        defineProp(shell, '__classes', {
          value: __classes, 
          configurable: true
        });
      }
      DirtyMarker.clean(__props, 'classes');
      classes = __props.classes;
      if (typeof classes !== 'object') {
        classes = toClasses(classes);
      }
      __classes.reset(classes);
    }
  }

  var HTMXEngine = {
    driveProps: driveProps,
    driveEvents: driveEvents,
    driveContents: driveContents,
    driveChildren: driveChildren,
    driveComponent: driveComponent,
    transferProperties: transferProperties,
    buildContent: makeContent,
    makeContent: makeContent,
    makeContents: makeContents
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
        slot.template.props = assign({}, template.props);
        if (name) {
          delete slot.template.props.name;
        }

        slot.scopes = scopes;

        slot.invalidate(FLAG_CHANGED);
        slot.on('updating', slot.onUpdating.bind(slot));
        // slot.invalidate = slot.invalidate.bind(slot);
        scopes[0].on('changed.contents', function() {
          slot.invalidate(FLAG_CHANGED);
        });
      },
      template: '<x:frag></x:frag>'
    },

    onUpdating: function onUpdating() {
      var fragment = [], children, content, n, i;
      var scopeContents = this.scopes[0].getContents();
      var template = this.template, scopes = this.scopes;
      if (scopeContents && scopeContents.length > 0) {
        var name = this.get('name') || '';
        for (i = 0, n = scopeContents.length; i < n; ++i) {
          content = scopeContents[i];
          if (name === ((content._attrs && content.attrs.get('x:slot')) || '')) {
            fragment.push(content);
          }
        }
        this.useDefault = false;
      }
      if (fragment.length === 0 && template.children) {
        // use the default template to slot here
        if (this.useDefault) {
          return;
        }
        children = template.children;
        for (i = 0, n = children.length; i < n; ++i) {
          content = HTMXEngine.makeContent(children[i], scopes);
          if (content) {
            fragment.push(content);
          }
        }
        this.useDefault = true;
      }
      this.setChildren(fragment);
    }
  });

  // src/core/bindings/DataBinding.js

  var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

  function applyConverters(converters, scopes, value) {
    for (var i = 0; i < converters.length; ++i) {
      value = converters[i].execute(scopes, value);
    }
    return value;
  }

  function isBindable(src, prop) {
    var desc = Accessor.getAttrDesc(src, prop);
    return desc && desc.bindable;
  }

  function DataBinding(pattern) {
    this.mode = pattern.mode;
    this.path = pattern.path;
    this.paths = pattern.paths;
    this.evaluator = pattern.evaluator;
    this.converters = pattern.converters;
    this.identifiers = pattern.identifiers;
  }

  defineClass({
    constructor: DataBinding,
    statics: {
      MODES: MODES,

      // create: function(pattern) {
      //   return new DataBinding(pattern);
      // },

      compile: function(pattern, property, target, scopes) {
        return (new DataBinding(pattern)).link(property, target, scopes);
      },

      destroy: function(binding) {
        var target = binding.target, scopes = binding.scopes;

        if (binding.mode === MODES.TWO_WAY)  {
          if (isBindable(binding.target, binding.targetProp)) {
            binding.target.off('changed.' + binding.targetProp, binding.back);
          }
        }

        if (!binding.sync) {
          scopes[0].off('updating', binding.exec);
        }

        Binding.remove(target, binding);

        Dependency.clean(binding);
      }
    },

    link: function(property, target, scopes) {
      this.flag = 0;
      this.sync = true;
      this.scopes = scopes;
      this.target = target;
      this.targetProp = property;

      if (this.mode === MODES.ASSIGN) {
        this.target.set(this.targetProp, this.eval());
        return;
      }

      this.exec = this.exec.bind(this);
      this.invalidate = this.invalidate.bind(this);

      if (this.mode === MODES.TWO_WAY) {
        this.back = this.back.bind(this);
        var path = this.path;//Path.parse(this.path);
        var from = this.identifiers.indexOf(path[0]);
        this.sourceProp = path[path.length - 1];
        if (from >= 0) {
          this.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);
        } else {
          this.source = Path.search(path.slice(1, path.length - 1), scopes[0].constructor.resources, true);
        }
        
        if (isBindable(this.target, this.targetProp)) {
          this.target.on('changed.' + this.targetProp, this.back);
        }
      }

      if (this.mode === MODES.ANY_WAY) {
        this.sync = false;
        this.scopes[0].on('updating', this.exec);
        this.target.set(this.targetProp, this.eval());
      } else {
        this.sync = true;
        this.flag = 1;
        this.exec();
        if (this.depsCount > 0) {
          Binding.record(target, this);
        }
      }
    },

    eval: function(back) {
      if (this.mode === MODES.TWO_WAY) {
        if (back) {
          return this.target[this.targetProp];
        } else {
          return this.source[this.sourceProp];
        }
      } 

      var converters = this.converters;
      if (converters && converters.length) {
        return applyConverters(converters, this.scopes, this.evaluator.execute(this.scopes));
      } else {
        return this.evaluator.execute(this.scopes);
      }
    },

    exec: function exec() {
      if (this.mode === MODES.ANY_WAY) {
        this.target.set(this.targetProp, this.eval());
        return;
      }
      if (this.flag === 0) {
        return;
      }

      Dependency.begin(this);
      var value = this.eval();
      Dependency.end();
      this.target.set(this.targetProp, value);

      this.flag = 0;
      if (this.mode === MODES.ONE_TIME) {
        DataBinding.destroy(this);
      } else if (this.depsCount > 1 && this.sync) {
        this.scopes[0].on('updating', this.exec);
        this.sync = false;
      }
    },

    back: function back() {
      this.source.set(this.sourceProp, this.eval(true));
    },

    invalidate: function() {
      this.flag = 1;
      if (this.sync) {
        this.exec();
      } else {
        this.scopes[0].invalidate(FLAG_CHANGED);
      }
    }
  });

  // src/core/bindings/EventBinding.js

  function EventBinding(pattern) {
    this.pattern = pattern;
  }

  defineClass({
    constructor: EventBinding,

    statics: {
      // create: function(pattern) {
      //   return new EventBinding(pattern);
      // },

      compile: function(pattern, type, target, scopes) {
        (new EventBinding(pattern)).link(type, target, scopes);
      }
    },

    link: function(type, target, scopes) {
      var wrapper, pattern = this.pattern, handler = pattern.handler, evaluator = pattern.evaluator, modifiers = pattern.modifiers;

      if (handler) {
        var func = scopes[0][handler];

        
        if (!func) {
          // eslint-disable-next-line no-undef
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
          target.on(type, function() {
            evaluator.execute(scopes);
          });
        } else {
          wrapper = function(event) {
            // process(event, type, target, wrapper, modifiers);
            processModifiers(modifiers, event);
            // if (event) {
            //   evaluator.execute(scopes.concat([event]));
            // } else {
              evaluator.execute(scopes);
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
      // create: function(pattern) {
      //   return new FragmentBinding(pattern);
      // },

      compile: function(pattern, property, target, scopes) {
        (new FragmentBinding(pattern)).link(property, target, scopes);
      },

      destroy: function(binding) {
        binding.scopes[0].off('updating', binding.exec);

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

      scopes[0].on('updating', this.exec);
    },

    exec: function() {
      var cache = this.cache;

      if (!cache.hasDirty()) { return; }

      var value = slice(cache._props, 0);

      if (this.pattern.asStr) {
        value = value.join('');
      }

      // Binding.assign(this.target, this.property, value, this);
      this.target.set(this.property, value);

      DirtyMarker.clean(cache);
    }
  });

  // src/core/template/JSXEngine.js

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

  /**
   * Check if the node matches the child element or child component.
   * @param {Shell} oldChild  - text, element or component
   * @param {Object} newChild - node
   */
  function matchesChild(oldChild, newChild) {
    if (!oldChild.tag && !newChild.__extag_node__) {
      return true;
    }
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
    var child, ctor, ns;
    if (node == null) {
      child = new Text('');
      return child;
    } else if (node.type) {
      ctor = node.type;
      child = new ctor(
        node.props, 
        [scope]//, node
      );
    } else if (node.tag) {
      ns = node.ns || target.ns;
      child = new Element(
        ns ? ns + ':' + node.tag : node.tag, 
        node.props, 
        [scope]//, node
      );
    } else {
      child = new Text(node);
      return child;
    }

    if (node.name) {
      // console.log('x:name=' + node.name);
      // scope[node.xName] = child; // TODO: addNamedPart
      scope.addNamedPart(node.name, child);
      defineProp(child, '$owner', {
        configurable: true,
        enumarable: false,
        writable: false,
        value: scope
      });
    }

    if (node.xkey) {
      child.__key__ = node.xkey;
    }

    return child;
  }

  // eslint-disable-next-line no-unused-vars
  function updatePropsAndEvents(node, target, scope) {
    var name, desc;
    var newProps = node.props;
    var newEvents = node.events;
    var oldProps = target._props;
    var oldEvents = target._events;

    // update props
    if (oldProps) {
      // firstly, remove redundant properties, or reset default property values.
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
      // assign new property values.
      target.assign(newProps);
    }

    // update events
    if (oldEvents) {
      // firstly, remove old event handlers
      for (name in oldEvents) {
        if (oldEvents[name]) {
          target.off(name, oldEvents[name]);
        }
      }
    }
    if (newEvents) {
      // add new event handlers
      target.on(newEvents);
    }
    
    // if (target._vnode) {
    //   target._vnode = node;
    // } else {
    //   defineProp(target, '_vnode', {
    //     value: node, writable: true, enumerable: false, attrsurable: true
    //   });
    // }
  }

  // refer to Vue (https://vuejs.org/)
  function updateChildrenOrContents(node, target, scope) { 
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
    if (typeof node === 'object' && node.__extag_node__) {
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
    // node: node,
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
        view.on('updating', view.onUpdating.bind(view));
      },
      template: '<x:frag></x:frag>'
    },

    onUpdating: function onUpdating() {
      var type = this.get('xtype');//this.attrs.get('x:type');
      var template = this.templat;
      var scopes = this.scopes;
      var content, ctor;

      if (typeof type === 'function') {
        ctor = type;
      } else if (typeof type === 'string') {
        // if (/^url\(.*\)$/.test(type)) {
        //   // TODO: check `require`
        //   require([type], (function(ctor) {
        //     this.set('xtype', ctor);
        //   }).bind(this));
        //   return;
        // } else {
          var resources = scopes[0].constructor.resources;
          ctor = resources && resources[type];
        // }
      } else if (typeof type === 'object' && typeof Promise === 'function' && type instanceof Promise) {
        type.then((function(ctor) {
          this.set('xtype', ctor);
        }).bind(this));
        return;
      }

      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        // throw new Error('No such component type `' + xType + '`');
        return;
      }
      
      template.tag = '?';
      template.type = ctor;
      content = HTMXEngine.makeContent(template, scopes);

      this.setChildren([content]);
    }
  });

  // import FuncEvaluator from 'src/core/template/evaluators/FuncEvaluator';
  // import PropEvaluator from 'src/core/template/evaluators/PropEvaluator';
  // import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

  function parseJsxNode(node, prototype) {
    var props = node.props, value, key, ctor;
    if (node.xif) {
      node.xif.connect(prototype, node.identifiers);
    }
    if (node.xfor) {
      // if (Array.isArray(ctrls.xfor))
      node.xfor[1].connect(prototype, node.identifiers);
      node.identifiers = node.identifiers.concat([node.xfor[0]]);
    }
    if (node.xkey) {
      node.xkey.connect(prototype, node.identifiers);
    }
    if (props) {
      // style, attrs, classes, actions
      for (key in props) {
        value = props[key];
        if (typeof value === 'object' && value instanceof Expression) {
          value.connect(prototype, node.identifiers);
        }
      }
    }
    if (node.type && typeof node.type === 'string') {
      ctor = Path.search(node.type, prototype.constructor.resources);
      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        // eslint-disable-next-line no-undef
        {
          logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in static resources.');
        }
        throwError('Can not find such component type `' + expr + '`');
      }
      // _directs.xType = ctor;
      node.type = ctor;
    }
    if (node.type == null && CAPITAL_REGEXP.test(node.tag)) {
      ctor = Path.search(node.tag, prototype.constructor.resources);
      if (typeof ctor === 'function' && ctor.__extag_component_class__) {
        node.type = ctor;
      }
    }
    if (node.type == null) {
      switch (node.tag) {
        case 'x:slot':
          node.type = Slot;
          break;
        case 'x:view':
          node.type = View;
          break;
        case 'x:frag':
          node.type = Fragment;
          break;
        // case 'x:block':
        //   node.type = Block;
        //   break;
      }
    }
    if (node.events) {
      parseJsxEvents(node, prototype);
    }
  }

  function parseJsxEvents(node, prototype) {
    var events = node.events;
    var value, evt;
    for (evt in events) {
      value = events[evt];
      if (typeof value === 'object' && value instanceof Expression) {
        value.connect(prototype, node.identifiers);
        // actions[evt] = value;
      } else {
        value = expr('+', value);
        if (typeof value === 'object' && value instanceof Expression) {
          events[evt] = value;
        } else {
          delete events[evt];
        }
      }
        
    }
  }

  function parseJsxChildren(node, prototype) {
    var children = node.children;
    if (!children || !children.length) {
      return;
    }
    var i, j = -1, child;
    var hasExpr;
    for (i = children.length - 1; i >= 0; --i) {
      child = children[i];
      if (typeof child === 'object') {
        if (child.__extag_node__) {
          // TODO: slice(i, j);   splice(i, j, expr('#'))
          if (hasExpr) {
            children.splice(i + 1, j + 1, new Expression(FragmentBinding, children.slice(i + 1, j + 1)));
          }
          hasExpr = false;
          j = -1;

          child.identifiers = node.identifiers;
          parseJsxNode(child, prototype);
          parseJsxChildren(child, prototype);
          continue;
        }
        if (child instanceof Expression) {
          child.connect(prototype, node.identifiers);
          hasExpr = true;
        }
      }
      // if (hasExpr && i === 0) {
        
      // }
      if (j < 0) { 
        j = i;
      }
    }

    if (hasExpr && j > -1) {
      children.splice(0, j + 1, new Expression(FragmentBinding, children.slice(0, j + 1)));
    }

    // node.children = children.filter(function(child) {
    //   return !!child;
    // });
  }

  var RESERVED_PARAMS = {
    ns: null,
    on: null,
    // tag: null,
    xif: null,
    xfor: null,
    xkey: null,
    xname: null,
    xtype: null,
    props: null,
    // attrs: null,
    // style: null,
    // 'class': null,
    // classes: null,
    // className: null,
    
    // events: null,
    // directs: null,
    children: null,
    contents: null
  };

  /**
   *
   * @param {string|Function} tagOrType
   * @param {Object} attrs
   * @param {string|Array|Object} children
   * @returns {Object}
   */
  function node(type, attrs, children) {
    var node = {
      __extag_node__: true
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
      throwError('First argument must be class, string or constructor.');
    }

    // if (arguments.length === 2 && (Array.isArray(attrs) || typeof attrs !== 'object')) {
    //   children = attrs;
    //   attrs = null;
    // }

    if (attrs != null) {
      
      if (attrs.xif) {
        node.xif = attrs.xif;
      }
      if (attrs.xfor) {
        node.xfor = attrs.xfor;
      }
      if (attrs.xkey) {
        node.xkey = attrs.xkey;
      }
      if (attrs.xname) {
        node.name = attrs.xname;
      }
      if (attrs.xtype && !node.type) {
        node.type = attrs.xtype;
      }
      // if (attrs.style) {
      //   node.style = attrs.style;
      // }
      // if (attrs.xattrs) {
      //   node.attrs = attrs.xattrs;
      // }
      // if (attrs.xclass) { // TODO: className
      //   node.classes = attrs.xclass;
      // }
      if (attrs.on) {
        node.events = attrs.on;
      }

      // node.directs = attrs.directs;

      var props = node.props = {};

      for (var key in attrs) {
        if (hasOwnProp.call(attrs, key) && !(key in RESERVED_PARAMS)) {
          props[key] = attrs[key];
        }
      }
    }

    if (children) {
      if (arguments.length > 3) {
        children = slice(arguments, 2);
      }
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

  // function createEvaluator(expr) {
  //   var type = typeof expr;
  //   if (type === 'string') {
  //     if (PROP_EXPR_REGEXP.test(expr)) {
  //       return new PropEvaluator(expr.trim());
  //     }
  //     return EvaluatorParser.parse(expr);
  //   } else if (type === 'function') {
  //     return new FuncEvaluator(expr);
  //   }
  // }

  // function createConverters(more) {
  //   var converters = [], type, expr, j, i;
  //   for (j = 0; j < more.length; ++j) {
  //     expr = more[j];
  //     type = typeof expr;
  //     if (type === 'string') {
  //       i = expr.indexOf('(');
  //       if (i > 0) {
  //         expr = expr.slice(0, i + 1) + 'arguments[arguments.length-1],' + expr.slice(i + 1);
  //       } else {
  //         expr = expr + '(arguments[arguments.length-1])';
  //       }
  //       converters.push(EvaluatorParser.parse(expr));
  //     } else if (type === 'function') {
  //       converters.push(new FuncEvaluator(expr));
  //     }
  //   }
  //   return converters;
  // }

  /**
   * 
   * @param {string} type - binding type, one of '@', '+', '#', '@!', '@?', '@@'
   * @param {string|Function} base - base expression string or function
   * @param {Array} more - converters, every item just be like the param `base`. 
   *                       Or some expressions for type '#'. Or modifiers for type '+'.
   */
  function expr(type, base/*, ...more*/) {
    var more = arguments.length > 2 ? slice(arguments, 2) : null;
    var mode;
    // if (typeof base === 'string') {
    //   base = base.trim();
    // }
    if (type[0] === '@') {
      switch (type) {
        case '@':
          mode = 1;
          break;
        case '@@':
          mode = 2;
          // TODO: check expr
          break;
        case '@!':
          mode = -1;
          break;
        case '@?':
          mode = 0;
          break;
        default:
          return;
      }
      return new Expression(DataBinding, {
        mode: mode,
        path: mode === 2 ? base.trim().replace(CONTEXT_REGEXP, '') : null,
        evaluator: base, //createEvaluator(base),
        converters: more //more ? createConverters(more) : null
        // TODO: identifiers
      }, true);
    } else if (type === '+') {
      if (typeof base === 'string' && HANDLER_REGEXP.test(base.trim())) {
        return new Expression(EventBinding, {
          handler: base.trim().replace(CONTEXT_REGEXP, ''),
          modifiers: more
        });
      } else {
        return new Expression(EventBinding, {
          evaluator: base, //createEvaluator(base),
          modifiers: more
        }, true);
      }
    } else if (type === '#') {
      if (more) {
        more.unshift(base);
      } else {
        more = [base];
      }
      return new Expression(FragmentBinding, more);
    }
  }

  var JSXParser = {
    node: node,
    expr: expr,
    parse: function(template, prototype) {
      var _node = template(node, expr);
      _node.identifiers = [CONTEXT_SYMBOL];
      parseJsxNode(_node, prototype);
      parseJsxChildren(_node, prototype);

      if (_node.type) {
        if (_node.tag === 'x:frag') {
          _node.type = null;
        } else if (_node.tag === 'x:slot' || _node.tag === 'x:view') {
          throwError(_node.tag + ' can not be used as root tag of component template.');
        } else {
          throwError('component can not be used as root tag of another component template.');
        }
      } else if (_node.xif || _node.xfor || _node.xkey) {
        throwError('`xif`, `xfor`, `xkey` can not be used on component template root tag.');
      }

      return _node;
    }
  };

  config.JSXParser = JSXParser;

  // src/core/template/parsers/EvaluatorParser.js

  var DIVISION_REGEXP = /[\w).+\-_$\]]/;

  var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield Array Date Infinity Math NaN Number Object String Boolean';
  var JS_KEYWORD_MAP = {};
  (function() {
    var keywords = JS_KEYWORDS.split(/\s+/);
    for (var i = 0, n = keywords.length; i < n; ++i) {
      JS_KEYWORD_MAP[keywords[i]] = true;
    }
  })();

  // function skipWhiteSpace(expr, index) {
  //   var cc, length = expr.length;
  //   while (index < length) {
  //     cc = expr.charCodeAt(index);
  //     //    \             \f\n\r\t\v
  //     if (!(cc === 32 || (cc >=9 && cc <= 13))) {
  //       break;
  //     }
  //     ++index;
  //   }
  //   return index;
  // }

  function notPropertyName(expr, index) {
    var cc, length = expr.length;
    while (index < length) {
      cc = expr.charCodeAt(index);
      //    \             \f\n\r\t\v
      if (!(cc === 32 || (cc >=9 && cc <= 13))) {
        return cc !== 44 && cc !== 123; // not ',' and '{'
      }
      --index;
    }
  }

  function skipToPathEnding(expr, index) {
    var cc, dot, space, length = expr.length;
    while (index < length) {
      cc = expr.charCodeAt(index);
      if (cc === 32 || (cc >=9 && cc <= 13)) {
        space = true;
        ++index;
        continue;
      }
      if (cc === 46) {
        if (dot) {
          throwError("Unexpected token '.'.", {
            code: 1001, 
            expr: expr
          });
        }
        space = false;
        dot = true;
      } else {
        if (!isLegalVarStartCharCode(cc) && !(cc >= 48 && cc <= 57)) {
          if (dot) {
            throwError("Unexpected token '" + expr[index] + "'.", {
              code: 1001, 
              expr: expr
            });
          }
          break;
        } else {
          if (space && !dot) {
            throwError("Unexpected token '" + expr[index] + "'.", {
              code: 1001, 
              expr: expr
            });
          }
        }
        space = false;
        dot = false;
      }
      ++index;
    }
    return index;
  }

  function isLegalVarStartCharCode(cc) {
    //       a-z                       A-Z                       _            $
    return  (cc >= 97 && cc <= 122) || (cc >= 65 && cc <= 90) || cc === 95 || cc === 36;
  }

  function getIdentifierIndices(expr) {
    var indices = [];
    var b0, b1, b2, cb, cc;
    var n = expr.length, i = 0, j;
    while(i < n) {
      cb = cc;
      cc = expr.charCodeAt(i);
      switch (cc) {
        case 39: // 39: '
          if (!b0) { b0 = true; } 
          else if (cb !== 92) { b0 = false; }// 92: \
          break;
        case 34: // 34: "
          if (!b1) { b1 = true; } 
          else if (cb !== 92) { b1 = false; } // 92: \
          break;
        case 47: // 47: /, maybe regexp
          if (!b2) {
            var cp;
            for (; j >= 0; --j) {
              cp = expr.charCodeAt(j);
              if (!(cp === 32 || (cp >=9 && cp <= 13))) {
                break;
              }
            }
            if (!cp || !DIVISION_REGEXP.test(cp)) {
              b2 = true;
            }
          } else if (cb !== 92) { b2 = false; }
          break;
        // TODO: ``
        default:
          if (!b0 && !b1 && !b2 && cb !== 46 && isLegalVarStartCharCode(cc)) {
            j = skipToPathEnding(expr, i + 1); 
            cc = expr.charCodeAt(j);
            if (cc !== 58) { // 58: :, not a property name of object
              indices.push(i, j);
            } else if (notPropertyName(expr, i - 1)) {
              indices.push(i, j);
            }
            i = j;
          }
          break;
      }
      ++i;
    }
    
    return indices;
  }

  var EvaluatorParser = {
    /**
     * @param {string} expr - e.g. "a + b" in @{a + b} or value@="a + b".
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     * @returns {PropEvaluator|FuncEvaluator}
     */
    parse: function parse(expr, prototype, identifiers) {
      var args = identifiers.slice(1);
      var expanded = 0, piece, path;
      var lines = [], i, j;
      // if (PROP_EXPR_REGEXP.test(expr)) {
      //   evaluator = new PropEvaluator(expr.trim());
      //   if (prototype && identifiers) {
      //     evaluator.connect(prototype, identifiers);
      //   }
      //   return evaluator;
      // }

      var indices = getIdentifierIndices(expr);

      var resources = prototype.constructor.resources || EMPTY_OBJECT;

      for (j = 0; j < indices.length; j += 2) {
        if (indices[j+1] < 0) { continue; }
        piece = expr.slice(indices[j] + expanded, indices[j+1] + expanded);
        path = Path.parse(piece.replace(WHITE_SPACE_REGEXP, ''));
        if (hasOwnProp.call(JS_KEYWORD_MAP, path[0])) {
          continue;
        }
        i = identifiers.indexOf(path[0]);
        if (i < 0) {
          if (path[0] in resources) {
            lines.push('var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
          } else {
            expr = expr.slice(0, indices[j] + expanded) + 'this.' + piece + expr.slice(indices[j+1] + expanded);
            expanded += 5;
          }
        } 
      }

      lines.push('return ' + expr);
      args.push(lines.join('\n'));

      try {
        var func = Function.apply(null, args);
        return new Evaluator(func, expr);
      } catch (e) {
        throwError(e, {
          code: 1001,
          expr: arguments[0],
          desc: 'Illegal expression `' + arguments[0] + '`.'
        });
      }
    }
  };

  // src/core/template/parsers/PrimaryLiteralParser.js

  var PrimaryLiteralParser = {
    /**
     * try to parse expression as boolean or number value.
     * @param {string} expr 
     */
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

  function newIdentifier(expr, identifiers) {
    var identifier = '$' + identifiers.length;
    while (expr.indexOf(identifier) >= 0) {
      identifier = '$' + identifier;
    }
    return identifier;
  }

  var DataBindingParser = {
    /**
     * parse data-binding expression
     * @param {string} expr - e.g. "text |=upper" in @{text |=upper} or value@="text |=upper".
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     * @returns {*}
     */
    parse: function parse(expr, prototype, identifiers) {
      var mode = -1, paths = [], n = expr.length, i;

      if (expr[0] === BINDING_OPERATORS.TWO_WAY) {              // <text-box model@="@text"/>
        mode = DATA_BINDING_MODES.TWO_WAY;
        expr = expr.slice(1, n); 
      } else if (expr[n-1] === BINDING_OPERATORS.ANY_WAY) {     // <h1 title@="title ^">@{title ^}</h1>
        mode = DATA_BINDING_MODES.ANY_WAY;
        expr = expr.slice(0, n-1);
      } else if (expr[n-1] === BINDING_OPERATORS.ASSIGN) {      // <h1 title@="title!">@{title !}</h1>
        mode = DATA_BINDING_MODES.ASSIGN;
        expr = expr.slice(0, n-1);
      } else if (expr[n-1] === BINDING_OPERATORS.ONE_TIME) {    // <div x:type="Panel" x:if="showPanel ?"></div>
        mode = DATA_BINDING_MODES.ONE_TIME;
        expr = expr.slice(0, n-1);
      } else {                                                        // <h1 title@="title">@{title}</h1>
        mode = DATA_BINDING_MODES.ONE_WAY;
      }

      var converters, converter, evaluator, pieces, piece, path;
      if (mode === DATA_BINDING_MODES.TWO_WAY) {
        if (!Path.test(expr.trim())) {
          throwError('', {
            code: 1001,
            expr: arguments[0],
            desc: '`' + arguments[0] + '` is not a valid two-way binding expression. Must be a property name or path.'
          });
        }
        path = Path.parse(expr.trim());
        if ((path[0] in prototype) && identifiers.indexOf(path[0]) < 0) {
          path.unshift('this');
        }
        evaluator = EvaluatorParser.parse(expr, prototype, identifiers);
      } else if (expr.indexOf(BINDING_OPERATORS.CONVERTER) < 0) {
        evaluator = EvaluatorParser.parse(expr, prototype, identifiers);
      } else {
        pieces = expr.split(BINDING_OPERATORS.CONVERTER);
        evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);
        if (pieces.length > 1) {
          for (i = 1; i < pieces.length; ++i) {
            piece = pieces[i].trim();

            if (!piece) {
              throwError('Converter must not be empty!', {
                code: 1001,
                expr: arguments[0],
                desc: 'Empty converter in the expression `' + arguments[0] + '` is not allowed.'
              });
            }

            var identifier = newIdentifier(expr, identifiers);
            var index = piece.indexOf('(');
            if (index > 0) {
              piece = piece.slice(0, index + 1) + identifier + ',' + piece.slice(index + 1);
            } else {
              piece = piece + '(' + identifier + ')';
            }

            converter = EvaluatorParser.parse(piece, prototype, identifiers.concat([identifier]));
            converters = converters || [];
            converters.push(converter);
          }
        }
      }

      return {
        mode: mode,
        path: path,
        paths: paths,
        evaluator: evaluator,
        converters: converters,
        identifiers: identifiers
      }
    }
  };

  // src/core/template/parsers/FragmentBindingParser.js

  var LF_IN_BLANK = /\s*\n\s*/g;

  var BINDING_LIKE_REGEXP = new RegExp(
    BINDING_OPERATORS.DATA +'\\' + BINDING_BRACKETS[0] + '(\\s|.)*?\\' + BINDING_BRACKETS[1]
  );

  var FragmentBindingParser = {
    /**
     * check if the fragment expression contains `@{...}`
     * @param {string} expr - content of text node in template.
     */
    like: function like(expr) {
      return BINDING_LIKE_REGEXP.test(expr);
    },

    /**
     * parse an fragment expression that contains  `@{...}`
     * @param {string} expr - fragment expression that contains  `@{...}`
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     */
    parse: function(expr, prototype, identifiers) {
      var i, n, template = [], start = 0, stop;
      var b0, b1, b2, ct = 0, cc, cb;
      var pattern, text;
      for (i = 0, n = expr.length; i < n; ++i) {
        cb = cc;
        cc = expr.charCodeAt(i);
        if (b2) {
          if (cc === 125 && !b0 && !b1) { // }
            --ct;
            if (ct === 0) {
              if (start < stop) {
                text = expr.slice(start, stop);
                text = text.replace(LF_IN_BLANK, '');
                if (text) {
                  text = decodeHTML(text);
                  template.push(text);
                }
              }
              pattern = DataBindingParser.parse(expr.slice(stop+2, i), prototype, identifiers);
              template.push(new Expression(DataBinding, pattern));
              start = stop = i + 1;
              b2 = false;
            }
          } else if (cc === 39) { // 39: '
            if (!b0) b0 = true; 
            else if (cb !== 92) b0 = false; // 92: \
          } else if (cc === 34) { // 34: "
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
        text = expr.slice(start, n);
        text = text.replace(LF_IN_BLANK, '');
        if (text) {
          text = decodeHTML(text);
          template.push(text);
        }
      }
      
      return template.length ? template : null;
    }
  };

  // src/core/template/parsers/ClassStyleParser.js

  var STYLE_DELIMITER = /;/g;
  var CSS_NAME_REGEXP = /^[a-z0-9\-_]+$/i;
  // var SINGLE_BINDING_REGEXP = /^@\{[^@]*\}$/;
  var SINGLE_BINDING_REGEXP = new RegExp(
    '^' + BINDING_OPERATORS.DATA +'\\' + BINDING_BRACKETS[0] + '[^' + BINDING_OPERATORS.DATA + ']*\\' + BINDING_BRACKETS[1] + '$'
  );

  var ClassStyleParser = {
    /**
     * parse x:class="..." and x:style="..."
     * @param {string} expr - e.g. "a b; c@: active;" for x:class, 
     *                              and "display: none; font-size#:@{fontSize}px;" for x:style
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     * @param {boolean} camelCase  - using camel case for x:style="...", not for x:calss="..."
     */
    parse: function parse(expr, prototype, identifiers, viewEngine, camelCase) {
      var group = {};
      var pieces = expr.split(STYLE_DELIMITER); 
      var result, piece, name, names, n, i, j, k;

      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i].trim();
        k = piece.indexOf(':');
        
        if (k < 0) {
          piece = piece.trim();
          if (piece) {
            // extact a and b from x:class="a b; c: @{c};"
            names = piece.split(WHITE_SPACES_REGEXP);
            for (j = 0; j < names.length; ++j) {
              group[names[j]] = true;
            }
          }
          continue;
        } 
    
        name = piece.slice(0, k).trim();
        expr = piece.slice(k + 1).trim();
    
        // if (!/[\_\-a-z0-9]/i.test(name)) {
        if (!name || !CSS_NAME_REGEXP.test(name)) {
          throwError('Illegal ' + (camelCase ? 'x:style' : 'x:class') + ' expression.', {
            code: 1001,
            expr: name || arguments[0]
          });
        }
        if (camelCase) {
          name = viewEngine.toCamelCase(name);
        }

        try {
          if (!FragmentBindingParser.like(expr)) {
            group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
            continue;
          }
          if (SINGLE_BINDING_REGEXP.test(expr)) {
            result = DataBindingParser.parse(expr.slice(2, expr.length-1), prototype, identifiers);
            group[name] = new Expression(DataBinding, result);
            continue;
          }
          result = FragmentBindingParser.parse(expr, prototype, identifiers);
        } catch (e) {
          // eslint-disable-next-line no-undef
          {
            if (e.code === 1001) {
              e.expr = BINDING_FORMAT.replace('0', e.expr);
            }
          }
          throw e;
        }
        if (result) {
          if (result.length === 1 && (result[0] instanceof Expression)) {
            group[name] = result[0];
          } else if (camelCase) {
            result.asStr = true;
            group[name] = new Expression(FragmentBinding, result);
          } else {
            throwError('Illegal x:class expression.', {
              code: 1001,
              expr: expr
            });
          }
        } else {
          group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
        }
      }

      return group;
    }
  };

  // src/core/template/parsers/EventBindingParser.js

  var EventBindingParser = {
    /**
     * e.g. click+="close() ::once::stop" change+="this.onClick"
     * @param {string} expr - event handler expression
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     */
    parse: function parse(expr, prototype, identifiers) {
      var pieces = expr.indexOf(BINDING_OPERATORS.MODIFIER) < 0 ? 
                    [expr] : expr.split(BINDING_OPERATORS.MODIFIER);

      pieces[0] = pieces[0].trim();

      var template = {};

      if (HANDLER_REGEXP.test(pieces[0])) {
        template.handler = pieces[0].replace(CONTEXT_REGEXP, ''); 
      }  else {
        template.evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);
      }

      if (pieces.length > 1) {
        var modifiers = [];
        for (var i = 1; i < pieces.length; ++i) {
          modifiers.push(pieces[i].trim());
        }
        template.modifiers = modifiers;
      }

      return template;
    }
  };

  // src/core/template/parsers/HTMXParser.js

  var FOR_LOOP_REGEXP = /^([_$\w]+)\s+of\s+(.+)$/;
  var LETTER_REGEXP = /[a-zA-Z]/;
  var TAGNAME_STOP = /[\s/>]/;

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
    return name.charCodeAt(0) === 120 // 'x'
            && (name in DIRECTIVES);
  }

  function isSelfClosingTag(tagName) {
    return hasOwnProp.call(SELF_CLOSING_TAGS, tagName);
  }

  function parseDirective(name, expr, node, prototype, identifiers) {
    var result;
    if (name === 'x:class') {
      node.classes = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, false);
    } else if (name === 'x:style') {
      node.style = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, true);
    } else if (name === 'x:type') {
      var ctor = Path.search(expr, prototype.constructor.resources);
      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        // if ("development" === 'development') {
        //   logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in static resources.');
        // }
        // throw new TypeError('Can not find such component type `' + expr + '`');
        throwError('Illegal x:type="' + expr + '"', {
          code: 1001,
          expr: expr,
          desc: 'Can not find such component type `' + expr 
                + '`. Make sure it extends Component and please register `' + expr 
                + '` in static resources.'
        });
      }
      node.type = ctor;
    } else if (name === 'x:name') {
      node.name = expr;
    } else if (name === 'x:key') {
      node.xkey = EvaluatorParser.parse(expr, prototype, identifiers);
    } else if (name === 'x:for') {
      var matches = expr.trim().match(FOR_LOOP_REGEXP);

      if (!matches || !matches[2].trim()) {
        throwError('Illegal x:for="' + expr + '".', {
          code: 1001,
          expr: expr
        });
      }

      result = DataBindingParser.parse(matches[2], prototype, identifiers);

      if (result) {
        node.xfor = [matches[1], new Expression(DataBinding, result)];
      } else {
        throwError('Illegal x:for="' + expr + '".', {
          code: 1001,
          expr: expr
        });
      }

      node.identifiers = identifiers.concat([matches[1]]);
    } else if (name === 'x:if') {
      result = DataBindingParser.parse(expr, prototype, identifiers);
      if (result) {
        node.xif = new Expression(DataBinding, result);
      } else {
        throwError('Illegal x:if="' + expr + '".', {
          code: 1001,
          expr: expr,
        });
      }
    } else if (name === 'x:ns') {
      node.ns = expr;
    }
  }

  function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
    var lastChar = attrName[attrName.length - 1];
    var result, group, key;
    var asProp;

    if (lastChar === BINDING_OPERATORS.EVENT) { // last char is '+'
      group = getGroup(node, 'events');
      key = viewEngine.toCamelCase(attrName.slice(0, -1));
      result = EventBindingParser.parse(attrValue, prototype, identifiers);
      group[key] = new Expression(EventBinding, result);
    } else {
      asProp = attrName.indexOf(':') < 0;
      group = asProp ? getGroup(node, 'props') : getGroup(node, 'attrs');
      switch (lastChar) {
        case BINDING_OPERATORS.DATA: // last char is '@'
          key = asProp ? 
                viewEngine.toCamelCase(attrName.slice(0, -1)) : 
                attrName.slice(1, -1);
          result = PrimaryLiteralParser.tryParse(attrValue);
          if (result != null) {
            group[key] = result;
          } else {
            result = DataBindingParser.parse(attrValue, prototype, identifiers);
            group[key] = new Expression(DataBinding, result);
          }
          break;
        case BINDING_OPERATORS.TEXT: // last char is '#'
          key = asProp ? 
                viewEngine.toCamelCase(attrName.slice(0, -1)) : 
                attrName.slice(1, -1);
          try {
            result = FragmentBindingParser.parse(attrValue, prototype, identifiers);
          } catch (e) {
            // eslint-disable-next-line no-undef
            {
              if (e.code === 1001) {
                e.expr = BINDING_FORMAT.replace('0', e.expr);
              }
            }
            throw e;
          }
          if (result) {
            result.asStr = true;
            group[key] = new Expression(FragmentBinding, result);
          } else {
            group[key] = attrValue;
          }
          break;
        default:
          key = asProp ? viewEngine.toCamelCase(attrName) : attrName;
          group[key] = viewEngine.isBoolProp(key) || attrValue;
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

  function getSnapshot(htmx, expr, node, start) {
    var i = htmx.indexOf(expr, start);
    var j = htmx.indexOf('\n', i + expr.length);
    j = j > 0 ? j : htmx.length;
    if (j > i + expr.length * 4) {
      j = i + expr.length * 4;
    }
    return [
      htmx.slice(node.range[0], i) + '%c' + expr + '%c' + htmx.slice(i + expr.length, j), 
      'color:red;', 
      ''
    ]
  }

  function parseAttributes(htmx, from, node, prototype) {
    var idx = from, start = from, stop = from, end = htmx.length;
    var cc, attrName, attrNames;//, operator, attributes = [];
    while (idx < end) {
      cc = htmx[idx];
      if (attrName) {
        if (!WHITE_SPACE_REGEXP.test(cc)) {
          if (cc === '"' || cc === "'") {
            start = idx + 1;
            stop = htmx.indexOf(cc, start);
          } else {
            start = idx;
            stop = getStopOf(TAGNAME_STOP, htmx, start);
          }

          stop = stop > 0 ? stop : end;

          if (node) {
            try {
              if (isDirective(attrName)) {
                parseDirective(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
              } else {
                parseAttribute(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
              }
            } catch(e) {
              // eslint-disable-next-line no-undef
              {
                if (e.code === 1001) {
                  var snapshot = getSnapshot(htmx, e.expr, node, start);
                  logger.warn((e.desc || e.message) + ' In the template of component ' 
                    + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
                    + snapshot[0], snapshot[1], snapshot[2]);
                }
              }
              throw e;
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
          attrNames = htmx.slice(start, stop).trim().split(WHITE_SPACES_REGEXP);
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
          attrNames = htmx.slice(start, stop).trim().split(WHITE_SPACES_REGEXP);
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

  function parseTextNode(htmx, start, stop, parent, prototype, identifiers) {
    var children = parent.children || [], result;
    var text = htmx.slice(start, stop);
    if (FragmentBindingParser.like(text)) {
      try {
        result = FragmentBindingParser.parse(text, prototype, identifiers);
      } catch (e) {
        // eslint-disable-next-line no-undef
        {
          if (e.code === 1001) {
            var snapshot = getSnapshot(htmx, BINDING_FORMAT.replace('0', e.expr), parent, start);
            logger.warn((e.desc || e.message) + ' In the template of component ' 
                    + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
                    + snapshot[0], snapshot[1], snapshot[2]);
          }
        }
        throw e;
      }
      if (result) {
        children.push(new Expression(FragmentBinding, result));
      } else {
        children.push(decodeHTML(text));
      }
    } else {
      children.push(decodeHTML(text));
    }

    parent.children = children;
  }

  function parseHTMX(htmx, prototype) {
    htmx = htmx.trim();

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
      identifiers: ['this']
    };
    parents.push(parent);

    while (idx < end) {
      cc = htmx[idx];
      if (cc === '<') {
        nc = htmx[idx + 1];
        if (LETTER_REGEXP.test(nc)) {
          if (start < idx) {
            parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
          }

          start = idx + 1;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
          tagName = htmx.slice(start, stop);
     
          node = {};
          node.tag = tagName;
          node.__extag_node__ = true;

          // eslint-disable-next-line no-undef
          {
            node.range = [start-1, -1];
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
          if (node.type == null && CAPITAL_REGEXP.test(tagName)) {
            var ctor = Path.search(tagName, prototype.constructor.resources);
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
              case 'x:frag':
                node.type = Fragment;
                break;
              // case 'x:block':
              //   node.type = Block;
              //   break;
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

          // eslint-disable-next-line no-undef
          {
            node.range[1] = stop;
          }

          idx = stop + 1;
          start = stop = idx;
          continue;
        } else if ('/' === nc && LETTER_REGEXP.test(htmx[idx + 2])) {
          if (start < idx) {
            parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
          }

          start = idx + 2;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
          tagName = htmx.slice(start, stop);
          // console.log('end tag: ' + htmx.slice(start, stop))
          if (tagName !== parent.tag) {
            // eslint-disable-next-line no-undef
            {
              var snapshot = getSnapshot(htmx, tagName, parent, start);
              logger.warn('Unclosed tag `' + parent.tag + '`. In the template of component ' 
                    + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
                    + snapshot[0], snapshot[1], snapshot[2]);
            }
            throwError('Unclosed tag ' + parent.tag);
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
          if (start < idx) {
            parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
          }
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
      parseTextNode(htmx, start, end, parent, prototype, parent.identifiers);
    }

    // if (parent) {
    //   throw new Error('Unclosed tag ' + parent.tagName);
    // }

    return parents;
  }

  var HTMXParser = {
    parse: function(htmx, prototype) {
      viewEngine = viewEngine || config.get(VIEW_ENGINE);

      var constructor = prototype.constructor;
      var nodes = parseHTMX(htmx, prototype);
      var children = nodes[0].children;
      var root = children[0];

      if (children.length !== 1) {
        throwError('The template of Component ' + (constructor.fullName || constructor.name) + ' must have only one root tag.');
      }
      if (root.tag === '!' || root.tag === '#') {
        throwError('Component template root tag must be a DOM element, instead of: ' + htmx.slice(0, htmx.indexOf('>')));
      }
      if (root.type) {
        if (root.tag === 'x:frag' && root.type === Fragment) {
          root.type = null;
        } else if (root.tag === 'x:slot' || root.tag === 'x:view') {
          throwError(root.tag + ' can not be used as root tag of component template: ' + htmx.slice(0, htmx.indexOf('>')));
        } else {
          throwError('component can not be used as root tag of another component template: ' + htmx.slice(0, htmx.indexOf('>')));
        }
      } else if (root.xif || root.xfor || root.xkey) {
        throwError('`x:if`, `x:for`, `x:key` can not be used on root tag of component template: '  + htmx.slice(0, htmx.indexOf('>')));
      }
      return root;
    }
  };

  config.HTMXParser = HTMXParser;

  /* eslint-disable no-unused-vars */


  if (typeof window !== 'undefined' && window.ExtagDom) {
    config.set('view-engine', window.ExtagDom);
  }

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
    help: help,
    // assign: assign, 
    // defineProp: defineProp, 
    defineClass: defineClass, 
    // setImmediate: setImmediate,
    // slice: slice,
    // flatten: flatten,
    // toClasses: toClasses,
    // encodeHTML: encodeHTML,
    // decodeHTML: decodeHTML,

    // base
    // Accessor: Accessor,
    // Expression: Expression,
    // Generator: Generator,
    // Parent: Parent,
    // Path: Path,
    // Schedule: Schedule,
    // DirtyMarker: DirtyMarker,
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
    // Slot: Slot,
    Text: Text, 
    Element: Element, 
    // Fragment: Fragment,
    Component: Component,

    // bindings
    // Binding: Binding,
    // DataBinding: DataBinding,
    // EventBinding: EventBinding,

    // parsers
    // HTMXParser: HTMXParser,
    // EvaluatorParser: EvaluatorParser,
    // DataBindingParser: DataBindingParser,
    // EventBindingParser: EventBindingParser,

    // template
    
    // Evaluator: Evaluator,

    // JSXEngine: JSXEngine,
    // HTMXEngine: HTMXEngine,
    node: JSXParser.node,
    expr: JSXParser.expr,

    // eslint-disable-next-line no-undef
    version: "0.2.1"
  };

  return Extag;

})));
