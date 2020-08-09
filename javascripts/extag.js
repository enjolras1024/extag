/**
 * Extag v0.3.1
 * (c) 2017-present enjolras.chen
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
        path = Path.parse(path);
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

  // src/share/constants.js 

  // shell type
  var TYPE_FRAG = 0;
  var TYPE_ELEM = 1;
  var TYPE_TEXT = 3;

  // event flags
  var FLAG_NONE = 0;
  var FLAG_ONCE = 4;
  var FLAG_PASSIVE = 2;
  var FLAG_CAPTURE = 1;

  // change flags
  var FLAG_CHANGED_CACHE = 1;
  var FLAG_CHANGED_CHILDREN = 2;
  var FLAG_CHANGED_COMMANDS = 4;
  var FLAG_WAITING_UPDATING = 8;
  var FLAG_WAITING_DIGESTING = 16;
  var FLAG_SHOULD_RENDER_TO_VIEW = (FLAG_CHANGED_CACHE | FLAG_CHANGED_CHILDREN | FLAG_CHANGED_COMMANDS);
  var FLAG_MOUNTED = 32;
  var FLAG_DESTROYED = 64;

  // symbols
  var EXTAG_VNODE = Object.freeze({});

  var VIEW_ENGINE = 'view-engine';
  var EMPTY_OBJECT = {};
  var EMPTY_ARRAY = [];
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

  // src/share/functions.js 

  var slice = Array.prototype.slice;
  var defineProp = Object.defineProperty;
  var hasOwnProp = Object.prototype.hasOwnProperty;
  var getOwnPropDesc = Object.getOwnPropertyDescriptor;

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

  var assign = function assign(target/*,..sources*/) {
    var source, key, i, n = arguments.length;
    for (i = 1; i < n; ++i) {
      source = arguments[i];
      if (!(source instanceof Object)) {
        continue;
      }
      for (key in source) {
        if (hasOwnProp.call(source, key)) {
          target[key] = source[key];
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

  function defineProps(target, sources) {
    var i, n, source;
    for (i = 0, n = sources.length; i < n; ++i) {
      source = sources[i];
      for (var key in source) {
        if (hasOwnProp.call(source, key)) {
          defineProp(target, key, getOwnPropDesc(source, key));
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

  function decodeHTML(html) {
    if (!HTML_CHAR_ENTITY_REGEXP.test(html)) {
      return html;
    }

    return  html.replace(/&nbsp;/g, String.fromCharCode(160))
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
  }

  function throwError(err, opts) {
    var error = err instanceof Error ? err : new Error(err);
    if (opts) {
      assign(error, opts);
    }
    throw error;
  }

  // src/base/Watcher.js

  function Watcher() {
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
      if (action && action.head) {
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

  // src/share/logger.js 

  function log(fn, args, prefix) {
    args = slice.call(args, 0);
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
        return new Generator(ctor, slice.call(arguments, 1));
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

  var EMPTY_DESC = {};

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

  function getDefaultGetter(key) {
    return function(props) {
      return props[key];
    }
  }

  function defineGetterSetter(target, key) {
    descriptorShared.get = makeGetter(key);
    descriptorShared.set = makeSetter(key);
    defineProp(target, key, descriptorShared);
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

  function applyAttributeDescriptors(target, descriptors) {
    if (hasOwnProp.call(target, '__extag_descriptors__')) {
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
    var _descriptors = assign({}, target.__extag_descriptors__, descriptors);

    var key, desc;

    for (key in descriptors) { // define getter/setter for each key
      if (hasOwnProp.call(descriptors, key)) {
        if (key in target) {
          // eslint-disable-next-line no-undef
          {
            logger.warn('`' + key + '` is already defined in the target of ' + target.constructor);
          }
          continue;
        }
        desc = descriptors[key];
        if (typeof desc !== 'object') {
          _descriptors[key] = {value: desc};
        } else if (desc instanceof Generator) {
          _descriptors[key] = {value: desc};
        } else {
          if (desc) {
            if (desc.get && !desc.set) ; else if (desc.set && !desc.get) {
              desc.get = getDefaultGetter(key);
            }
            _descriptors[key] = desc;
          } else {
            _descriptors[key] = EMPTY_DESC;
          }
        }
        // desc = _descriptors[key];
        // if (!('bindable' in  desc)) {
        //   desc.bindable = true; // will dispatch `changed` event, default true
        // }
        // if (desc.bindable) {
          defineGetterSetter(target, key);
        // }
      }
    }

    defineProp(target, '__extag_descriptors__', {
      value: _descriptors,
      configurable: true,
      enumerable: false,
      writable: false
    });
  }

  /**
   * Get the descriptor of the attribute.
   * @param {Object} target 
   * @param {string} attrName 
   */
  function getAttrDesc(target, attrName) {
    return target.__extag_descriptors__ ? target.__extag_descriptors__[attrName] : null;
  }

  function Accessor() {
    throw new Error('Accessor is a partial class for mixins and can not be instantiated');
  }

  defineClass({
    constructor: Accessor,

    statics: {
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
    }
  });

  // src/base/Validator.js

  function getType(value) {
    if (value instanceof Object) {
      var constructor = value.constructor;
      return  constructor.fullname || constructor.name;
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
      t = type.fullname || type.name;
      error = true;
    }

    if (error) {
      constructor = target.constructor;
      return makeTypeError(constructor.fullname || constructor.name, key, t, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t = typeof type[i];
        if ((t === 'string' && typeof value === type[i]) || (t === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = target.constructor;
        return makeTypesError(constructor.fullname || constructor.name, key, type, getType(value));
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

    if (!desc || !desc.type && !desc.test) { return; }

    var trouble, test, type;

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

    test = desc.test; // TODO: desc.test
    if (test) {
      if (typeof test === 'function') {
        trouble = test.call(target, value, key);
      } else {
        trouble = validatePattern(target, key, value, test);
      }
    }

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
   *      test: /\d{13}/
   *    },
   *    price: {
   *      type: 'number',
   *      test: function() {...} // returns error or not
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
          logger.warn('Attribute Validation:', 'required `' + key + '` for component ' + (target.constructor.fullname || target.constructor.name));
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
          object._dirty = dirty;
          // defineProp(object, '_dirty', {
          //     value: dirty, enumerable: false, writable: true, configurable: true}
          // );
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
        if (object._dirty) {
          if (!key) {
            object._dirty = null;
          } else {
            delete object._dirty[key];
          }
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

  var setImmediate = (function(Promise, MutationObserver, requestAnimationFrame) {
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

    return setTimeout;
  })(
    typeof Promise !== 'undefined' && isNativeFunc(Promise) ? Promise : null,
    typeof MutationObserver !== 'undefined' && isNativeFunc(MutationObserver) ? MutationObserver : null,
    typeof requestAnimationFrame !== 'undefined' && isNativeFunc(requestAnimationFrame) ? requestAnimationFrame : null
  );

  var updateQueue = []; 
  var digestQueue = [];
  var callbackQueue = [];
  var updateQueueCursor = 0;
  var digestQueueCursor = 0;
  var waiting = false;
  var turn = 0;

  function flushQueues() {
    try {
      turn++;
      updateQueueCursor = 0;

      var shell, i;
    
      // quene may be lengthen if the method `invalidate` is called when updating
      while (updateQueueCursor < updateQueue.length) {
        shell = updateQueue[updateQueueCursor];
        shell.update();
        ++updateQueueCursor;
      }
    
      updateQueue.length = 0;
      updateQueueCursor = -1;

      digestQueueCursor = 0;
      while (digestQueueCursor < digestQueue.length) {
        shell = digestQueue[digestQueueCursor];
        shell.digest();
        ++digestQueueCursor;
      }

      digestQueue.length = 0;
      digestQueueCursor = -1;
    
      for (i = callbackQueue.length - 1; i >= 0; --i) {
          callbackQueue[i]();
      }

      callbackQueue.length = 0;

      waiting = false;
    } catch (e) {
      updateQueueCursor = -1;
      digestQueueCursor = -1;
      updateQueue.length = 0;
      digestQueue.length = 0;
      callbackQueue.length = 0;
      waiting = false;
      throw e;
    }
  }

  function binarySearch(id, i, j, queue) {
    var m, guid;
    while (i <= j) {
      m = (i + j) >> 1;
      guid = queue[m].$meta.guid;
      if (id > guid) {
        i = m + 1;
      } else if (id < guid) {
        j = m - 1;
      } else {
        return i;
      }
    }
    return -i-1;
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
    var i, n = updateQueue.length, id = shell.$meta.guid;

    if (n > 0 && id > updateQueue[n-1].$meta.guid) {
      i = n;
    } /*else if (n === 0) {
      i = n;
    }*/ else {
      var index = binarySearch(id, updateQueueCursor + 1, updateQueue.length - 1, updateQueue);
      if (index < 0) {
        i = - index - 1;
      } else {
        return;
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
    }
  }

  /**
     * Insert a shell into the digestQueue.
     * @param {Shell} shell 
     */
    function insertDigestQueue(shell) {
      var i, n = digestQueue.length, id = shell.$meta.guid;

      if (n > 0 && id > digestQueue[n-1].$meta.guid) {
        i = n;
      } /*else if (n === 0) {
        i = n;
      }*/ else {
        var index = binarySearch(id, digestQueueCursor + 1, digestQueue.length - 1, digestQueue);
        if (index < 0) {
          i = - index - 1;
        } else {
          return;
        }
      }

      if (i === n) {
        digestQueue.push(shell);
      } else {
        digestQueue.splice(i, 0, shell);
      }

      if (!waiting) {
        waiting = true;
        setImmediate(flushQueues);
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
    setImmediate: setImmediate,
    insertUpdateQueue: insertUpdateQueue,
    insertDigestQueue: insertDigestQueue,
    pushCallbackQueue: pushCallbackQueue
  };

  // src/core/Dependency.js

  // refer to Vue (https://vuejs.org/)
  var _binding;
  var _bindingStack = [];

  var Dependency = {
    // binding: function() {
    //   return _binding != null;
    // },
    begin: function begin(binding) {
      _binding = binding;
      _binding.depsCountNew = 0;
      _binding.depsCountOld = 0;
      _binding.executeTimes = _binding.executeTimes ? _binding.executeTimes + 1 : 1;
      _bindingStack.push(binding);
    },
    end: function end() {
      if (_binding == null) { return; }
      // remove old dep
      if (_binding.depsCountOld < _binding.depsCount) {
        var i, dep, deps = _binding.deps;
        for (i = deps.length - 1; i >= 0; --i) {
          dep = deps[i];
          if (dep.times !== _binding.executeTimes) {
            dep.src.off('changed', _binding.invalidate);
            deps.splice(i, 1);
          }
        }
      }
      _binding.depsCount = _binding.depsCountOld + _binding.depsCountNew;
      //
      _bindingStack.pop();
      if (_bindingStack.length) {
        _binding = _bindingStack[_bindingStack.length - 1];
      }
    },
    add: function(src, key) {
      if (_binding == null) { return; }
      // collect keys
      var keys = _binding.keys;
      if (keys) {
        if (keys.indexOf(key) < 0) {
          keys.push(key);
        }
      } else {
        _binding.keys = [key];
      }
      // collect or update deps
      var i, dep, deps = _binding.deps;
      if (deps) {
        for (i = 0; i < deps.length; ++i) {
          dep = deps[i];
          if (dep.src === src) {
            if (dep.times < _binding.executeTimes) {
              dep.times = _binding.executeTimes;
              _binding.depsCountOld++;
            }
            return;
          }
        }
      } else {
        deps = _binding.deps = [];
      }
      // add new dep
      _binding.depsCountNew++;
      src.on('changed', _binding.invalidate);
      deps.push({
        src: src,
        times: _binding.executeTimes
      });
    },
    clean: function(binding) {
      var deps = binding.deps;
      if (!deps) { return; }
      for (var i = 0; i < deps.length; ++i) {
        deps[i].src.off('changed', binding.invalidate);
      }
      binding.deps = null;
      binding.keys = null;
    }
  };

  // src/core/models/Model.js

  function assignProps(model, props) {
    var key, desc;
    for (key in props) {
      if (hasOwnProp.call(props, key)) {
        if (Accessor.getAttrDesc(model, key)) {
          model.set(key, props[key]);
        } else {
          desc = getOwnPropDesc(props, key);
          if (!desc.get && !desc.set) {
            Accessor.defineGetterSetter(model, key);
            model.set(key, desc.value);
          } else {
            defineProp(model, key, desc);
          }
        }
      }
    }
  }

  /**
   * Model for storing data and emit `changed` event with declaration.
   * It is like Component, but there is nothing to do with view, just the model.
   * @class
   * @constructor
   * @param {Object} props 
   */
  function Model(props) {
    Model.initialize(this, props);
  }

  defineClass({
    constructor: Model,

    mixins: [Accessor.prototype, Watcher.prototype],

    statics: {
      create: function create(props) {
        return new Model(props);
      },

      initialize: function initialize(model, props) {
        var constructor = model.constructor, defaults;
        if (constructor !== Model && constructor.attributes) {
          Accessor.applyAttributeDescriptors(
            constructor.prototype, 
            constructor.attributes
          ); 
          defaults = Accessor.getAttributeDefaultValues(model);
          defineProp(model, '_props', {
            value: defaults, writable: false, enumerable: false, configurable: true
          });
          // eslint-disable-next-line no-undef
          {
            Validator.validate0(model, props);
          }
        } else {
          defineProp(model, '_props', {
            value: {}, writable: false, enumerable: false, configurable: true
          });
        }
        if (props) {
          assignProps(model, props);
        }
      }
    },

    /**
     * Get custom attribute
     * @param {string} key
     */
    get: function get(key) {
      Dependency.add(this, key);
      var desc = Accessor.getAttrDesc(this, key);
      return !desc || !desc.get ? 
                  this._props[key] : 
                    desc.get.call(this, this._props);
    },

    /**
     * Set custom attribute
     * @param {string} key
     * @param {*} val
     */
    set: function set(key, val) {
      var desc = Accessor.getAttrDesc(this, key);
      // validation in development 
      // eslint-disable-next-line no-undef
      {
        Validator.validate(this, key, val, true);
      }
      // Custom attribute in _props
      var props = this._props, old;
      if (!desc || !desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
        old = props[key];
        if (old !== val) {
          props[key] = val;
          this.emit('changed', key, val);
        }
      } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
        old = desc.get.call(this, props);
        desc.set.call(this, val, props);
        val = desc.get.call(this, props);
        if (old !== val) {
          this.emit('changed', key, val);
        }
      }
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
    // defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
    // defineProp(this, '_props', {value: {}/*, configurable: true*/});
    this._owner = owner || EMPTY_OWNER;
    this._props = {};
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
        this._owner.invalidate(FLAG_CHANGED_CACHE);
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

  // src/share/config.js 

  var _configuration = {};

  var config = {
    get: function get(name) {
      return _configuration[name];
    },
    set: function set(name, value) {
      _configuration[name] = value;
    }
  };

  // src/core/shells/Shell.js

  var shellGuid = 0;

  var defaultViewEngine = null;

  function Shell() {
    throw new Error('Shell is a base class and can not be instantiated');
  }

  defineClass({
    constructor: Shell,

    mixins: [Watcher.prototype, Accessor.prototype, DirtyMarker.prototype],

    /**
     * invalidate this shell and insert it to the schedule, so this shell can be updated and rendered in async mode.
     * @param {number} flag - 1: changed things, 2: changed children, 4: changed commands
     */
    invalidate: function invalidate(flag) {
      if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
        this.$flag |= FLAG_WAITING_UPDATING;
        Schedule.insertUpdateQueue(this);
      }
      if (flag && (this.$flag & flag) === 0) {
        this.$flag |= flag;
      }
    },

    update: function() {
      throw new Error('The method `update` must be implemented by sub-class');
    },

    digest: function() {
      throw new Error('The method `digest` must be implemented by sub-class');
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
        throw new Error('Fragment and component using <x:frag> as root tag, can not attach a skin.')
      }
      
      var viewEngine = Shell.getViewEngine(this);
      // eslint-disable-next-line no-undef
      {
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

      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        this.$flag |= FLAG_WAITING_DIGESTING;
        Schedule.insertDigestQueue(this);
      }
    },

    /**
     * detach the skin from this shell, and destroy itself firstly.
     */
    detach: function detach() {
      // var parent = this._parent;
      // if (parent && !parent._parent) {
      //   this._parent = null;
      //   parent.detach();
      //   return;
      // }

      if (this.$owner) {
        this.$owner = null;
      }

      this.constructor.destroy(this);

      var $skin = this.$skin;
      if ($skin) {
        var viewEngine = Shell.getViewEngine(this);
        viewEngine.detachShell($skin, this);
        this.$skin = null;
      }
    },

    // getSkin: function getSkin() {
    //   return this.$skin;
    // },

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
      return (ctor.fullname || ctor.name) + '<' + meta.tag + '>(' + meta.guid + ')';
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
        if (type !== TYPE_TEXT && !hasOwnProp.call(shell, '_props')) {
          shell._props = {};
        }

        shell.$flag = 0;
        
        shell.$meta = {
          guid: shellGuid++,
          type: type,
          tag: tag,
          ns: ns
        };
        // eslint-disable-next-line no-undef
        {
          if (Object.freeze) {
            shell.$meta = Object.freeze(shell.$meta);
          }
        }
      },

      /**
       * destroy the shell, including removing event linsteners and data bindings, and detaching skin
       * @param {Shell} shell
       */
      destroy: function(shell) {
        if (shell.$flag & FLAG_DESTROYED) { return; }
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
            child.constructor.destroy(child);
            child._parent = null;
          }
          shell._children.length = 0;
        }
        // detaching
        // var $skin = shell.$skin;
        // if ($skin) {
        //   var viewEngine = Shell.getViewEngine(shell);
        //   viewEngine.detachShell($skin, shell);
        //   shell.$skin = null;
        // }
        shell.$flag |= FLAG_DESTROYED;
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
        var $skin = shell.$skin;
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
        var $skin = shell.$skin;
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
          flag = handler.flag & (FLAG_CAPTURE | FLAG_PASSIVE);
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

  // src/base/Parent.js

  /**
   * Parent is in charge of its children.
   * @class
   * @constructor
   */
  function Parent() {
    throwError('Parent is a base class and can not be instantiated!');
  }

  function findParent(shell) {
    var temp = shell._parent;
    while (temp && temp.$meta.type === TYPE_FRAG) {
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
      if (child.$meta.type === TYPE_FRAG) {
        flattenChildren(child, array);
      } else {
        array.push(child);
      }
    }
    return array;
  }

  var removed = [];
  var inQueue = false;
  function collectRemovedChild(child) {
    removed.push(child);
    if (!inQueue) {
      inQueue = true;
      Schedule.pushCallbackQueue(cleanRemovedChildren);
    }
  }
  function cleanRemovedChildren() {
    for (var i = 0; i < removed.length; ++i) {
      var child = removed[i];
      if (!child._parent) {
        child.detach();
      }
    }
    removed.length = 0;
    inQueue = false;
  }

  defineClass({
    constructor: Parent, // mixins: [Watcher.prototype],

    statics: {
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
          return;
        }
      }
   
      if (m) {
        for (i = 0; i < m; ++i) {
          _children[i]._parent = null;
          collectRemovedChild(_children[i]);
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

      var i, j, n, children = this._children;

      if (!children) {
        children = [];
        this._children = children;
        // defineProp(this, '_children', {
        //   value: children, writable: false, enumerable: false, configurable: true
        // });
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
          return; 
        }
      } else {
        i = n;
      }

      if (child._parent) {
        if (child._parent === this) {
          for (j = 0; j < n; ++j) {
            if (children[j] === child) {
              if (j === i) {
                return;
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
      collectRemovedChild(child);
      this.invalidate(FLAG_CHANGED_CHILDREN);
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
        return; 
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

      collectRemovedChild(existed);
      existed._parent = null;
      child._parent = this;
      children[i] = child;

      this.invalidate(FLAG_CHANGED_CHILDREN);
    }
  });

  // src/core/shells/Text.js



  function Text(content) {
    Text.initialize(this, content);
  }

  defineClass({
    constructor: Text, extends: Shell,

    statics: {
      // /**
      //  * Create a text.
      //  * @param {string} content - as text content
      //  */
      // create: function(content) {
      //   return new Text(content);
      // },

      /**
       * initialize the text with content.
       * @param {Text} text
       * @param {string} content
       */
      initialize: function(text, content) {
        // eslint-disable-next-line no-undef
        {
          if (text.constructor !== Text) {
            throw new TypeError('Text is final class and can not be extended');
          }
        }
        Shell.initialize(text, TYPE_TEXT, '', '');
        text.set('content', content || '');
      }
    },

    get: function(key) {
      if (key === 'content') {
        return this._content;
      }
    },

    set: function(key, value) {
      if (key === 'content' && value !== this._content) {
        this._dirty = true;
        this._content = value;
        this.invalidate(FLAG_CHANGED_CACHE);
      }
    },

    /**
     * Update this shell and append it to the schedule for rendering.
     * @param {boolean} force - If true, update this shell anyway.
     */
    update: function update() {
      if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
        return false;
      }
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }
      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        this.$flag |= FLAG_WAITING_DIGESTING;
        Schedule.insertDigestQueue(this);
      }
      // this.$flag ^= FLAG_WAITING_UPDATING;
      // this.digest();
    },

    /**
     * Render the dirty parts of this shell to the attached skin 
     */
    digest: function digest() {
      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        return false;
      }
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }

      if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
        var viewEngine = Shell.getViewEngine(this);
        // if (!viewEngine) { return this; }
        viewEngine.renderShell(this.$skin, this);
        // DirtyMarker.clean(this);
        this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
        this._dirty = false;
      }

      if (this.$skin && (this.$flag & FLAG_MOUNTED === 0)) {
        this.$flag |= FLAG_MOUNTED;
      }

      this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
      // this.$flag = FLAG_NORMAL;
    },

    getParent: Parent.prototype.getParent,

    /**
     * return text content snapshot and its guid.
     * @override
     */
    toString: function() {
      var content = this._content;
      content = content == null ? '' : content.toString();
      return '"' + (content.length < 24 ? content : (content.slice(0, 21) + '...'))  + '"(' + this.$meta.guid +')';
    }
  });

  // src/core/template/HTMXEngine.js

  var HTMXEngine = {
    driveComponent: null,
    transferProps: null,
    createContent: null,
    makeContent: null,
    parseHTMX: null,
    parseJSX: null
  };

  // src/core/shells/Element.js
  // import config from 'src/share/config'

  // function buildCache(element) {
  //   var cache = new Cache(element);
  //   cache.owner = element;
  //   return cache;
  // }

  /**
   * 
   * @param {string} tag      - tag name, with a namespace as prefix, e.g. 'svg:rect'
   * @param {Object} props 
   */
  function Element(tag, props) {
    var idx = tag.indexOf(':'), ns = '';
    if (idx > 0) {
      ns = tag.slice(0, idx);
      tag = tag.slice(idx + 1);
    }
    Element.initialize(this, ns, tag, props);
  }

  defineClass({
    constructor: Element, extends: Shell, mixins: [Parent.prototype],

    statics: {
      __extag_element_class__: true,

      initialize: function initialize(element, ns, tag, props) {
        // eslint-disable-next-line no-undef
        {
          if (element.constructor !== Element) {
            throw new TypeError('Element is final class and can not be extended');
          }
        }

        Shell.initialize(element, TYPE_ELEM, tag, ns);

        Element.defineMembers(element);

        if (props) {
          element.assign(props);
        }
      },
      // /**
      //  * 
      //  * @param {string} tag      - tag name, maybe with a namespace as prefix, e.g. 'svg:rect'
      //  * @param {Object} props    - DOM properties
      //  */
      // create: function create(tag, props) {
      //   return new Element(tag, props);
      // },

      /**
       * Define getter/setter for attrs, style and classes
       * @param {Element|Component} element 
       */
      defineMembers: function defineMembers(element) {
        var prototype = element.constructor.prototype;
        if (!('classes' in prototype)) {
          // defineProp(prototype, 'attrs', {
          //   get: function() {
          //     if (!this._attrs) {
          //       this._attrs = new Cache(this);
          //       // defineProp(this, '_attrs', {
          //       //   value: new Cache(this), 
          //       //   configurable: true
          //       // });
          //     }
          //     return this._attrs;
          //   }//,
          //   // set: function(value) {
          //   //   resetCache(this.attrs, value);
          //   // }
          // });
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
     * Update this element and insert it into the schedule for rendering.
     */
    update: function update() {
      if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
        return false;
      }
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }

      HTMXEngine.transferProps(this);

      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        this.$flag |= FLAG_WAITING_DIGESTING;
        Schedule.insertDigestQueue(this);
      }

      // this.$flag ^= FLAG_WAITING_UPDATING;
      // this.digest();
    },

    /**
     * Render the dirty parts of this element to the attached skin 
     */
    digest: function digest() {
      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        return false;
      }

      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }

      if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
        var viewEngine = Shell.getViewEngine(this);

        viewEngine.renderShell(this.$skin, this);

        DirtyMarker.clean(this);
    
        // this._attrs && DirtyMarker.clean(this._attrs);
        this._style && DirtyMarker.clean(this._style);
        this._classes && DirtyMarker.clean(this._classes);

        if (this._commands) {
          this._commands = null;
        }

        this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
      }
      
      if (this.$skin && (this.$flag & FLAG_MOUNTED === 0)) {
        this.$flag |= FLAG_MOUNTED;
      }

      this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
    }
  });

  // src/core/bindings/Binding.js

  function Binding(scope, target, property, collect, reflect) {
    this.scope = scope;
    this.target = target;
    this.property = property;

    if (typeof collect === 'function') {
      this.invalidate = this.invalidate.bind(this);
      this.execute = this.execute.bind(this);
      this.collect = collect;
      this.flag = 1;
      this.execute();
      
      if (this.keys && this.keys.length) {
        Binding.record(target, this);
        this.scope.on('updating', this.execute);
      }

      if (typeof reflect === 'function') {
        this.reflect = reflect;
        this.backward = this.backward.bind(this);
        target.on('changed', this.backward);
      }
    }
  }

  defineClass({
    constructor: Binding,

    statics: {
       record: function record(target, binding) {
        var _bindings = target._bindings;

        if (_bindings) {
          _bindings.push(binding);
        } else {
          // target._bindings = [binding];
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

        if (typeof binding.reflect === 'function') {
          target.off('changed', binding.backward);
        }
        
        if (typeof binding.collect === 'function' && binding.keys) {
          scope.off('updating', binding.execute);
        }

        Dependency.clean(binding);

        // Binding.remove(scope, binding);
      }
    },

    destroy: function() {
      var target = this.target, scope = this.scope;

      if (typeof this.reflect === 'function') {
        target.off('changed', this.backward);
      }
      
      if (typeof this.collect === 'function' && this.keys) {
        scope.off('updating', this.execute);
      }

      Dependency.clean(this);

      // Binding.remove(scope, binding);
    },

    execute: function() {
      if (this.flag === 0) {
        return;
      }
      Dependency.begin(this);
      var value = this.collect.call(this.scope);
      Dependency.end();
      this.target.set(this.property, value);
      this.flag = 0;
    },

    backward: function(key) {
      if (key === this.property) {
        this.reflect.call(this.scope, this.target[this.property]);
      }
    },

    invalidate: function(key) {
      if (this.keys.indexOf(key) >= 0) {
        this.scope.invalidate();
        this.flag = 1;
      }
    }
  });

  // src/core/captureError.js

  function getParentComponent(component) {
    var parent = component.getParent();
    while (parent) {
      if (parent.constructor.__extag_component_class__) {
        return parent;
      }
      parent = parent.getParent();
    }
  }

  function captureError(error, component, phase) {
    var _stop;
    function stop() {
      _stop = true;
    }
    var solver = null;
    var target = component;
    var targets = [target];
    while (component) {
      if (!_stop) {
        component.emit('throwed', {
          targets: targets.slice(0),
          target: target,
          phase: phase,
          error: error,
          stop: stop
        });
        if (_stop) {
          solver = component;
        }
      }
      var parent = getParentComponent(component);
      if (parent) {
        component = parent;
        targets.push(parent);
      } else {
        component.emit('error', {
          targets: targets.slice(0),
          target: target,
          solver: solver,
          phase: phase,
          error: error
        });
        if (!solver) {
          logger.error('Unsolved error in phase `' + phase + '` from ', target);
          throw error;
        }
        break;
      }
    }
  }

  // src/core/shells/Component.js

  var shellProto = Shell.prototype;

  var KEYS_PRESERVED = [
    '$meta', '$flag', '$skin', 
    'style', 'classes', 'contents', 'children', 
    '_dirty', '_props', '_style', '_classes', '_children'
  ];
  var METHODS_PRESERVED = [
    'on', 'off', 'emit',
    'appendChild', 'insertChild', 'removeChild', 'replaceChild', 
    'getParent', 'getChildren', 'setChildren', 'getContents', 'setContents',
    'get', 'set', 'cmd', 'bind', 'assign', 'update', 'digest', 'attach', 'detach', 'invalidate'
  ];

  /**
   * 
   * @param {Object}    props       - component attributes and DOM properties
   * @param {Array}     scopes      - Internal use, including the host component and iterator variable from x:for loop
   * @param {Object}    template    - Internal use, for initializing component attributes, contents and events
   */
  function Component(props, scopes, template) {
    Component.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Component, extends: Shell, mixins: [Parent.prototype],

    statics: {
      
      __extag_component_class__: true,

      // /**
      //  * Creating a component
      //  *
      //  * @param {Function}  ctor        - component constructor or class
      //  * @param {Object}    props       - component attributes and DOM properties
      //  * @returns {Component}
      //  */
      // create: function create(ctor, props) {
      //   return new ctor(props);
      // },

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
        {
          if (!_template) {
            (function() {
              var i, keys;
              var name = constructor.fullname || constructor.name;
              if (attributes) {
                keys = Array.isArray(attributes) ? attributes : Object.keys(attributes);
                for (i = 0; i < KEYS_PRESERVED.length; ++i) {
                  if (keys.indexOf(KEYS_PRESERVED[i]) >= 0) {
                    logger.warn('`' + KEYS_PRESERVED[i] + '` is a preserved component property, cannot be an attribute of component ' + name + '.');
                  }
                }
              }
              // check if some final methods are override
              for (i = 0; i < METHODS_PRESERVED.length; ++i) {
                if (prototype[METHODS_PRESERVED[i]] !== Component.prototype[METHODS_PRESERVED[i]]) {
                  logger.warn('`' + METHODS_PRESERVED[i] + '` is a preserved component method. You should be careful to override the method of component ' + name + '.');
                }
              }
            })();
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
            if (!constructor.template) {
              constructor.template = '<x:frag></x:frag>';
            }
            if (typeof constructor.template === 'string') {
              _template = HTMXEngine.parseHTMX(constructor.template, prototype);
            } else if (typeof constructor.template === 'function') {
              _template = HTMXEngine.parseJSX(constructor.template, prototype);
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
      {
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
     * Update this shell and append it to the schedule for digesting.
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
          HTMXEngine.transferProps(this);
        }
      } /*else if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
        this._parent.invalidate(FLAG_CHANGED_CHILDREN);
      }*/ 
      // else {
      //   if (this.__props && this.__props.hasDirty('children')) {
      //     var children = this.__props.get('children') || [];
      //     DirtyMarker.clean(this.__props, 'children');
      //     if (!Array.isArray(children)) {
      //       children = [children];
      //     }
      //     HTMXEngine.driveChildren(this, [this], children, false);
      //   }
      //   // if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
      //   //   this._parent.invalidate(FLAG_CHANGED_CHILDREN);
      //   // }
      // }

      if (this.render && typeof this.render === 'function') {
        var children = this.render(this._props) || [];
        if (!Array.isArray(children)) {
          children = [children];
        }
        HTMXEngine.driveChildren(this, [this], children, false, true);
      }

      // DirtyMarker.clean(this, 'children');
      DirtyMarker.clean(this, 'contents');

      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        // If this type is 0, we should ask its parent to render parent's children,
        // since its children are belong to its parent actually.
        if (type === 0 && this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
          // this._parent.invalidate(2); 
          var parent = this.getParent(true);
          parent.$flag |= FLAG_CHANGED_CHILDREN;
          if ((parent.$flag & FLAG_WAITING_DIGESTING) === 0) {
            parent.$flag |= FLAG_WAITING_DIGESTING;
            Schedule.insertDigestQueue(parent);
          }
        }
        this.$flag |= FLAG_WAITING_DIGESTING;
        Schedule.insertDigestQueue(this);
        // this.digest();
      }

      // this.$flag ^= FLAG_WAITING_UPDATING;
      // this.digest();
    },

    /**
     * Digest the dirty parts of this shell, and render to the attached skin 
     */
    digest: function digest() {
      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        return;
      }
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }
      // if (this.$meta.type !== 0) {
      //   elementPropto.digest.call(this);
      // } else {
      //   fragmentProto.digest.call(this);
      // }
      if (this.$skin && this.$meta.type !== 0 && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
        var viewEngine = Shell.getViewEngine(this);

        viewEngine.renderShell(this.$skin, this);
   
        DirtyMarker.clean(this);
    
        // this._attrs && DirtyMarker.clean(this._attrs);
        this._style && DirtyMarker.clean(this._style);
        this._classes && DirtyMarker.clean(this._classes);

        // this.__attrs && DirtyMarker.clean(this.__attrs);
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
        if (actions && actions.mounted && (this.$flag & FLAG_MOUNTED)) {
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

      this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
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

  // src/core/shells/Slot.js

  function Slot(props, scopes, template) {
    Slot.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Slot, extends: Component,

    statics: {
      initialize: function initialize(slot, props, scopes, template) {
        var name = template && template.props && template.props.name;

        Component.initialize(slot, props, scopes, {
          props: {
            name: name || ''
          }
        });
        
        scopes[0].on('updating', slot.onScopeUpdating.bind(slot));

        if (template.children) {
          var contents = template.children.slice(0);
          contents.scopes = scopes;
          slot.set('contents', contents);
        }

        slot.scopes = scopes;
      },
      template: '<x:frag></x:frag>'
    },

    update: function update() {
      if (this.hasDirty('collection') || this.hasDirty('contents')) {
        var scopes = this.scopes;
        var contents = this.get('contents');
        var collection = this.get('collection');
        if (collection && collection.length) {
          scopes = collection.scopes;
          HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
        } else if (contents && contents.length) {
          scopes = contents.scopes;
          collection = contents.slice(0);
          HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
        } else {
          this.setChildern([]);
        }
        
        Component.prototype.update.call(this);
      }
    },

    onScopeUpdating: function onScopeUpdating() {
      var scopes = this.scopes;
      var content, name, n, i;
      var scopeContents;
      var collection;
      
      // var selfContents = this.get('contents');

      if (scopes[0].hasDirty('contents')) {
        collection = [];
        scopeContents = scopes[0].get('contents');
        if (scopeContents && scopeContents.length > 0) {
          name = this.get('name') || '';
          for (i = 0, n = scopeContents.length; i < n; ++i) {
            content = scopeContents[i];
            if (content != null && name === (content.slot || '')) {
              collection.push(content);
            }
          }
        }
        this.set('collection', collection);
      }

      // if (scopeContents && scopeContents.length > 0) {
      //   var name = this.get('name') || '';
      //   for (i = 0, n = scopeContents.length; i < n; ++i) {
      //     content = scopeContents[i];
      //     if (content != null && name === (content.slot || '')) {
      //       collection.push(content);
      //     }
      //   }
      //   this.set('collection', collection);
      //   // if (collection.length) {
      //   //   scopes = scopeContents.scopes;
      //   //   HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      //   // }
      //   // this.useDefault = false;
      // }

      // if (!collection.length && selfContents) {
      //   // use the default template to slot here
      //   if (this.useDefault) {
      //     return;
      //   }
      //   for (i = 0, n = selfContents.length; i < n; ++i) {
      //     content = selfContents[i];
      //     if (content != null) {
      //       collection.push(content);
      //     }
      //   }
      //   if (collection.length) {
      //     scopes = selfContents.scopes;
      //     HTMXEngine.driveChildren(this, scopes, collection, !!scopes);
      //   }
      //   this.useDefault = true;
      // }
    }
  });

  // import config from 'src/share/config'
  /**
   * Output dynamic component, <x:output x:type="Button"/>, just like <input type="button">
   * @param {Object} props 
   * @param {Array} scopes 
   * @param {Object} template 
   */
  function Output(props, scopes, template) {
    Output.initialize(this, props, scopes, template);
  }

  defineClass({
      constructor: Output,
      extends: Component,
      statics: {
        template: '<x:frag></x:frag>',
        initialize: function initialize(output, props, scopes, template) {
          var xtype = template && template.props && template.props.xtype;

          Component.initialize(output, props, scopes, {
            props: {
              xtype: xtype
            }
          });

          output.cache = new Cache(output);

          output.template = assign({}, template);
          output.template.props = assign({}, template.props);
          delete output.template.props.xtype;

          output.scopes = scopes;
          
          output.invalidate();
          output.on('updating', output.onUpdating.bind(output));
        }
      },
      onUpdating: function onUpdating() {
        var child, ctor, type;
        var cache = this.cache;
        var scopes = this.scopes;
        var template = this.template;

        if (this.hasDirty('xtype')) {
          type = this.get('xtype');
          if (typeof type === 'function') {
            if (type.__extag_component_class__) {
              cache.set('xctor', ctor);
            } else {
              var output = this;
              var promise = type();
              if (typeof promise === 'object' && promise instanceof Promise) {
                // cache.set('sign', sign);
                promise.then(function(ctor) {
                  cache.set('xctor', ctor);
                }).catch(function(error) {
                  cache.set('xctor', null);
                  output.emitError(error);
                });
              } else {
                cache.set('xctor', null);
                output.emitError();
              }
            }
          } else {
            cache.set('xctor', null);
            output.emitError();
          }
        }
        if (cache.hasDirty('xctor')) {
          ctor = cache.get('xctor');
          if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
            this.setChildren([]);
            return;
          }
          try {
            template.tag = '?';
            template.type = ctor;
            child = HTMXEngine.createContent(template, scopes);
            this.setChildren([child]);
          } catch (e) {
            this.setChildren([]);
            this.emitError(e);
          }
        }
        DirtyMarker.clean(cache);
      },
      emitError: function(error) {
        if (!error) {
          error = new TypeError('`' + this.get('xtype') + '` is not a component class, constructor or a function that returns promise!');
        }
        if (error instanceof Error) {
          this.emit('error', error);
        }
      }
  });

  // src/core/shells/Fragment.js

  // import config from 'src/share/config'

  function Fragment(props, scopes, template) {
    Fragment.initialize(this, props, scopes, template);
  }

  defineClass({
    constructor: Fragment, extends: Shell, mixins: [Parent.prototype],

    statics: {
      __extag_fragment_class__: true,

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
          template.connect('children', fragment, scopes);
          
        }

        
      }

      // create: function create(props, scopes, template) {
      //   return new Fragment(props, scopes, template);
      // }
    },
    /**
     * Update this shell and insert it into the schedule for rendering.
     */
    update: function update() {
      if ((this.$flag & FLAG_WAITING_UPDATING) == 0) {
        return;
      }
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }

      // if (this.onUpdating) {
      //   this.onUpdating();
      // }

      if (this.scopes && this.hasDirty('children')) {
        // var JSXEngine = config.JSXEngine;
        DirtyMarker.clean(this, 'children');
        var children = this.get('children') || [];
        if (!Array.isArray(children)) {
          children = [children];
        }
        // JSXEngine.reflow(this.scopes[0], this, contents);
        HTMXEngine.driveChildren(this, this.scopes, children, false);
      }

      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        if (this._parent && (this.$flag & FLAG_CHANGED_CHILDREN)) {
          var parent = this.getParent(true);
          parent.$flag |= FLAG_CHANGED_CHILDREN;
          if ((parent.$flag & FLAG_WAITING_DIGESTING) === 0) {
            parent.$flag |= FLAG_WAITING_DIGESTING;
            Schedule.insertDigestQueue(parent);
          }
        }
        this.$flag |= FLAG_WAITING_DIGESTING;
        Schedule.insertDigestQueue(this);
      }

      // this.$flag ^= FLAG_WAITING_UPDATING;
      // this.digest();
    },

    digest: function digest() {
      if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
        return false;
      }
      this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
      // if (this.$flag === FLAG_NORMAL) {
      //   return false;
      // }
      // this.$flag = FLAG_NORMAL;
      DirtyMarker.clean(this);
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

  function resolveSource(binding, scopes, identifiers) {
    var path = binding.path;
    var from = identifiers.indexOf(path[0]);
    binding.sourceProp = path[path.length - 1];
    if (from >= 0) {
      binding.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);
    } else {
      binding.source = Path.search(path.slice(1, path.length - 1), scopes[0].constructor.resources, true);
    }
  }

  // function isBindable(src, prop) {
  //   var desc = Accessor.getAttrDesc(src, prop);
  //   return desc && desc.bindable;
  // }

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
      create: function create(pattern) {
        return new DataBinding(pattern);
      }
    },

    connect: function connect(property, target, scopes) {
      this.flag = 0;
      this.scopes = scopes;
      this.target = target;
      this.targetProp = property;

      if (this.mode === MODES.ASSIGN) {
        this.target.set(this.targetProp, this.evaluate());
        return;
      }

      this.execute = this.execute.bind(this);
      this.invalidate = this.invalidate.bind(this);

      if (this.mode === MODES.TWO_WAY) {
        this.backward = this.backward.bind(this);
        resolveSource(this, scopes, this.identifiers);
        if (Accessor.getAttrDesc(this.target, this.targetProp)) {
          this.target.on('changed', this.backward);
        }
      }

      if (this.mode === MODES.ANY_WAY) {
        this.scopes[0].on('updating', this.execute);
        this.target.set(this.targetProp, this.evaluate());
      } else {
        this.flag = 1;
        this.execute();
        if (this.keys && this.keys.length) {
          scopes[0].on('updating', this.execute);
        }
      }

      Binding.record(target, this);
    },

    replace: function replace(scopes) {
      if (scopes.length > 1 && scopes.length === this.scopes.length) {
        if (this.mode === MODES.TWO_WAY) {
          resolveSource(this, scopes, this.identifiers);
        }
        this.scopes = scopes;
        this.flag = 1;
        this.execute();
      }

    },

    destroy: function destroy() {
      var scopes = this.scopes;

      if (this.mode === MODES.TWO_WAY)  {
        if (Accessor.getAttrDesc(this.target, this.targetProp)) {
          this.target.off('changed', this.backward);
        }
      }

      if (this.keys && this.keys.length) {
        scopes[0].off('updating', this.execute);
      }

      // Binding.remove(binding.target, binding);

      Dependency.clean(this);
    },

    evaluate: function() {
      var converters = this.converters;
      if (converters && converters.length) {
        return applyConverters(converters, this.scopes, this.evaluator.execute(this.scopes));
      } else {
        return this.evaluator.execute(this.scopes);
      }
    },

    execute: function execute() {
      if (this.mode === MODES.ANY_WAY) {
        this.target.set(this.targetProp, this.evaluate());
        return;
      }
      if (this.flag === 0) {
        return;
      }

      Dependency.begin(this);
      var value = this.evaluate();
      Dependency.end();
      this.target.set(this.targetProp, value);

      this.flag = 0;
      if (this.mode === MODES.ONE_TIME) {
        this.destroy();
      }
    },

    backward: function backward(key) {
      if (key === this.targetProp) {
        var value = this.target[this.targetProp];
        this.source.set(this.sourceProp, value);
      }
    },

    invalidate: function invalidate(key) {
      if (this.keys.indexOf(key) >= 0) {
        this.scopes[0].invalidate();
        this.flag = 1;
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
      create: function create(pattern) {
        return new EventBinding(pattern);
      }
    },

    connect: function connect(type, target, scopes) {
      this.type = type;
      this.target = target;

      var pattern = this.pattern;
      var handler = pattern.handler;
      var evaluator = pattern.evaluator;
      var modifiers = pattern.modifiers;

      if (handler) {
        var func = scopes[0][handler];
        
        if (!func) {
          // eslint-disable-next-line no-undef
          {
            logger.warn('No such handler method named `' + handler + '` in ' + scopes[0], scopes[0]);
          }
          return;
        }

        if (!modifiers || !modifiers.length) {
          this.handler = func;
        } else if (modifiers[0] === 'bind' && modifiers.length === 1) {
          this.handler = func.bind(scopes[0]);
        } else {
          this.handler = function(event) {
            processModifiers(modifiers, event);
            if (modifiers.indexOf('bind') >= 0) {
              func.apply(scopes[0], arguments);
            } else {
              func.apply(null, arguments);
            }
            
          };
          this.options = extractOptions(modifiers);
        }
      } else if (scopes.length <= 1) {
        if (!modifiers || !modifiers.length) {
          this.handler = function() {
            evaluator.execute(scopes);
          };
        } else {
          this.handler = function(event) {
            processModifiers(modifiers, event);
            evaluator.execute(scopes);
          };
          this.options = extractOptions(modifiers);
        }
        
      } else {
        this.scopes = scopes; // the 2nd scope may be replaced later in x:for loop.
        if (!modifiers || !modifiers.length) {
          this.handler = (function() {
            evaluator.execute(this.scopes);
          }).bind(this);
        } else {
          this.handler = (function(event) {
            processModifiers(modifiers, event);
            evaluator.execute(this.scopes);
          }).bind(this);
          this.options = extractOptions(modifiers);
        }
      }
      if (this.handler) {
        if (!this.options) {
          target.on(type, this.handler);
        } else {
          target.on(type, this.handler, this.options);
        }
        Binding.record(target, this);
      }
    },

    replace: function replace(scopes) {
      if (this.scopes && scopes.length > 1 
          && this.scopes.length === scopes.length) {
        this.scopes = scopes;
      }
    },

    destroy: function destroy() {
      var handler = this.handler;
      if (handler) {
        if (!this.options) {
          this.target.off(this.type, handler);
        } else {
          this.target.off(this.type, handler, this.options);
        }
      }
      // Binding.remove(binding);
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

  // src/template/Expression.js

  /**
   * Expression parsed from some piece, like 'title@="title"' or '@{label}', in the component template.
   * 
   * @class
   * @constructor
   * @param {Object} binding  One of DataBinding, EventBinding or FragmentBinding
   * @param {Object} pattern  will be used by different type of binding
   */
  function Expression(binding, pattern) {
    this.binding = binding;
    this.pattern = pattern;
  }

  defineClass({
    constructor: Expression,
    /**
     * Connect this expression to the target in the scopes.
     * @param {Object} property - the target property or event
     * @param {Object} target   - the target related to this expression
     * @param {Object} scopes   - the scopes where this expression is located
     */
    connect: function(property, target, scopes) {
      var binding = this.binding.create(this.pattern);
      binding.connect(property, target, scopes);
    }
  });

  // src/core/bindings/TextBinding.js

  function TextBinding(pattern) {
    var pieces = this.pieces = [];
    for (var i = 0; i < pattern.length; ++i) {
      if (typeof pattern[i] === 'object') {
        pieces.push(new Expression(DataBinding, pattern[i]));
      } else {
        pieces.push(pattern[i]);
      }
    }
  }

  defineClass({
    /**
     * TextBinding is composed of strings and data-binding expressions.
     * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
     */
    constructor: TextBinding,

    statics: {
      create: function(pattern) {
        return new TextBinding(pattern);
      }
    },

    connect: function connect(property, target, scopes) {
      var i, n, piece, pieces = this.pieces;

      this.scopes = scopes;
      this.target = target;
      this.property = property;

      var cache = this.cache = new Cache(scopes[0]);

      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i];
        if (piece instanceof Expression) {
          piece.connect(i, cache, scopes);
        } else {
          cache.set(i, piece);
        } 
      }

      cache.set('length', n);

      this.execute();

      this.execute = this.execute.bind(this);

      scopes[0].on('updating', this.execute);

      Binding.record(target, this);
    },

    replace: function replace(scopes) {
      var bindings = this.cache._bindings;
      if (bindings) {
        for (var i = 0; i < bindings.length; ++i) {
          bindings[i].replace(scopes);
        }
      }
    },

    destroy: function destroy() {
      this.scopes[0].off('updating', this.execute);

      var bindings = this.cache._bindings;

      if (bindings) {
        for (var i = bindings.length - 1; i >= 0; --i) {
          bindings[i].destroy();
        }
        bindings.length = 0;
      }
      
      // Binding.remove(this.target, binding);
    },

    execute: function execute() {
      var cache = this.cache;

      if (!cache.hasDirty()) { return; }

      var value = slice.call(cache._props, 0);

      this.target.set(this.property, value.join(''));

      DirtyMarker.clean(cache);
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
                      '` maybe illegal in the template of component ' + (constructor.fullname || constructor.name));
          throw e;
        }
      }
    }
  });

  // src/core/shells/Block.js
  // import config from 'src/share/config'

  function replaceScopes(content, newScopes) {
    var bindings = content._bindings;
    var numScopes = newScopes.length;
    if (bindings) {
      for (var i = 0; i < bindings.length; ++i) {
        var binding = bindings[i];
        var oldScopes = binding.scopes;
        if (oldScopes && oldScopes.length === numScopes && 
            oldScopes[numScopes - 1] !== newScopes[numScopes - 1]) {
          binding.replace(newScopes);
        }
      }
    }
  }

  /**
   * Block for x:if and x:for
   * @param {Object} props 
   * @param {Array} scopes 
   * @param {Object} template 
   */
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
        delete block.template.xtype;
        delete block.template.xkey;
        delete block.template.xfor;
        delete block.template.xif;
        
        block.set('condition', true);

        // var ctrls = template.ctrls || {};
        var expression;

        if (template.xif) {
          block.mode = 1;
          expression = template.xif;
          expression.connect('condition', block, scopes);
        }

        if (template.xfor) {
          block.mode = 2;
          expression = template.xfor[1];
          expression.connect('iterable', block, scopes);
          if (template.xkey) {
            block.keyEval = template.xkey;//.evaluator;
          }
        }

        if (template.xtype) {
          block.xtype = true;
          expression = template.xtype;
          expression.connect('component', block, scopes);
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
      var component = this.get('component');
      var template = this.template;
      var scopes = this.scopes;
      var contents = [];

      if (!condition) {
        this.setChildren(contents);
        return;
      }

      if (this.xtype) {
        if (!component || !component.__extag_component_class__) {
          this.setChildren(contents);
          return;
        }
        template = assign({}, template, {type: component});
      }

      if (this.mode === 1) {
        content = HTMXEngine.createContent(template, scopes, true);
        if (content) {
          contents.push(content);
        }
        this.setChildren(contents);
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
        } else {
          replaceScopes(content, newScopes);
          // content.__key__ = key;
        }
    
        contents.push(content);
      }

      this.setChildren(contents);
    }
  });

  // src/core/template/drivers/driveEvents.js

  function driveEvents(target, scopes, newEvents, useExpr) {
    var oldEvents = target._events;
    var type, value;
    // firstly, remove old event handlers
    if (oldEvents) {
      for (type in oldEvents) {
        value = oldEvents[type];
        if (typeof value === 'function') {
          target.off(name, value);
        } else if (Array.isArray(value)) {
          target.off(type, value[0], value[1]);
        }
      }
    }
    // add new event handlers
    if (newEvents) {
      for (type in newEvents) {
        value = newEvents[type];
        if (useExpr && value instanceof Expression) {
          value.connect(type, target, scopes);
        } else if (typeof value === 'function') {
          target.on(type, value);
        } else if (Array.isArray(value)) {
          target.on(type, value[0], value[1]);
        }
      }
    }
    target._events = newEvents;
  }

  // src/core/template/drivers/driveProps.js

  function driveProps(target, scopes, newProps, useExpr) {
    var oldProps = target._props;
    var name, desc, value;
    // firstly, remove redundant properties, or reset default property values.
    if (oldProps) { 
      if (target instanceof Component) {
        for (name in oldProps) {
          if (!newProps || !(name in newProps)) {
            desc = Accessor.getAttrDesc(target, name);
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
    // assign new property values
    if (newProps) {
      for (name in newProps) {
        value = newProps[name];
        if (useExpr && value instanceof Expression) {
          value.connect(name, target, scopes);
        } else {
          target.set(name, value);
        }
      }
    }
  }

  // src/core/template/drivers/driveChildren.js

  /**
   * Check if the node matches the child text, element or component.
   * @param {Shell} child  - text, element or component
   * @param {string | Object} vnode - vnode
   */
  function matchChild(child, vnode) {
    var meta = child.$meta;
    if (meta.type === TYPE_TEXT && vnode.__extag_node__ !== EXTAG_VNODE) {
      return true;
    }
    return child.__extag_key__ === vnode.xkey && 
            (vnode.type ? child.constructor === vnode.type : 
              (meta.tag === vnode.tag && meta.ns === vnode.ns));
  }

  // function withScopes(content, scopes) {
  //   content = assign({}, content);
  //   content.scopes = scopes;
  //   return content;
  // }

  function driveContent(target, vnode, scopes) {
    if (isVNode(vnode)) {
      driveProps(target, scopes, vnode.props);
      driveEvents(target, scopes, vnode.events);
      driveChildren(target, scopes, vnode.children, target instanceof Component);
      // if (target instanceof Component && target !== scopes[0]) {
      // } else {

      // }
    } else /*if (target instanceof Text)*/ {
      target.set('content', vnode);
    }
  }

  function createContent(vnode, scopes) {
    if (!isVNode(vnode)) {
      return new Text(vnode);
    }  

    var ctor, expr, content;
    var useExpr = vnode.useExpr;

    if (vnode.xif || vnode.xfor || vnode.xtype) {
      content = new Block(null, scopes, vnode);
    } else if (useExpr && vnode.type === Expression) {
      expr = vnode.expr;
      if (expr.binding === DataBinding && expr.pattern.target === 'frag') {
        content = new Fragment(null, scopes, expr);
      } else {
        content = new Text('');
        expr.connect('content', content, scopes);
      }
    } else if (vnode.tag !== '!') {
      ctor = vnode.type;
      if (ctor) {
        content = new ctor(null, scopes, vnode);
      } else {
        content = new Element(vnode.ns ? vnode.ns + ':' + vnode.tag : vnode.tag);
        
        if (vnode.events) {
          driveEvents(content, scopes, vnode.events, useExpr);
        }
        if (vnode.props) {
          driveProps(content, scopes, vnode.props, useExpr);
        }
        // if (vnode.attrs) {
        //   driveProps(content.attrs, scopes, vnode.attrs, useExpr);
        // }
        if (vnode.style) {
          driveProps(content.style, scopes, vnode.style, useExpr);
        }
        if (vnode.classes) {
          driveProps(content.classes, scopes, vnode.classes, useExpr);
        }
        if (vnode.children) {
          driveChildren(content, scopes, vnode.children, useExpr);
        }
      }

      if (content && vnode.name) {
        content.$owner = scopes[0];
        scopes[0].addNamedPart(vnode.name, content); // TODO: removeNamedPart
      }
    }

    return content;
  }

  function createContents(children, scopes) {
    var i, n, child, content, contents = [];
    if (children && children.length) { 
      for (i = 0, n = children.length; i < n; ++i) {
        child = children[i];
        content = createContent(child, scopes);
        if (content) {
          contents.push(content);
        }
      }
    }
    return contents;
  }

  function collectContents(children, scopes, target) {
    var oldShells, newVNodes;

    // if (target instanceof Component && target !== scopes[0]) {
    //   oldShells = target._contents || EMPTY_ARRAY;
    //   newVNodes = children || EMPTY_ARRAY;
    // } else if (!(target instanceof Slot)) {
      oldShells = target._children || EMPTY_ARRAY;
      newVNodes = children || EMPTY_ARRAY;
    // } else {
    //   return;
    // }

    if (newVNodes.length) {
      newVNodes = flattenVNodes(newVNodes, null, target.$meta.ns);
    }

    var contents = new Array(newVNodes.length);
    var content, indices, key, i;

    var oldBeginIndex = 0, oldEndIndex = oldShells.length - 1;
    var newBeginIndex = 0, newEndIndex = newVNodes.length - 1;

    var oldBeginShell = oldShells[oldBeginIndex];
    var oldEndShell = oldShells[oldEndIndex];
    var newBeginVNode = newVNodes[newBeginIndex];
    var newEndVNode = newVNodes[newEndIndex];

    // refer to Vue (https://vuejs.org/)
    while (oldBeginIndex <= oldEndIndex && newBeginIndex <= newEndIndex) {
      if (oldBeginShell == null) {
        oldBeginShell = oldShells[++oldBeginIndex];
      } else if (oldEndShell == null) {
        oldEndShell = oldShells[--oldEndIndex];
      } else if (matchChild(oldBeginShell, newBeginVNode)) {
        contents[newBeginIndex] = oldBeginShell; 
        driveContent(oldBeginShell, newBeginVNode, scopes);
        oldBeginShell = oldShells[++oldBeginIndex];
        newBeginVNode = newVNodes[++newBeginIndex];
      } else if (matchChild(oldEndShell, newEndVNode)) {
        contents[newEndIndex] = oldEndShell;
        driveContent(oldEndShell, newEndVNode, scopes);
        oldEndShell = oldShells[--oldEndIndex];
        newEndVNode = newVNodes[--newEndIndex];
      } else if (matchChild(oldBeginShell, newEndVNode)) {
        contents[newEndIndex] = oldBeginShell;
        driveContent(oldBeginShell, newEndVNode, scopes);
        oldBeginShell = oldShells[++oldBeginIndex];
        newEndVNode = newVNodes[--newEndIndex];
      } else if (matchChild(oldEndShell, newBeginVNode)) {
        contents[newBeginIndex] = oldEndShell;
        driveContent(oldEndShell, newBeginVNode, scopes);
        oldEndShell = oldShells[--oldEndIndex];
        newBeginVNode = newVNodes[++newBeginIndex];
      } else  {
        if (!indices) {
          indices = {};
          for (i = oldBeginIndex; i <= oldEndIndex; ++i) {
            key = oldShells[oldBeginIndex].__key__;
            if (key) {
              indices[key] = i;
            }
          }
        }

        key = newBeginVNode.xkey;
        i = key && indices[key];

        if (i != null && matchChild(oldShells[i] || EMPTY_OBJECT, newBeginVNode)) {
          contents[newBeginIndex] = oldShells[i];
        } else {
          content = createContent(newBeginVNode, scopes);
          if (content) {
            contents[newBeginIndex] = content;
          } else {
            throw new Error('Can not create content from ', newBeginVNode);
          }
          
        }

        // driveContent(contents[newBeginIndex], newBeginVNode, scopes);

        newBeginVNode = newVNodes[++newBeginIndex];
      }
    }

    if (oldBeginIndex > oldEndIndex) {
      while (newBeginIndex <= newEndIndex) {
        content = createContent(newBeginVNode, scopes);
        if (content) {
          contents[newBeginIndex] = content;
        } else {
          throw new Error('Can not create content from ', newBeginVNode);
        }
        // driveContent(contents[newBeginIndex], newBeginVNode, scopes);
        newBeginVNode = newVNodes[++newBeginIndex];
      }
    }

    return contents;
  }

  function isVNode(child) {
    return typeof child === 'object' && child.__extag_node__ === EXTAG_VNODE;
  }

  function flattenVNodes(children, array, ns) {
    var i, n = children.length, child;
    if (!array) {
      for (i = 0; i < n; ++i) {
        if (Array.isArray(children[i])) {
          array = [];
          break;
        }
      }
    }
    if (array) {
      for (i = 0; i < n; ++i) {
        child = children[i];
        if (Array.isArray(child)) {
          flattenVNodes(child, array, ns);
        } else {
          array.push(child);
          if (ns && isVNode(child) && !child.ns) {
            child.ns = ns;
          }
        }
      }
    } else {
      for (i = 0; i < n; ++i) {
        child = children[i];
        if (ns && isVNode(child) && !child.ns) {
          child.ns = ns;
        }
      }
    }
    return array ? array : children;
  }

  // function driveChildren(target, scopes, children, useExpr) { 
  //   var contents;

  //   if (useExpr) {
  //     contents = createContents(children, scopes);
  //   } else {
  //     contents = collectContents(children, scopes, target);
  //   }
    
  //   if (target instanceof Component && target !== scopes[0]) {
  //     target.setContents(contents);
  //   } else {
  //     target.setChildren(contents);
  //   }
  // }

  function driveChildren(target, scopes, children, useExpr, areContents) {
    var contents;
    if (areContents) {
      // target.setContents(contents);
      contents = children.slice(0);
      contents.scopes = scopes;
      target.set('contents', contents);
    } else {
      if (useExpr) {
        contents = createContents(children, scopes);
      } else {
        contents = collectContents(children, scopes, target);
      }
      target.setChildren(contents);
    }
  }

  // src/core/template/drivers/transferProps.js

  function toStyleObject(source) {
    var type = typeof source;
    if (type === 'object') {
      return source;
    }
    if (type === 'string') {
      var style = {};
      var pieces = source.split(';');
      var piece, index, i, name, value;
      for (i = pieces.length - 1; i >= 0; --i) {
        piece = pieces[i];
        index = piece.indexOf(':');
        if (index > 0) {
          name = piece.slice(0, index).trim();
          value = piece.slice(index + 1).trim();
          // style[toCamelCase(name)] = value;
          style[name] = value;
        }
      }
      return style;
    } 
  }

  function toClassObject(source) {
    var type = typeof source;
    if (type === 'object') {
      return source;
    }
    if (type === 'string') {
      source = source.trim().split(WHITE_SPACES_REGEXP);
    }
    if (Array.isArray(source)) {
      var i, classes = {};
      for (i = 0; i < source.length; ++i) {
        if (source[i]) {
          classes[source[i]] = true;
        }
      }
      return classes;
    }
  }

  function getOrCreateCache(shell, name) {
    var cache = shell[name];
    if (!cache) {
      cache = new Cache(shell);
      shell[name] = cache;
    }
    return cache;
  }

  function transferProps(shell) {
    if (shell.$meta.type === TYPE_TEXT) {
      return;
    }

    var style, classes;

    // if (shell.hasDirty('attrs')) {
    //   DirtyMarker.clean(shell, 'attrs');
    //   attrs = shell.get('attrs');
    //   if (typeof attrs === 'object') {
    //     shell.attrs.reset(attrs);
    //   } else {
    //     shell.attrs.reset(null);
    //   }
    // }
    if (shell.hasDirty('style')) {
      DirtyMarker.clean(shell, 'style');
      style = toStyleObject(shell.get('style'));
      shell.style.reset(style);
    }
    if (shell.hasDirty('class')) {
      DirtyMarker.clean(shell, 'class');
      classes = toClassObject(shell.get('class'));
      shell.classes.reset(classes);
    }

    if (!shell.__props || !shell.constructor.__extag_component_class__) { 
        return; 
    }

    var __props = shell.__props;
    
    // if (__props.hasDirty('attrs')) {
    //   var __attrs = getOrCreateCache(shell, '__attrs');
    //   DirtyMarker.clean(__props, 'attrs');
    //   attrs = __props.get('attrs');
    //   if (typeof attrs === 'object') {
    //     __attrs.reset(attrs);
    //   } else {
    //     __attrs.reset(null);
    //   }
    // }
    if (__props.hasDirty('style')) {
      var __style = getOrCreateCache(shell, '__style');
      DirtyMarker.clean(__props, 'style');
      style = __props.get('style');
      style = toStyleObject(style);
      __style.reset(style);
    }
    if (__props.hasDirty('class')) {
      var __classes = getOrCreateCache(shell, '__classes');
      DirtyMarker.clean(__props, 'class');
      classes = __props.get('class');
      classes = toClassObject(classes);
      __classes.reset(classes);
    }
  }

  // src/core/template/drivers/driveComponent.js

  function driveComponent(target, scopes, vnode, props, template) {
    var useExpr;

    if (vnode && scopes) {
      useExpr = vnode.useExpr;
      if (props && vnode.props) {
        props = assign({}, vnode.props, props);
      } else if (!props && vnode.props) {
        props = vnode.props;
      }
      // eslint-disable-next-line no-undef
      {
        Validator.validate0(target, props);
      }
      driveProps(target, scopes, props, useExpr);

      if (vnode.events) {
        driveEvents(target, scopes, vnode.events, useExpr);
      }
      if (useExpr) {
        // if (vnode.attrs) {
        //   driveProps(target.attrs, scopes, vnode.attrs, useExpr);
        // }
        if (vnode.style) {
          driveProps(target.style, scopes, vnode.style, useExpr);
        }
        if (vnode.classes) {
          driveProps(target.classes, scopes, vnode.classes, useExpr);
        }
      }
      if (vnode.children) {
        driveChildren(target, scopes, vnode.children, useExpr, true);
      }
    } else if (props) {
      // eslint-disable-next-line no-undef
      {
        Validator.validate0(target, props);
      }
      driveProps(target, scopes, props);
    }
    
    if (!template) { return; }

    var _scopes = [target];

    useExpr = template.useExpr;

    if (template.events) {
      driveEvents(target, _scopes, template.events, useExpr);
    }
    if (template.props) {
      target.__props = new Cache(target);
      driveProps(target.__props, _scopes, template.props, useExpr);
    }
    if (useExpr) {
      // if (template.attrs) {
      //   target.__attrs = new Cache(target);
      //   driveProps(target.__attrs, _scopes, template.attrs, useExpr);
      // }
      if (template.style) {
        target.__style = new Cache(target);
        driveProps(target.__style, _scopes, template.style, useExpr);
      }
      if (template.classes) {
        target.__classes = new Cache(target);
        driveProps(target.__classes, _scopes, template.classes, useExpr);
      }
    }
    if (template.children) {
      driveChildren(target, _scopes, template.children, useExpr);
      // TODO: check for <x:frag children@="render(_props)"></x:frag>
    }
  }

  HTMXEngine.makeContent = createContent;
  HTMXEngine.createContent = createContent;
  HTMXEngine.driveChildren = driveChildren;
  // HTMXEngine.driveContent = driveContent;
  HTMXEngine.driveEvents = driveEvents;
  HTMXEngine.driveProps = driveProps;
  HTMXEngine.driveComponent = driveComponent;
  HTMXEngine.transferProps = transferProps;
  HTMXEngine.transferProperties = transferProps;

  // src/core/template/parsers/EvaluatorParser.js

  var DIVISION_REGEXP = /[\w).+\-_$\]]/;

  var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield ' 
                    +  'isNaN isFinite parseFloat parseInt Array Date Infinity Math NaN Number Object String Boolean RegExp JSON';
  var JS_KEYWORD_MAP = {};
  (function() {
    var keywords = JS_KEYWORDS.split(/\s+/);
    for (var i = 0, n = keywords.length; i < n; ++i) {
      JS_KEYWORD_MAP[keywords[i]] = true;
    }
  })();

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
          // if (space && !dot) {
          //   throwError("Unexpected token '" + expr[index] + "'.", {
          //     code: 1001, 
          //     expr: expr
          //   });
          // }
          if (space && !dot) {
            --index;
            break;
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

  function getPropChainIndices(expr) {
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
     * Parse an evaluator from string
     * @param {string} expr - e.g. "a + b" in @{a + b} or value@="a + b".
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     * @returns {PropEvaluator|FuncEvaluator}
     */
    parse: function parse(expr, prototype, identifiers) {
      var args = identifiers.slice(1);
      var expanded = 0, piece, path;
      var lines = [], i, j;
      // get start-index and stop-index of all prop chains, like `a` or `a.b.c`
      var indices = getPropChainIndices(expr);

      var resources = prototype.constructor.resources;

      for (j = 0; j < indices.length; j += 2) {
        if (indices[j+1] < 0) { continue; }
        piece = expr.slice(indices[j] + expanded, indices[j+1] + expanded);
        path = Path.parse(piece.replace(WHITE_SPACE_REGEXP, ''));
        if (hasOwnProp.call(JS_KEYWORD_MAP, path[0])) {
          continue;
        }
        i = identifiers.indexOf(path[0]);
        if (i < 0) {
          if (resources && hasOwnProp.call(resources, path[0])) {
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
        return new Evaluator(func, arguments[0]);
      } catch (e) {
        throwError(e, {
          code: 1001,
          expr: arguments[0],
          desc: 'Illegal expression `' + arguments[0] + '`.'
        });
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
     * Parse data-binding expression
     * @param {string} expr - e.g. "text |=upper" in @{text |=upper} or value@="text |=upper".
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is an iterator from x:for expression.
     * @returns {*}
     */
    parse: function parse(expr, prototype, identifiers) {
      var mode = -1, n = expr.length, i;

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
      } else {                                                  // <h1 title@="title">@{title}</h1>
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
              if (piece.indexOf('.') < 0 && identifiers.indexOf(piece) < 0) {
                var resources = prototype.constructor.resources;
                if (resources) {
                  var func = Path.search(piece, resources);
                  if (typeof func === 'function') {
                    converters = converters || [];
                    converters.push(new Evaluator(func, piece));
                    continue;
                  } 
                }
              }
              piece = piece + '(' + identifier + ')';
            }

            converter = EvaluatorParser.parse(piece, prototype, identifiers.concat([identifier]));
            converters = converters || [];
            converters.push(converter);
          }
        }
      }

      var pattern = {
        mode: mode,
        evaluator: evaluator
      };

      if (mode === DATA_BINDING_MODES.TWO_WAY) {
        pattern.identifiers = identifiers;
        pattern.path = path;
      } else if (converters && converters.length) {
        pattern.converters = converters;
      }

      return pattern;
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

  function getExprArgs(value) {
    var type = typeof value;
    if (type === 'object' && value.__extag_expr__ === Expression) {
      return value.args;
    } else if (type === 'string' || type === 'function') {
      return [value];
    } else if (Array.isArray(value)) {
      return value;
    }
  }

  function parseJsxNode(node, prototype) {
    var props = node.props, value, key, ctor, args;
    if (node.xif) {
      args = getExprArgs(node.xif);
      node.xif = parseJsxDataExpr(args, node, prototype);
    }
    if (node.xfor) {
      args = getExprArgs(node.xfor[1]);
      node.xfor[1] = parseJsxDataExpr(args, node, prototype);
      node.identifiers = node.identifiers.concat([node.xfor[0]]);
    }
    if (node.xkey) {
      args = getExprArgs(node.xkey);
      node.xkey = parseJsxDataExpr(args, node, prototype);
    }
    if (props) {
      // parse expression, and extract style, attrs, classes
      for (key in props) {
        value = props[key];
        if (typeof value === 'object') {
          if (value.__extag_expr__ === Expression) {
            props[key] = parseJsxDataExpr(value.args, node, prototype);
          } /*else if (key === 'classes' || key === 'style' || key === 'attrs') {
            node[key] = value;
            delete props[key];
          }*/
        }
      }
    }
    if (node.type && typeof node.type === 'string') {
      ctor = Path.search(node.type, prototype.constructor.resources);
      if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
        // eslint-disable-next-line no-undef
        {
          logger.warn('Can not find such component type `' + expr + '`. ' + 
                      'Make sure it extends Component and please register `' + expr  + '` in static resources.');
        }
        throwError('Can not find such component type `' + expr + '`');
      }
      node.type = ctor;
    }
    if (node.type == null && CAPITAL_REGEXP.test(node.tag)) {
      ctor = Path.search(node.tag, prototype.constructor.resources);
      if (typeof ctor === 'function' && ctor.__extag_component_class__) {
        node.type = ctor;
      // eslint-disable-next-line no-undef
      } else {
        logger.warn('`' + node.tag + '` maybe component type but not found.');
      }
    }
    if (node.type == null) {
      switch (node.tag) {
        case 'x:slot':
          node.type = Slot;
          break;
        // case 'x:view':
        //   node.type = View;
        //   break;
        case 'x:frag':
          node.type = Fragment;
          break;
        // case 'x:block':
        //   node.type = Block;
        //   break;
        case 'x:output':
          node.type = Output;
          break;
      }
    }
    if (node.events) {
      parseJsxEvents(node, prototype);
    }
  }

  function parseEvaluater(evaluator, prototype, identifiers) {
    var type = typeof evaluator;
    if (type === 'string') {
      return EventBindingParser.parse(evaluator, prototype, identifiers);
    } else if (type === 'function') {
      return new Evaluator(evaluator);
    } else {
      throwError('evaluator must be string or function');
    }
  }

  function parseConverters(converters, prototype, identifiers) {
    for (var i = 0; i < converters.length; ++i) {
      converters[i] = parseEvaluater(converters[identifiers]);
    }
  }

  function parseJsxDataExpr(args, node, prototype) {
    var target, type = typeof args[0];
    if (args.length === 1) {
      if (type === 'string') {
        return new Expression(DataBinding, 
          DataBindingParser.parse(args[0], prototype, node.identifiers));
      } else if (type === 'function') {
        return new Expression(DataBinding, {
          mode: 1,
          evaluator: parseEvaluater(args[0], prototype, node.identifiers)
        })
      } else {
        return args[0]
      }
      
    } else {
      if (args[0] === '{' && args[args.length - 1] === '}') {
        args = args.slice(1, 2);
        target = 'frag';
      }
      if (args[0] === '@') {
        return new Expression(DataBinding, {
          mode: 2,
          path: args[1],
          evaluator: parseEvaluater(args[2]),
          identifiers: node.identifiers
        })
      } else {
        var mode = 1;
        switch (args[args.length - 1]) {
          case '?':
            args = args.slice(0, -1);
            mode = 0;
            break;
          case '!':
            args = args.slice(0, -1);
            mode = -1;
            break;
          case '^':
            args = args.slice(0, -1);
            mode = 3;
            break;
        }
        return new Expression(DataBinding, {
          mode: mode,
          target: target,
          evaluator: parseEvaluater(args[1], prototype, node.identifiers),
          converters: args.length === 2 ? null : 
                      parseConverters(args.slice(2), prototype, node.identifiers)
        });
      }
    }
  }

  function parseJsxEventExpr(args, node, prototype) {
    var pattern,  type = typeof args[0];
    if (type === 'string' && args.length === 1) {
      pattern = EventBindingParser.parse(args[0], prototype, node.identifiers);
    } else if (type === 'function') {
      pattern = {
        evaluator: new Evaluator(args[0]),
        modifiers: args.length > 1 ? args.slice(1) : null
      };
    } else {
      pattern = null;
    }
    return pattern ? new Expression(EventBinding, pattern) : null;
  }

  function parseJsxEvents(node, prototype) {
    var evt, expr, args, value, events = node.events;
    for (evt in events) {
      value = events[evt];
      args = getExprArgs(value);
      expr = parseJsxEventExpr(args, prototype, node.identifiers);
      if (expr) {
        events[evt] = expr;
      }
    }
  }

  function parseJsxChildren(node, prototype) {
    var children = node.children;
    if (!children || !children.length) {
      return;
    }
    var i, child;
    for (i = children.length - 1; i >= 0; --i) {
      child = children[i];
      if (typeof child === 'object') {
        if (child.__extag_node__ === EXTAG_VNODE) {
          child.useExpr = true;
          child.identifiers = node.identifiers;
          parseJsxNode(child, prototype);
          parseJsxChildren(child, prototype);
          continue;
        } else if (child.__extag_expr__ === Expression) {
          // children[i] = parseJsxDataExpr(child.args, node, prototype);
          children[i] = {
            __extag_node__: EXTAG_VNODE,
            useExpr: true,
            type: Expression,
            expr: parseJsxDataExpr(child.args, node, prototype)
          };
        }
      }
    }
  }

  var RESERVED_PARAMS = {
    xns: true,
    xif: true,
    xfor: true,
    xkey: true,
    xname: true,
    xslot: true,
    xtype: true,
    events: true
  };

  /**
   * Create virtual node
   * @param {string|Function} type  element tag or component type
   * @param {Object} options  some props, and expressions maybe
   * @param {string|Array|Object} children  child nodes
   * @returns {Object}
   */
  function node(type, options, children) {
    var node = {
      __extag_node__: EXTAG_VNODE
    };
    var props, key;

    var t = typeof type;
    if (t === 'string') {
      var i = type.indexOf(':');
      if (i < 0) {
        node.ns = '';
        node.tag = type;
      } else {
        if (type.slice(0, i) === 'x') {
          switch(type) {
            case 'x:slot':
              node.tag = type;
              node.type = Slot;
              break;
            case 'x:frag':
              node.tag = type;
              node.type = Fragment;
              break;
            case 'x:output':
              node.tag = type;
              node.type = Output;
              break;
          }
        } 
        if (!node.type) {
          node.ns = type.slice(0, i);
          node.tag = type.slice(i + 1);
        }
      }
    } else if (t === 'function' && type.__extag_component_class__) {
      node.type = type;
    } else {
      throwError('The first argument must be string, component class or constructor.');
    }

    if (options != null) {
      if (options.xns) {
        node.ns = options.xns;
      }
      if (options.xif) {
        node.xif = options.xif;
      }
      if (options.xfor) {
        node.xfor = options.xfor;
      }
      if (options.xkey) {
        node.xkey = options.xkey;
      }
      if (options.xname) {
        node.name = options.xname;
      }
      if (options.xslot) {
        node.slot = options.xslot;
      }
      if (options.xtype) {
        if (!node.type) {
          node.type = options.xtype;
        } else if (node.type === Output) {
          node.props = {
            xtype: options.xtype
          };
        }
      }

      if (options.events) {
        node.events = options.events;
      }

      // var props;
      if (node.props) {
        props = node.props;
      } else {
        props = node.props = {};
      }

      for (key in options) {
        if (!RESERVED_PARAMS[key] && hasOwnProp.call(options, key)) {
          props[key] = options[key];
        }
      }
    }

    if (children) {
      if (arguments.length > 3 || Array.isArray(children)) {
        children = slice.call(arguments, 2);
        children = flatten(children);
      } else {
        children = [children];
      }
      node.children = children;

      // if (node.props) {
      //   props = node.props;
      // } else {
      //   props = node.props = {};
      // }
      // if (node.type) {
      //   props.contents = children;
      // } else {
      //   props.children = children;
      // }
    }

    return node;
  }

  /**
   * Create virtual expression.
   * e.g.
   * just a string: expr('a > b')
   * just a function: expr(function() {return this.a > this.b;})
   * just a function with iterator: expr(function(item) {return this.key === item.key})
   * just a string with converters(modifiers): expr('titile |=upper ?'), expr('onClick::bind')
   * a function followed by more functions as converters: expr(function(){return this.title}, upper, '?')
   * a event handler function followed by more strings as modifiers: expr(function(){return this.title}, 'once')
   */
  function expr() {
    return {
      args: slice.call(arguments, 0),
      __extag_expr__: Expression
    };
  }

  var JSXParser = {
    node: node,
    expr: expr,
    /**
     * Parse the template created by node(), connect to prototype
     * @param {Object} template 
     * @param {Object} prototype 
     */
    parse: function(template, prototype) {
      var _node = template(node, expr);
      _node.identifiers = ['this'];
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
        throwError('`xif`, `xfor`, `xkey` can not be used on root tag of component template.');
      }

      return _node;
    }
  };

  HTMXEngine.parseJSX = JSXParser.parse;

  // src/core/template/parsers/PrimaryLiteralParser.js

  var PrimitiveLiteralParser = {
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

  // src/core/template/parsers/FragmentBindingParser.js

  var LF_IN_BLANK = /\s*\n\s*/g;

  var BINDING_LIKE_REGEXP = new RegExp(
    BINDING_OPERATORS.DATA +'\\' + BINDING_BRACKETS[0] + '(\\s|.)*?\\' + BINDING_BRACKETS[1]
  );

  var TextBindingParser = {
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
                text = text.replace(LF_IN_BLANK, ' ');
                if (text) {
                  text = decodeHTML(text);
                  template.push(text);
                }
              }
              if (expr.charCodeAt(stop + 2) === 123 && expr.charCodeAt(i - 1) === 125) {
                // @{{...}}
                pattern = DataBindingParser.parse(expr.slice(stop + 3, i - 1), prototype, identifiers);
                pattern.target = 'frag';
              } else {
                // @{...}
                pattern = DataBindingParser.parse(expr.slice(stop + 2, i), prototype, identifiers);
                pattern.target = 'text';
              }
              template.push(pattern);
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
        text = text.replace(LF_IN_BLANK, ' ');
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
  // var SINGLE_BINDING_REGEXP = new RegExp(
  //   '^' + BINDING_OPERATORS.DATA +'\\' + BINDING_BRACKETS[0] + '[^' + BINDING_OPERATORS.DATA + ']*\\' + BINDING_BRACKETS[1] + '$'
  // );

  var ClassStyleParser = {
    /**
     * parse x:class="..." and x:style="..."
     * @param {string} expr - e.g. "a b; c@: active;" for x:class, 
     *                              and "display: none; font-size#:@{fontSize}px;" for x:style
     * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
     * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
     * @param {boolean} forStyle  - 
     */
    parse: function parse(expr, prototype, identifiers, forStyle) {
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

        if (!name || !CSS_NAME_REGEXP.test(name)) {
          throwError('Illegal ' + (forStyle ? 'x:style' : 'x:class') + ' expression.', {
            code: 1001,
            expr: name || arguments[0]
          });
        }
        // if (forStyle && name.slice(0, 2) !== '--') { // not like --webkit-transform
        //   name = toCamelCase(name);
        // }

        try {
          if (!TextBindingParser.like(expr)) {
            group[name] = forStyle ? expr : PrimitiveLiteralParser.tryParse(expr);
            continue;
          }
          // if (SINGLE_BINDING_REGEXP.test(expr)) {
          //   result = DataBindingParser.parse(expr.slice(2, expr.length-1), prototype, identifiers);
          //   group[name] = new Expression(DataBinding, result);
          //   continue;
          // }
          result = TextBindingParser.parse(expr, prototype, identifiers);
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
          if (result.length === 1) {
            group[name] = new Expression(DataBinding, result[0]);
          } else if (forStyle) {
            group[name] = new Expression(TextBinding, result);
          } else {
            throwError('Illegal x:class expression.', {
              code: 1001,
              expr: expr
            });
          }
        } else {
          group[name] = forStyle ? expr : PrimitiveLiteralParser.tryParse(expr);
        }
      }

      return group;
    }
  };

  // src/core/template/parsers/HTMXParser.js

  var FOR_LOOP_REGEXP = /^([_$\w]+)\s+of\s+(.+)$/;
  var LETTER_REGEXP = /[a-zA-Z]/;
  var TAGNAME_STOP = /[\s/>]/;
  var ATTRNAME_SPLITTER = /[\s\/]+/;
  var X_TAG_REGEXP = /^x:/;

  // var viewEngine = null;

  var namespaceURIs = {
    html: 'http://www.w3.org/1999/xhtml',
    math: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink'
  };

  function toNameSpace(xmlns) {
    if (!xmlns || xmlns === namespaceURIs.html) {
      return '';
    } else if (xmlns === namespaceURIs.svg) {
      return 'svg';
    } else if (xmlns === namespaceURIs.math) {
      return 'math';
    } else if (xmlns === namespaceURIs.xlink) {
      return 'xlink';
    }
    return null;
  }

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

  var SPECIAL_CASES = {
    // 'class': 'classes',
    'inner-html': 'innerHTML'
  };

  var DIRECTIVES = {
    'x:ns': true,
    'x:if': true,
    'x:for': true,
    'x:key': true,
    'x:name': true,
    'x:slot': true,
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

  function getPropName(attrName) {
    if (attrName in SPECIAL_CASES) {
      return SPECIAL_CASES[attrName];
    }
    return attrName;// toCamelCase(attrName);
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
      node.classes = ClassStyleParser.parse(expr, prototype, identifiers, false);
    } else if (name === 'x:style') {
      node.style = ClassStyleParser.parse(expr, prototype, identifiers, true);
    } else if (name === 'x:type') {
      // if (node.tag === 'x:output') {
      //   // <x:output x:type="Buuton"/> just like <input type="button">
      //   parseAttribute('xtype@', expr, node, prototype, identifiers);
      //   return;
      // } else if (node.tag === 'x:slot') {
      //   throwError('Unexpected x:type on <x:slot>', {
      //     code: 1001,
      //     expr: expr,
      //     desc: 'Do not use x:type on <x:slot>'
      //   });
      // }
      var ctor = Path.search(expr, prototype.constructor.resources);
      // if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
      //   // if ("development" === 'development') {
      //   //   logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in static resources.');
      //   // }
      //   // throw new TypeError('Can not find such component type `' + expr + '`');
      //   throwError('Illegal x:type="' + expr + '"', {
      //     code: 1001,
      //     expr: expr,
      //     desc: 'Can not find such component type `' + expr 
      //           + '`. Make sure it extends Component and please register `' + expr 
      //           + '` in static resources.'
      //   });
      // }
      // node.type = ctor;
      if (typeof ctor === 'function' && ctor.__extag_component_class__) {
        node.type = ctor;
      } else {
        result = DataBindingParser.parse(expr, prototype, identifiers);
        node.xtype = new Expression(DataBinding, result);
      }
    } else if (name === 'x:name') {
      node.name = expr;
    } else if (name === 'x:slot') {
      node.slot = expr;
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

  // function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
  //   var lastChar = attrName[attrName.length - 1];
  //   var index = attrName.indexOf(':');
  //   var result, group, key;

  //   // // :title => title
  //   // if (index === 0) {
  //   //   attrName = attrName.slice(1);
  //   // }

  //   if (attrValue == null) {
  //     if (index < 0) {
  //       key = getPropName(attrName);
  //       getGroup(node, 'props')[key] = true;
  //       return;
  //     }
  //     attrValue = '';
  //   }

  //   if (lastChar === BINDING_OPERATORS.EVENT) { // last char is '+'
  //     group = getGroup(node, 'events');
  //     key = attrName.slice(0, -1);
  //     // attrName = attrName.slice(0, -1);
  //     // key = index < 0 ? toCamelCase(attrName) : attrName;
  //     result = EventBindingParser.parse(attrValue, prototype, identifiers);
  //     group[key] = new Expression(EventBinding, result);
  //   } else {
  //     if (index < 0) {
  //       group = getGroup(node, 'props');
  //     } else {
  //       group = getGroup(node, 'attrs');
  //     }
  //     switch (lastChar) {
  //       case BINDING_OPERATORS.DATA: // last char is '@'
  //         attrName = attrName.slice(0, -1);
  //         key = index < 0 ? getPropName(attrName) : attrName;
  //         result = PrimitiveLiteralParser.tryParse(attrValue);
  //         if (result != null) {
  //           group[key] = result;
  //         } else {
  //           result = DataBindingParser.parse(attrValue, prototype, identifiers);
  //           group[key] = new Expression(DataBinding, result);
  //         }
  //         break;
  //       case BINDING_OPERATORS.TEXT: // last char is '#'
  //         attrName = attrName.slice(0, -1);
  //         key = index < 0 ? getPropName(attrName) : attrName;
  //         try {
  //           result = TextBindingParser.parse(attrValue, prototype, identifiers);
  //         } catch (e) {
  //           // eslint-disable-next-line no-undef
  //           if ("development" === 'development') {
  //             if (e.code === 1001) {
  //               e.expr = BINDING_FORMAT.replace('0', e.expr);
  //             }
  //           }
  //           throw e;
  //         }
  //         if (result) {
  //           if (result.length === 1) {
  //             group[key] = new Expression(DataBinding, result[0]);
  //           } else {
  //             group[key] = new Expression(TextBinding, result);
  //           }
  //         } else {
  //           group[key] = attrValue;
  //         }
  //         break;
  //       default:
  //         key = index < 0 ? getPropName(attrName) : attrName;
  //         // group[key] = viewEngine.isBoolProp(key) || attrValue;
  //         group[key] = attrValue;
  //     }
  //   }
  // }

  function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
    var lastChar = attrName[attrName.length - 1];
    var result, group, key;

    if (attrValue == null) {
      key = getPropName(attrName);
      group = getGroup(node, 'props');
      group[key] = true;
      return;
    }

    if (lastChar === BINDING_OPERATORS.EVENT) { // last char is '+'
      group = getGroup(node, 'events');
      key = attrName.slice(0, -1);
      // attrName = attrName.slice(0, -1);
      // key = index < 0 ? toCamelCase(attrName) : attrName;
      result = EventBindingParser.parse(attrValue, prototype, identifiers);
      group[key] = new Expression(EventBinding, result);
    } else {
      group = getGroup(node, 'props');
      switch (lastChar) {
        case BINDING_OPERATORS.DATA: // last char is '@'
          key = getPropName(attrName.slice(0, -1));
          result = PrimitiveLiteralParser.tryParse(attrValue);
          if (result != null) {
            group[key] = result;
          } else {
            result = DataBindingParser.parse(attrValue, prototype, identifiers);
            group[key] = new Expression(DataBinding, result);
          }
          break;
        case BINDING_OPERATORS.TEXT: // last char is '#'
          key = getPropName(attrName.slice(0, -1));
          try {
            result = TextBindingParser.parse(attrValue, prototype, identifiers);
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
            if (result.length === 1) {
              group[key] = new Expression(DataBinding, result[0]);
            } else {
              group[key] = new Expression(TextBinding, result);
            }
          } else {
            group[key] = attrValue;
          }
          break;
        default:
          key = getPropName(attrName);
          group[key] = attrValue;
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
                    + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
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
          attrNames = htmx.slice(start, stop).trim().split(ATTRNAME_SPLITTER);
          while(attrNames.length > 0) {
            attrName = attrNames.shift();
            if (attrName && node) {
              parseAttribute(attrName, null, node, prototype, node.identifiers);
              // getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = '';
            }
          }
        }
        return stop;
      } else if (cc === '=') {
        stop = idx;
        if (start < stop) {
          attrNames = htmx.slice(start, stop).trim().split(ATTRNAME_SPLITTER);
          while(attrNames.length > 1) {
            attrName = attrNames.shift();
            if (attrName && node) {
              parseAttribute(attrName, null, node, prototype, node.identifiers);
              // getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = '';
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

  // var LF_IN_BLANK_REGEXP = /\s*\n\s*/;
  var LF_IN_BLANK_START = /^\s*\n\s*/;
  var LF_IN_BLANK_END = /\s*\n\s*$/;

  function createExprNode(binding, pattern) {
    return {
      __extag_node__: EXTAG_VNODE,
      useExpr: true,
      type: Expression,
      expr: new Expression(binding, pattern)
    }
  }


  function parseTextNode(htmx, start, stop, parent, prototype, identifiers) {
    var children = parent.children || [], result;
    var text = htmx.slice(start, stop);
    text = text.replace(LF_IN_BLANK_START, '').replace(LF_IN_BLANK_END, '');
    if (!text) {
      return;
    }

    if (TextBindingParser.like(text)) {
      try {
        result = TextBindingParser.parse(text, prototype, identifiers);
      } catch (e) {
        // eslint-disable-next-line no-undef
        {
          if (e.code === 1001) {
            var snapshot = getSnapshot(htmx, BINDING_FORMAT.replace('0', e.expr), parent, start);
            logger.warn((e.desc || e.message) + ' In the template of component ' 
                    + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
                    + snapshot[0], snapshot[1], snapshot[2]);
          }
        }
        throw e;
      }
      if (result) {
        if (result.length === 1 && typeof result[0] === 'object') {
          children.push(createExprNode(DataBinding, result[0]));
        } else {
          var i = -1, j = 0 , n = result.length;
          for (; j < n; ++j) {
            var pattern = result[j];
            if (typeof pattern === 'object' && pattern.target === 'frag') {
              if (j > i) {
                if (j - i > 1) {
                  children.push(createExprNode(TextBinding, result.slice(i, j)));
                } else if (typeof result[i] === 'object') {
                  children.push(createExprNode(DataBinding, result[i]));
                } else {
                  children.push(result[i]);
                }
              }
              children.push(createExprNode(DataBinding, pattern));
              i = -1;
            } else if (i < 0) {
              i = j;
            }
          }
          if (i >= 0 && j > i) {
            if (j - i > 1) {
              children.push(createExprNode(TextBinding, result.slice(i, j)));
            } else if (typeof result[i] === 'object') {
              children.push(createExprNode(DataBinding, result[i]));
            } else {
              children.push(result[i]);
            }
          }
        }
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
    var start = 0, stop = 0;
    var parent, parents = [];
    var idx = 0, end = htmx.length;

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
          // tag starts
          start = idx + 1;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
          tagName = htmx.slice(start, stop);
     
          node = {};
          node.tag = tagName;
          node.useExpr = true;
          node.__extag_node__ = EXTAG_VNODE;

          // eslint-disable-next-line no-undef
          {
            node.range = [start-1, -1];
          }
          
          node.identifiers = parent.identifiers;

          if ('>' !== htmx[stop]) {
            start = stop = stop + 1;
            stop = parseAttributes(htmx, start, node, prototype, node.identifiers);
          }

          if (!node.ns) {
            if (node.props && node.props.xmlns) {
              node.ns = toNameSpace(node.props.xmlns);
            } else if (parent.ns) {
              node.ns = parent.ns;
            }
          }

          if (node.type == null && X_TAG_REGEXP.test(tagName)) {
            switch (tagName) {
              case 'x:slot':
                node.type = Slot;
                break;
              // case 'x:view':
              //   node.type = View;
              //   break;
              case 'x:frag':
                node.type = Fragment;
                break;
              // case 'x:block':
              //   node.type = Block;
              //   break;
              // case 'x:ouput':
              //   node.type = Output;
              //   break;
            }
          }

          if (node.type == null && node.xtype == null && CAPITAL_REGEXP.test(tagName)) {
            var ctor = Path.search(tagName, prototype.constructor.resources);
            if (typeof ctor === 'function' && ctor.__extag_component_class__) {
              node.type = ctor;
            // eslint-disable-next-line no-undef
            } else {
              logger.warn('`' + node.tag + '` maybe component but not found.');
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

          if (tagName !== parent.tag) {
            // eslint-disable-next-line no-undef
            {
              var snapshot = getSnapshot(htmx, tagName, parent, start);
              logger.warn('Unclosed tag `' + parent.tag + '`. In the template of component ' 
                    + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
                    + snapshot[0], snapshot[1], snapshot[2]);
            }
            throwError('Unclosed tag ' + parent.tag);
          }

          if ('>' !== htmx[stop]) {
            start = stop = stop + 1;
            stop = parseAttributes(htmx, start);
          }

          // if (parent.children) {
          //   var props = getGroup(parent, 'props');
          //   if (node.type) {
          //     props.contents = parent.children;
          //   } else {
          //     props.children = parent.children;
          //   }
          // }

          // start = stop = stop + 1;

          // tag closed
          if (parents.length > 1) {
            parents.pop();
            // check <x:frag>@{{draw()^}}</x:frag>
          } else {
            // if (stop < end) {
            //   throw new Error('');
            // }
            return parents[0];
          }

          if (parents.length > 0) {
            parent = parents[parents.length - 1];
          } 

          idx = stop + 1;
          start = stop = idx;
          continue;
        } else if ('!' === nc && '<!--' === htmx.slice(idx, idx + 4)) {
          // comment
          if (start < idx) {
            parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
          }
          start = idx + 4;
          stop = htmx.indexOf('-->', start);
          stop = stop > 0 ? stop : htmx.length;
          node =  {
            tag: '!',
            comment: htmx.slice(start, stop),
            __extag_node__: EXTAG_VNODE
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

    return parents;
  }

  var HTMXParser = {
    parse: function(htmx, prototype) {
      // viewEngine = viewEngine || config.get(VIEW_ENGINE);

      var constructor = prototype.constructor;
      var nodes = parseHTMX(htmx, prototype);
      var children = nodes[0].children;
      var root = children[0];

      if (children.length !== 1) {
        throwError('The template of component ' + (constructor.fullname || constructor.name) + ' must have only one root tag.');
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

  HTMXEngine.parseHTMX = HTMXParser.parse;

  /* eslint-disable no-unused-vars */


  if (typeof ExtagDOM !== 'undefined') {
    // eslint-disable-next-line no-undef
    config.set('view-engine', ExtagDOM);
  }

  // export {
  //   help,
  //   defineClass,

  //   Validator,
  //   Watcher, 

  //   Cache,
  //   Model, 

  //   Slot,
  //   Text,
  //   Element,
  //   Fragment,
  //   Component
  // }

  var Extag = {
    anew: Generator.anew,
    inst: Generator.inst,
    // make: HTMXEngine.makeContent,

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
    // slice: slice,
    // flatten: flatten,
    // toClasses: toClasses,
    // encodeHTML: encodeHTML,
    // decodeHTML: decodeHTML,
    setImmediate: Schedule.setImmediate,

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
    Model: Model,
    // Cache: Cache,
    
    // shells
    // Shell: Shell,
    //
    Text: Text, 
    Slot: Slot,
    Output: Output,
    Element: Element, 
    Fragment: Fragment,
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
    version: "0.3.1"
  };

  return Extag;

})));
