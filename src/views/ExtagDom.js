//######################################################################################################################
// src/view/ExtagDom.js
//######################################################################################################################
//#es6 import Extag from "extag"
//#cjs var Extag = require("extag")

var hasOwnProp = Object.prototype.hasOwnProperty;

function assign(target/*,..sources*/) { // Object.assign
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
      if (hasOwnProp.call(source, key)) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      }
    }
  }

  return target;
}

var supportsPassiveOption = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      return (supportsPassiveOption = true);
    }
  });
  window.addEventListener('test-passive', null, opts);
// eslint-disable-next-line no-empty
} catch (e) {}

var tag2events = {};
var FLAG_CHANGED_CHILDREN = 4;
var FLAG_CHANGED_COMMANDS = 8;

// Refer to React (https://facebook.github.io/react/)
var DOM_PROPERTY_DESCRIPTORS = {
  /**
   * Standard Properties
   */
  accept: null,
  acceptCharset: {
    attributeName: 'accept-chartset'
  },
  accessKey: null,
  action: null,
  allowFullscreen: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  allowTransparency: null,
  alt: null,
  async: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  autocomplete: null,
  autofocus: {
    isBoolProperty: true
  },
  autoplay: {
    isBoolProperty: true
  },
  capture: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  cellPadding: null,
  cellSpacing: null,
  charset: null,
  challenge: null,
  checked: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  cite: null,
  classid: null,
  className: {
    attributeName: 'class'
  }, // => class
  cols: null,//HAS_POSITIVE_NUMERIC_VALUE,
  colSpan: null,
  content: null,
  contentEditable: null,
  contextMenu: null,
  controls: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  coords: null,
  crossOrigin: null,
  data: {
    mustUseProperty: true
  }, // For `<object />` acts as `src`, and TextNode.
  dateTime: null,
  'default': {
    isBoolProperty: true,
    mustUseProperty: true
  },
  defer: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  dir: null,
  disabled: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  download: null,//HAS_OVERLOADED_BOOLEAN_VALUE,
  draggable: null,
  enctype: null,
  form: null,
  formAction: null,
  formEncType: null,
  formMethod: null,
  formNoValidate: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  formTarget: null,
  frameBorder: null,
  headers: null,
  height: null,
  hidden: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  high: null,
  href: null,
  hreflang: null,
  htmlFor: {
    attributeName: 'for'
  }, // => for
  httpEquiv: null,
  icon: null,
  id: null,
  // innerHTML
  innerHTML: {
    attributeName: 'inner-html',
    mustUseProperty: true
  },
  inputMode: null, // ? no support for now
  integrity: null,
  is: null,
  keyparams: null,
  keytype: null,
  kind: null,
  label: null,
  lang: null,
  list: null,
  loop: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  low: null,
  manifest: null,
  marginHeight: null,
  marginWidth: null,
  max: null,
  maxLength: null,
  media: null,
  mediaGroup: null,
  method: null,
  min: null,
  minLength: null,
  multiple: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  muted: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  name: null,
  nonce: null,
  noValidate: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  open: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  optimum: null,
  pattern: null,
  placeholder: null,
  poster: null,
  preload: null,
  profile: null,
  radiogroup: null,
  readOnly: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  referrerPolicy: null,
  rel: null,
  required: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  reversed: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  role: null,
  rows: null,//HAS_POSITIVE_NUMERIC_VALUE,
  rowSpan: null,//HAS_NUMERIC_VALUE,
  sandbox: null,
  scope: null,
  scoped: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  scrolling: null,
  seamless: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  selected: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  shape: null,
  size: null,//HAS_POSITIVE_NUMERIC_VALUE,
  sizes: null,
  span: null,//HAS_POSITIVE_NUMERIC_VALUE,
  spellcheck: null,
  src: null,
  srcdoc: null,
  srclang: null,
  srcset: null,
  start: null,//HAS_NUMERIC_VALUE,
  step: null,
  style: null,
  summary: null,
  tabIndex: null,
  target: null,
  title: null,
  type: null,
  useMap: null,
  value: {
    mustUseProperty: true
  },
  width: null,
  wmode: null,
  wrap: null,

  /**
   * RDFa Properties
   */
  about: null,
  datatype: null,
  inlist: null,
  prefix: null,
  property: null,
  resource: null,
  'typeof': null,
  vocab: null,

  /**
   * Non-standard Properties
   */
  autocapitalize: null,
  autocorrect: null,
  autosave: null,
  color: null,
  itemprop: null,
  itemscope: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  itemtype: null,
  itemid: null,
  itemref: null,
  results: null,
  security: null,
  unselectable: null
}

var JS_TO_HTML = (function(map) {
  var key, desc, cache = {};
  for (key in map) {
    desc = map[key];
    if (!desc) {
      desc = map[key] = {};
    }
    if (!desc.attributeName) {
      desc.attributeName = key.toLowerCase();
    }
    cache[key] = desc.attributeName;
  }
  return cache;
})(DOM_PROPERTY_DESCRIPTORS);

JS_TO_HTML.cssFloat = 'float'; // TODO

var HTML_TO_JS = (function(map) {
  var key, cache = {};
  for (key in map) {
    if (hasOwnProp.call(map, key)){
      cache[map[key]] = key;
    }
  }
  return cache;
})(JS_TO_HTML);

var namespaceURIs = {
  html: 'http://www.w3.org/1999/xhtml',
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
};

var CSSVendorPrefix, CSSVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

function checkCSSVendorPrefix($style, keyCapitalized) {
  for (var i = 0; i < CSSVendorPrefixes.length; ++i) {
    if ((CSSVendorPrefixes[i] + keyCapitalized) in $style) {
      return CSSVendorPrefixes[i];
    }
  }
}

var $doc = window.document;

var REGEXP_1 = /-([a-z])?/g;
var REGEXP_2 = /([A-Z])/g;
var REPLACER_1 = function(match, char) {
  return char ? char.toUpperCase() : '';
}
var REPLACER_2 = function(match, char) {
  return '-' + char.toLowerCase();
}

var camelCache = {};
function toCamelCase(key) {
  if (key in HTML_TO_JS) {
    return HTML_TO_JS[key];
  }
  if (key.indexOf('-') < 0) {
    return key;
  }
  if (key in camelCache) {
    return camelCache[key];
  }
  var name = key.replace(REGEXP_1, REPLACER_1);
  camelCache[key] = name;
  return name;
}

var kebabCache = {};
function toKebabCase(key) {
  if (key in JS_TO_HTML) {
    return JS_TO_HTML[key];
  }
  if (key in kebabCache) {
    return kebabCache[key];
  }
  var name = REGEXP_2.test(key) ? key.replace(REGEXP_2, REPLACER_2) : key;
  kebabCache[key] = name;
  return name;
}

function isBoolProp(key) {
  var desc = DOM_PROPERTY_DESCRIPTORS[key];
  return desc && desc.isBoolProperty;
}

function flatten(children, array) {
  var i, n = children.length, child;
  array = array || [];
  for (i = 0; i < n; ++i) {
    child = children[i];
    if (child.$type === 0) {
      if (child._children) {
        flatten(child._children, array);
      }
    } /*else if (child.$type === 13) {
      if (child._content) {
        flatten([child._content], array);
      }
    }*/ else {
      array.push(child);
    }
  }
  return array;
}

function mergeProps(outerProps, innerProps) {
  if (innerProps) {
    var key, props = {};
    assign(props, outerProps);
    for (key in innerProps) {
      if (props[key] == null) {
        props[key] = innerProps[key];
      }
    }
    return props;
  }
  return outerProps;
}

function mergeDirty(outerDirty, innerDirty) {
  if (innerDirty) {
    return assign({}, innerDirty, outerDirty);
  }
  return outerDirty;
}

var Array$slice = Array.prototype.slice;

function ExtagDom() {
  var $skin = this, fn = arguments[0];

  if (fn && $skin[fn]) {
    return $skin[fn].apply($skin, Array$slice.call(arguments, 1));
  }
  //throw new Error('');
}

assign(ExtagDom, {
  // eslint-disable-next-line no-undef
  version: __VERSION__,
  /**
   * @required
   */
  toCamelCase: toCamelCase,

  /**
   * @required
   */
  toKebabCase: toKebabCase,

  isBoolProp: isBoolProp,


  isText: function isText($skin) {
    return $skin ? $skin.nodeType === 3 : false;
  },

  isComment: function isComment($skin) {
    return $skin ? $skin.nodeType === 8 : false;
  },

  isElement: function isElement($skin) {
    return $skin ? $skin.nodeType === 1 : false;
  },

  // isFragment: function isFragment($skin) {
  //   return $skin ? $skin.nodeType === 11 : false;
  // },

  createText: function createText(data) {
    return $doc.createTextNode(data);
  },

  createElement: function createElement(ns, tag) {
    return !ns ? $doc.createElement(tag) : $doc.createElementNS(namespaceURIs[ns], tag);
  },

  createFragment: function createFragment() {
    return $doc.createDocumentFragment();
  },

  getTagName: function getTagName($skin) {
    var tagName = $skin.tagName;
    return tagName ? tagName.toLowerCase() : '';
  },

  getNameSpace: function getNameSpace($skin) {
    if (ExtagDom.isElement($skin)) {
      var xmlns = $skin.namespaceURI || $skin.getAttribute('xmlns');
      return ExtagDom.toNameSpace(xmlns);
    }
    return '';
  },

  hasNameSpace: function hasNameSpace(ns) {
    return hasOwnProp.call(namespaceURIs, ns);
  },

  /**
   * @required
   */
  toNameSpace: function toNameSpace(xmlns) {
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
  },

  toOuterHTML: function($skin) {
    return $skin.outerHTML;
  },

  getAttrs: function getAttrs($skin) {
    if (ExtagDom.isElement($skin) && $skin.hasAttributes()) {
      var attrs = {}, $attrs = $skin.attributes, $attr, name, desc;

      for (var i = 0, n = $attrs.length; i < n; ++i) {
        $attr = $attrs[i];
       
        name = $attr.namespaceURI ? (ExtagDom.toNameSpace($attr.namespaceURI) + ':' + $attr.name) : $attr.name;
        
        if (hasOwnProp.call(HTML_TO_JS, name)) {
          desc = DOM_PROPERTY_DESCRIPTORS[HTML_TO_JS[name]];
          if (desc && desc.isBoolProperty) {
            attrs[name] = 'true';
          } else {
            attrs[name] = $attr.value;
          }
        } else {
          attrs[name] = $attr.value;
        }
      }

      return attrs;
    }
  },

  hasProp: function hasProp($skin, name) {
    return name in $skin;
  },

  getProp: function getProp($skin, name) {
    return $skin[name];
  },

  ///**
  // * @required
  // * @internal
  // */
  //setProp: function setProp($skin, name, value) {
  //  $skin[name] = value;
  //},

  //getComputedStyle: function getComputedStyle($skin) {
  //  return window.getComputedStyle($skin);
  //},

  getChildren: function getChildren($skin) { // include texts and comments, getChildrenCopy, getContents
    var $copy = [], $children = $skin.childNodes;// ExtagDom.getProp($skin, 'childNodes');

    if ($children && $children.length) {
      $copy.push.apply($copy, $children);
    }

    return $copy;
  },

  getParent: function getParent($skin) {
    return $skin.parentNode;
  },

  /**
   * Get the shell of the $skin
   *
   * @param {Node} $skin
   * @returns {Shell}
   */
  getShell: function getShell($skin) {
    return $skin && $skin.__extag_shell__; 
  },

  /**
   * Set the shell of the $skin
   *
   * @param {Node} $skin
   * @param {Shell} shell
   */
  setShell: function($skin, shell) {
    if (shell) {
      $skin.__extag_shell__ = shell;
    } else {
      delete $skin.__extag_shell__;
    }
  },

  /**
   * attach a shell to the $skin
   * @required
   */
  attachShell: function attachShell($skin, shell) {
    var _shell = ExtagDom.getShell($skin);

    if (_shell) {
      if (_shell === shell) {
        return;
      } else {
        throw new Error('a shell can not attach a $skin that has been attached');
      }
    }

    if (shell.$type === 1 && shell.tag !== ExtagDom.getTagName($skin)) {
      throw new Error('a shell can not attach a $skin that has a different tag');
    }

    if (shell.ns !== ExtagDom.getNameSpace($skin)) {
      throw new Error('a shell can not attach a $skin that has a different namespace');
    }

    ExtagDom.setShell($skin, shell);
  },

  /**
   * detach a shell from the $skin
   * @required
   */
  detachShell: function detachShell($skin, shell) {
    var _shell = ExtagDom.getShell($skin);
    if (_shell === shell) {
      ExtagDom.setShell($skin, null);
    }
  },

  query: function query(selector, $skin) { // TODO: query(selector, $skin = document);
    return ($skin || $doc).querySelector(selector);
  },

  invoke: function($skin, method, args) {
    $skin[method].apply($skin, args);
  },

  //queryAll: function queryAll($skin, selector) {
  //  return $skin.querySelectorAll(selector);
  //},

  /**
   * @required
   */
  mayDispatchEvent: function mayDispatchEvent($skin, type) {
    var tagName = $skin.tagName;
    if (!tagName) {
      return false;
    }
    
    var events = tag2events[tagName] || {};
    if (type in events) {
      return events[type];
    }
    events[type] = false;
    tag2events[tagName] = events

    var eventHook = 'on' + type, value;
    if (eventHook in $skin) {
      // if (typeof $skin[eventHook] === 'function') {
      //   return true;
      // }
      value = $skin.getAttribute(eventHook);
      try {
        $skin.setAttribute(eventHook, 'void 0');
        if (typeof $skin[eventHook] === 'function') {
          $skin[eventHook] = null;
          events[type] = true;
        }
      } catch (e) {
        events[type] = false;
      }
      if (value) {
        $skin.setAttribute(eventHook, value);
      } else {
        $skin.removeAttribute(eventHook);
      }
    }
    return events[type];
  },

  /**
   * @required
   */
  addEventListener: function addEventListener($skin, type, func, opts) {
    // if (opts) {
    //   $skin.addEventListener(type, func, supportsPassiveOption ? opts : !!opts.capture);
    // } else {
    //   $skin.addEventListener(type, func, false);
    // }
    if (!opts) {
      $skin.addEventListener(type, func);
    } else if (!opts.passive) {
      $skin.addEventListener(type, func, !!opts.capture);
    } else {
      $skin.addEventListener(type, func, supportsPassiveOption ? opts : !!opts.capture);
    }
  },

  /**
   * @required
   */
  removeEventListener: function removeEventListener($skin, type, func, opts) {
    $skin.removeEventListener(type, func, opts ? !!opts.capture : false);
  },

  /**
   * @required
   */
  renderShell: function($skin, shell) {
    if (ExtagDom.getShell($skin) !== shell) { 
      throw new Error('the shell is not attached to this $skin');
    }

    var props, dirty;

    props = shell._props;
    dirty = shell._dirty;
    if (shell.__props) {
      props = mergeProps(props, shell.__props._props);
      dirty = mergeDirty(dirty, shell.__props._dirty);
    }
    if (props && dirty) {
      ExtagDom.renderProps($skin, props, dirty);
    }

    if (shell.tag) {
      var shadowMode = props.shadowMode;

      var attrs = shell._attrs;
      var style = shell._style;
      var classes = shell._classes;
      var children = shell._children;

      if (shell.$type === 1) {
        if (attrs) {
          props = attrs._props;
          dirty = attrs._dirty;
        } else {
          props = null;
          dirty = null;
        }
        if (shell.__attrs) {
          props = mergeProps(props, shell.__attrs && shell.__attrs._props);
          dirty = mergeDirty(dirty, shell.__attrs && shell.__attrs._dirty);
        }
        if (props && dirty) {
          ExtagDom.renderAttrs($skin, props, dirty);
        }
        
        if (style) {
          props = style._props;
          dirty = style._dirty;
        } else {
          props = null;
          dirty = null;
        }
        if (shell.__style) {
          props = mergeProps(props, shell.__style._props);
          dirty = mergeDirty(dirty, shell.__style._dirty);
        }
        if (props && dirty) {
          ExtagDom.renderStyle($skin, props, dirty);
        }

        if (classes) {
          props = classes._props;
          dirty = classes._dirty;
        } else {
          props = null;
          dirty = null;
        }
        if (shell.__classes) {
          props = mergeProps(props, shell.__classes._props);
          dirty = mergeDirty(dirty, shell.__classes._dirty);
        }
        if (props && dirty) {
          ExtagDom.renderClasses($skin, props, dirty);
        }
      }          
      
      if (children && (shell.$flag & FLAG_CHANGED_CHILDREN)) {
        // var $removed;

        if (!shadowMode || !$skin.attachShadow) {
          ExtagDom.renderChildren($skin, shell, flatten(children));
        } else {
          if ($skin.shadowRoot == null) {
            $skin.attachShadow({mode: shadowMode});
          }
          ExtagDom.renderChildren($skin.shadowRoot, shell, flatten(children));
        }

        // if ($removed && $removed.length) {
        //   for (var i = 0, n = $removed.length; i < n; ++i) {
        //     var $parent = ExtagDom.getParent($removed[i]);
        //     var _shell = ExtagDom.getShell($removed[i]);
        //     if (!$parent && _shell) {
        //       _shell.detach();
        //     }
        //   }
        // }
      }

      if (shell._commands && (shell.$flag & FLAG_CHANGED_COMMANDS)) {
        ExtagDom.invokeCommands($skin, shell._commands)
      }
    }
  },

  /**
   * @required
   */
  renderAttrs: function renderAttrs($skin, attrs, dirty) {
    var key, value, index, nsURI;
    //if (!dirty) { return; }
    for (key in dirty) {
      if (!hasOwnProp.call(dirty, key)) { continue; }

      value = attrs[key];
      index = key.indexOf(':');

      if (index > 0) {
        nsURI = namespaceURIs[key.slice(0, index)];
      }

      if (!nsURI) {
        if (value != null) {
          $skin.setAttribute(key, value);
        } else {
          $skin.removeAttribute(key);
        }
      } else {
        key = key.slice(index + 1);

        if (value != null) {
          $skin.setAttributeNS(nsURI, key, value);
        } else {
          $skin.removeAttributeNS(nsURI, key);
        }
      }
    }
  },

  /**
   * @required
   */
  renderProps: function renderProps($skin, props, dirty) {
    var key, desc, value;
    //if (!dirty) { return; }
    for (key in dirty) {
      if (!hasOwnProp.call(dirty, key)) { continue; }
      desc = DOM_PROPERTY_DESCRIPTORS[key];
      value = props[key];
      if (desc) {
        if (desc.mustUseProperty) {
          $skin[key] = value;
        } else if (value != null) {
          $skin.setAttribute(desc.attributeName, value);
        } else {
          $skin.removeAttribute(desc.attributeName);
        }
      } else if (value != null) {
        $skin.setAttribute(toKebabCase(key), value);
      } else {
        $skin.removeAttribute(toKebabCase(key));
      }
    }
  },

  /**
   * @required
   */
  renderStyle: function renderStyle($skin, style, dirty) {
    var key, $style = $skin.style;
    //if (!dirty) { return; }
    for (key in dirty) {
      if (!hasOwnProp.call(dirty, key)) { continue; }

      if (key in $style) {
        $style[key] = style[key];
      } else if (key.slice(0, 2) === '--') { // css var
        $style.setProperty(key, style[key]);
      } else {
        var keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1);

        if (!CSSVendorPrefix) {
          CSSVendorPrefix = checkCSSVendorPrefix($style, keyCapitalized);
        }

        if (CSSVendorPrefix) {
          $style[CSSVendorPrefix + keyCapitalized] = style[key];
        }
      }
    }
  },

  /**
   * @required
   */
  renderClasses: function renderClasses($skin, classes, dirty) {
    var key, classList = $skin.classList;
    //if (!dirty) { return; }
    if (classList) {
      for (key in dirty) {
        if (!hasOwnProp.call(dirty, key)) { continue; }

        if (classes[key]) {
          classList.add(key);
        } else {
          classList.remove(key);
        }
      }
    } else {
      var names = [];
      for (key in classes) {
        if (hasOwnProp.call(classes, key) && classes[key]) {
          names.push(key);
        }
      }
      $skin.setAttribute('class', names.join(' '));
    }
  },

  invokeCommands: function invokeCommands($skin, commands) {
    for (var i = 0, n = commands.length; i < n; ++i) {
      var command = commands[i];
      if (command && command.name) {
        ExtagDom.invoke($skin, command.name, command.args);
      }
    }
  },

  /**
   * @required
   */
  renderChildren: function renderChildren($skin, shell, children) {
    if (shell.$type === 0) { return; }

    var i, n, m;// child, $existed;
    var newChild, oldChild;
    var $newChild, $oldChild, $parent;
    var $removed = [], $children = $skin.childNodes;

    n = children.length;
    m = $children.length;

    if (m) {
      for (i = m - 1; i >= 0; --i) {
        $oldChild = $children[i];
        oldChild = ExtagDom.getShell($oldChild);
        if (oldChild && !oldChild.getParent()) {
          $skin.removeChild($oldChild);
          $removed.push($oldChild);
        }
      }
      for (i = $removed.length - 1; i >= 0;  --i) {
        $parent = ExtagDom.getParent($removed[i]);
        oldChild = ExtagDom.getShell($removed[i]);
        if (!$parent && oldChild) { 
          oldChild.detach();
        }
      }
    }

    if (n) {
      for (i = 0; i < n; ++i) {
        newChild = children[i];
        $newChild = newChild.$skin;
        if ($newChild) {
          $newChild.__extag_index__ = i;
        }
      }
      for (i = 0; i < n; ++i) {
        newChild = children[i];
        $newChild = newChild.$skin;
        $oldChild = $children[i];
        if (!$newChild) {
          var ns = newChild.ns, tag = newChild.tag, type = newChild.$type;
          if (!$oldChild || tag !== ExtagDom.getTagName($oldChild) || ns !== ExtagDom.getNameSpace($oldChild)
            || ((oldChild = $oldChild ? ExtagDom.getShell($oldChild) : null) && oldChild !== newChild)) {
            $newChild = type === 1 ? ExtagDom.createElement(ns, tag) : ExtagDom.createText('');
          } else {
            $newChild = $oldChild;
          }
          newChild.attach($newChild);
        }

        if (!$oldChild) {
          $skin.appendChild($newChild);
        } else if ($newChild !== $oldChild) {
          $skin.insertBefore($newChild, $oldChild);
          if ($oldChild.__extag_index__) {
            $skin.insertBefore($oldChild, $children[$oldChild.__extag_index__] || null)
          }
        }
      }
    }

    // m = $children.length;

    // if (n < m) {
    //   $removed = [];
    //   for (i = m - 1; i >= n; --i) {
    //     $existed = $children[i];
    //     $removed.push($existed);
    //     $skin.removeChild($existed);
    //   }
    // }

    // return $removed;
  }
});

if (typeof Extag !== 'undefined') {
  // eslint-disable-next-line no-undef
  Extag.conf('view-engine', ExtagDom);
}

export default ExtagDom