// src/share/functions.js 

import {
  EXTAG_VNODE
} from 'src/share/constants'

var slice = Array.prototype.slice;
var defineProp = Object.defineProperty;
var hasOwnProp = Object.prototype.hasOwnProperty;
var getOwnPropDesc = Object.getOwnPropertyDescriptor;

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
}

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

function append(array, value) {
  if (value != null) {
    array = array.slice(0);
    array.push(value);
  }
  return array;
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
      throwError('superClass must be a function');
    }
  } else {
    superClass = Object;
  }

  // subClass
  if (hasOwnProp.call(proto, 'constructor')) {
    subClass = proto.constructor;
    //delete proto.constructor;
    if (typeof subClass !== 'function') {
      throwError('subClass must be a function');
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

function encodeHTML(text) {
  if (!/[<>&"\u00a0]/.test(text)) {
    return text;
  }
  return  text.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/\u00a0/g, '&nbsp;');
}

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

var KEBAB_CASE_REGEXP = /-([a-z])?/g;
var KEBAB_CASE_REPLACER = function(match, char) {
  return char ? char.toUpperCase() : '';
}
var camelCache = {};
function toCamelCase(key) {
  if (key.indexOf('-') < 0) {
    return key;
  }
  key = key.toLowerCase();
  if (key in camelCache) {
    return camelCache[key];
  }
  var name = key.replace(KEBAB_CASE_REGEXP, KEBAB_CASE_REPLACER);
  camelCache[key] = name;
  return name;
}

function throwError(err, opts) {
  var error = err instanceof Error ? err : new Error(err);
  if (opts) {
    assign(error, opts);
  }
  throw error;
}

function isVNode(child) {
  return child && typeof child === 'object' && child.__extag_node__ === EXTAG_VNODE;
}

export { 
  copy,
  help,
  slice,
  assign,
  append,
  flatten,
  isVNode,
  toClasses,
  throwError,
  encodeHTML, 
  decodeHTML,
  hasOwnProp,
  defineProp, 
  defineClass, 
  toCamelCase,
  isNativeFunc,
  getOwnPropDesc
};