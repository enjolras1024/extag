// src/share/functions.js 

import config from 'src/share/config'

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
        }
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
  defineProp({}, 'x', {get: function() {}})
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
  }
  decodeHTML = function(html) {
    if (!HTML_CHAR_ENTITY_REGEXP.test(html)) {
      return html;
    }
    div.innerHTML = html;
    return div.textContent;// || div.innerText || '';
  }
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
  }
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
  }
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

function throwError(err, opts) {
  var error = err instanceof Error ? err : new Error(err);
  if (opts) {
    assign(error, opts);
  }
  throw error;
}

export { 
  copy,
  slice,
  assign,
  toClasses,
  throwError,
  encodeHTML, 
  decodeHTML,
  defineProp, 
  defineClass, 
  setImmediate
};