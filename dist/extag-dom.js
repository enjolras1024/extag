/**
 * ExtagDom v0.2.3
 * (c) enjolras.chen
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ExtagDom = factory());
}(this, (function () { 'use strict';

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

  // var MUST_USE_PROPERTY = 0x1;
  // var HAS_BOOLEAN_VALUE = 0x2;

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
  };

  // var DOM_PROPERTIES = {
  //   /**
  //    * Standard Properties
  //    */
  //   accept: 0,
  //   acceptCharset: 4, // => accept-charset
  //   accessKey: 0,
  //   action: 0,
  //   allowFullscreen: HAS_BOOLEAN_VALUE,
  //   allowTransparency: 0,
  //   alt: 0,
  //   async: HAS_BOOLEAN_VALUE,
  //   autocomplete: 0,
  //   autofocus: HAS_BOOLEAN_VALUE,
  //   autoplay: HAS_BOOLEAN_VALUE,
  //   capture: HAS_BOOLEAN_VALUE,
  //   cellPadding: 0,
  //   cellSpacing: 0,
  //   charset: 0,
  //   challenge: 0,
  //   checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  //   cite: 0,
  //   classid: 0,
  //   className: 0, // => class
  //   cols: 0,//HAS_POSITIVE_NUMERIC_VALUE,
  //   colSpan: 0,
  //   content: 0,
  //   contentEditable: 0,
  //   contextMenu: 0,
  //   controls: HAS_BOOLEAN_VALUE,
  //   coords: 0,
  //   crossOrigin: 0,
  //   data: MUST_USE_PROPERTY, // For `<object />` acts as `src`, and TextNode.
  //   dateTime: 0,
  //   'default': HAS_BOOLEAN_VALUE,
  //   defer: HAS_BOOLEAN_VALUE,
  //   dir: 0,
  //   disabled: HAS_BOOLEAN_VALUE,
  //   download: 0,//HAS_OVERLOADED_BOOLEAN_VALUE,
  //   draggable: 0,
  //   enctype: 0,
  //   form: 0,
  //   formAction: 0,
  //   formEncType: 0,
  //   formMethod: 0,
  //   formNoValidate: HAS_BOOLEAN_VALUE,
  //   formTarget: 0,
  //   frameBorder: 0,
  //   headers: 0,
  //   height: 0,
  //   hidden: HAS_BOOLEAN_VALUE,
  //   high: 0,
  //   href: 0,
  //   hreflang: 0,
  //   htmlFor: 4, // => for
  //   httpEquiv: 0,
  //   icon: 0,
  //   id: 0,
  //   // innerHTML
  //   innerHTML: MUST_USE_PROPERTY,
  //   inputMode: 0, // ? no support for now
  //   integrity: 0,
  //   is: 0,
  //   keyparams: 0,
  //   keytype: 0,
  //   kind: 0,
  //   label: 0,
  //   lang: 0,
  //   list: 0,
  //   loop: HAS_BOOLEAN_VALUE,
  //   low: 0,
  //   manifest: 0,
  //   marginHeight: 0,
  //   marginWidth: 0,
  //   max: 0,
  //   maxLength: 0,
  //   media: 0,
  //   mediaGroup: 0,
  //   method: 0,
  //   min: 0,
  //   minLength: 0,
  //   multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  //   muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  //   name: 0,
  //   nonce: 0,
  //   noValidate: HAS_BOOLEAN_VALUE,
  //   open: HAS_BOOLEAN_VALUE,
  //   optimum: 0,
  //   pattern: 0,
  //   placeholder: 0,
  //   poster: 0,
  //   preload: 0,
  //   profile: 0,
  //   radiogroup: 0,
  //   readOnly: HAS_BOOLEAN_VALUE,
  //   referrerPolicy: 0,
  //   rel: 0,
  //   required: HAS_BOOLEAN_VALUE,
  //   reversed: HAS_BOOLEAN_VALUE,
  //   role: 0,
  //   rows: 0,//HAS_POSITIVE_NUMERIC_VALUE,
  //   rowSpan: 0,//HAS_NUMERIC_VALUE,
  //   sandbox: 0,
  //   scope: 0,
  //   scoped: HAS_BOOLEAN_VALUE,
  //   scrolling: 0,
  //   seamless: HAS_BOOLEAN_VALUE,
  //   selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  //   shape: 0,
  //   size: 0,//HAS_POSITIVE_NUMERIC_VALUE,
  //   sizes: 0,
  //   span: 0,//HAS_POSITIVE_NUMERIC_VALUE,
  //   spellcheck: 0,
  //   src: 0,
  //   srcdoc: 0,
  //   srclang: 0,
  //   srcset: 0,
  //   start: 0,//HAS_NUMERIC_VALUE,
  //   step: 0,
  //   style: 0,
  //   summary: 0,
  //   tabIndex: 0,
  //   target: 0,
  //   title: 0,
  //   type: 0,
  //   useMap: 0,
  //   value: MUST_USE_PROPERTY,
  //   width: 0,
  //   wmode: 0,
  //   wrap: 0,

  //   /**
  //    * RDFa Properties
  //    */
  //   about: 0,
  //   datatype: 0,
  //   inlist: 0,
  //   prefix: 0,
  //   property: 0,
  //   resource: 0,
  //   'typeof': 0,
  //   vocab: 0,

  //   /**
  //    * Non-standard Properties
  //    */
  //   autocapitalize: 0,
  //   autocorrect: 0,
  //   autosave: 0,
  //   color: 0,
  //   itemprop: 0,
  //   itemscope: HAS_BOOLEAN_VALUE,
  //   itemtype: 0,
  //   itemid: 0,
  //   itemref: 0,
  //   results: 0,
  //   security: 0,
  //   unselectable: 0
  // };

  var JS_TO_HTML = (function(map) {
    var key, desc, cache = {};
    for (key in map) {
      desc = map[key];
      if (desc && desc.attributeName) {
        cache[key] = desc.attributeName;
      } else {
        cache[key] = key.toLowerCase();
      }
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
  };
  var REPLACER_2 = function(match, char) {
    return '-' + char.toLowerCase();
  };

  function toCamelCase(key) {
    if (key in HTML_TO_JS) {
      return HTML_TO_JS[key];
    }
    if (key.indexOf('-') < 0) {
      return key;
    }
    return key.replace(REGEXP_1, REPLACER_1);
  }

  function toKebabCase(key) {
    if (key in JS_TO_HTML) {
      return JS_TO_HTML[key];
    }
    return REGEXP_2.test(key) ? key.replace(REGEXP_2, REPLACER_2) : key;
  }

  function isBoolProp(key) {
    var desc = DOM_PROPERTY_DESCRIPTORS[key];
    return desc && desc.isBoolProperty;
  }

  // function flatten(children, array) {
  //   var i, n = children.size(), child;
  //   array = array || [];
  //   for (i = 0; i < n; ++i) {
  //     child = children.get(i);
  //     if (child.type === 0) {
  //       flatten(child.children, array);
  //     } else {
  //       array.push(child);
  //     }
  //   }
  //   return array;
  // }

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
      // assign({}, innerProps, outerProps);
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
    version: "0.2.3",
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

    createElement: function createElement(ns, tag/*, type*/) {
      return !ns /*|| !$doc.createElementNS*/ ? $doc.createElement(tag) : $doc.createElementNS(namespaceURIs[ns], tag);
    },

    createFragment: function createFragment() {
      return $doc.createDocumentFragment();
    },

    getTagName: function getTagName($skin) {
      var tagName = $skin.tagName; // ExtagDom.getProp(skin, 'tagName');
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

    toTemplate: function toTemplate($skin/*, $parent*/) {
      if (!ExtagDom.isElement($skin)) {
        return null;
      }

      var template = {};
      template.ns = ExtagDom.getNameSpace($skin);// || ($parent && $parent.ns);
      template.tagName = ExtagDom.getTagName($skin);

      var $attrs = ExtagDom.getAttrs($skin);
      if ($attrs) {
        template.attributes = $attrs; 
      }

      var $children = ExtagDom.getChildren($skin);
      if ($children.length) {
        var i , n , $child;
        template.children = [];
        for (i = 0, n = $children.length; i < n; ++i) {
          $child = $children[i];
          if (ExtagDom.isText($child)) {
            template.children.push(ExtagDom.getProp($child, 'data'));
          } else if (ExtagDom.isElement($child)) {
            template.children.push(ExtagDom.toTemplate($child, $skin));
          } else if (ExtagDom.isComment($child)) {
            template.children.push({ns: '', tagName: '!', comment: ExtagDom.getProp($child, 'data')});
          }
        }
      }

      return template;
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
        Object.defineProperty($skin, '__extag_shell__', { // __extag_shell__
          value: shell,
          writable: true,
          enumerable: false,
          configurable: true
        });
      } else {
        delete $skin.__extag_shell__;
      }
    },

    /**
     * attach a shell to the $skin
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
      tag2events[tagName] = events;

      var eventHook = 'on' + type, value;
      if (eventHook in $skin) {
        if (typeof $skin[eventHook] === 'function') {
          return true;
        }
        value = $skin.getAttribute(eventHook);
        try {
          $skin.setAttribute(eventHook, 'return;');
          if (typeof $skin[eventHook] === 'function') {
            $skin[eventHook] = null;
            events[type] = true;
          } else {
            events[type] = false;
          }
        } catch (e) {
          events[type] = false;
        }
        if (value) {
          $skin.setAttribute(eventHook, value);
        } else {
          $skin.removeAttribute(eventHook);
        }
      } else {
        events[type] = false;
      }
      return events[type];
    },

    // /**
    //  * @required
    //  */
    // getFixedEvent: function getFixedEvent(event) {
    //   if (event.key) {
    //     event.name = event.key[0].toLowerCase() + event.key.slice(1);
    //   } else if (event.button) {
    //     event.name = ['left', 'middle', 'right'][event.button]; // for left-hand
    //   }

    //   return event;
    // },

    /**
     * @required
     */
    addEventListener: function addEventListener($skin, type, func, opts) {
      // $skin.addEventListener(type, listener, useCapture);
      if (opts) {
        $skin.addEventListener(type, func, supportsPassiveOption ? opts : !!opts.capture);
      } else {
        $skin.addEventListener(type, func, false);
      }
    },

    /**
     * @required
     */
    removeEventListener: function removeEventListener($skin, type, func, opts) {
      // $skin.removeEventListener(type, listener, useCapture);
      $skin.removeEventListener(type, func, opts ? !!opts.capture : false);
    },

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
          // if (attrs && attrs._dirty) {
          //   ExtagDom.renderAttrs($skin, attrs._props, attrs._dirty);
          // }
          // if (style && style._dirty) {
          //   ExtagDom.renderStyle($skin, style._props, style._dirty);
          // }
          // if (classes && classes._dirty) {
          //   ExtagDom.renderClasses($skin, classes._props, classes._dirty);
          // }

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
        
        if (children && (shell.$flag & 2)) {
          // if ("development" === 'development') {
          //   if (props.hasOwnProperty('innerHTML')) {
          //     console.error("You'd better not use innerHTML and children together for ", this); // TODO: check when parsing
          //   }
          //   for (i = 0; i < children.length; ++i) {
          //     if (shell.guid > children[i].guid) {
          //       console.error('You should create parent shell before creating its children, in order to rendering from parent to children.');
          //     }
          //   }
          // }
          
          var $removed;

          if (!shadowMode || !$skin.attachShadow) {
            $removed = ExtagDom.renderChildren($skin, shell, flatten(children));
          } else {
            if ($skin.shadowRoot == null) {
              $skin.attachShadow({mode: shadowMode});
            }
            $removed = ExtagDom.renderChildren($skin.shadowRoot, shell, flatten(children));
          }

          if ($removed && $removed.length) {
            for (var i = 0, n = $removed.length; i < n; ++i) {
              var $parent = ExtagDom.getParent($removed[i]);
              var _shell = ExtagDom.getShell($removed[i]);
              if (!$parent && _shell) { // TODO: && !shell._secrets.reuse
                // delete _shell.__num__;
                _shell.detach();
                // if (_shell.__config__.autoDestroy) {
                //   _shell.destroy();
                // }
              }
            }
          }
        }

        if (shell._commands) {
          ExtagDom.invokeCommands($skin, shell._commands);
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
            $skin.setAttribute(JS_TO_HTML[key], value);
          } else {
            $skin.removeAttribute(JS_TO_HTML[key]);
          }
        } else if (value != null) {
          $skin.setAttribute(toKebabCase(key), value);
        } else {
          $skin.removeAttribute(toKebabCase(key));
        }
      }
    },
    // renderProps: function renderProps($skin, props, dirty) {
    //   var key, value, index;
    //   //if (!dirty) { return; }
    //   for (key in dirty) {
    //     if (!dirty.hasOwnProperty(key)) { continue; }

    //     index = key.indexOf(':');
    //     value = props[key];
        
    //     if (index < 0) {
    //       if (DOM_PROPERTIES[key]) { // MUST_USE_PROPERTY or HAS_BOOLEAN_VALUE
    //         $skin[key] = value;
    //       } else if (value != null) {
    //         $skin.setAttribute(key, value);
    //       } else {
    //         $skin.removeAttribute(key);
    //       }
    //     } else {
    //       var nsURI = namespaceURIs[key.slice(0, index)];
    //       key = key.slice(index + 1);
    //       if (nsURI && key) {
    //         if (value != null) {
    //           $skin.setAttributeNS(nsURI, key, value);
    //         } else {
    //           $skin.removeAttributeNS(nsURI, key)
    //         }
    //       }
    //     }
    //   }
    // },

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
        // console.log(command.name, command.args)
        ExtagDom.invoke($skin, command.name, command.args);
      }
    },

    /**
     * @required
     */
    renderChildren: function renderChildren($skin, shell, children) {
      // console.log('renderChildren', shell.toString(), children.length, shell.children.length)
      if (shell.$type === 0) { return; }

      var i, n, m, child, $existed, $newChild, $oldChild, $removed, $children = $skin.childNodes;

      n = children.length;

      if (n) {
        for (i = 0; i < n; ++i) {
          child = children[i];
          $newChild = child.$skin;
          $oldChild = $children[i];
          if (!$newChild) {
            var ns = child.ns, tag = child.tag, type = child.$type, _child;
            if (!$oldChild || tag !== ExtagDom.getTagName($oldChild) || ns !== ExtagDom.getNameSpace($oldChild)
              || ((_child = $oldChild ? ExtagDom.getShell($oldChild) : null) && _child !== child)) {
              $newChild = type === 1 ? ExtagDom.createElement(ns, tag, child._props && child._props.type) : ExtagDom.createText('');
                            // (type === 3 ? ExtagDom.createText('') : ExtagDom.createFragment());
            } else {
              $newChild = $oldChild;
            }
            child.attach($newChild);
            
            // if (child.type !== 0) {
              // child.render();
            // }
          }

          if (!$oldChild) {
            $skin.appendChild($newChild);
          } else if ($newChild !== $oldChild) {
            $skin.insertBefore($newChild, $oldChild);
          }

          // child.__num__ = (shell.__num__ || '') + '.' + i;
        }
      }

      m = $children.length;

      if (n < m) {
        $removed = [];
        for (i = m - 1; i >= n; --i) {
          $existed = $children[i];
          $removed.push($existed);
          $skin.removeChild($existed);
        }
      }

      return $removed;
    }
  });

  if (typeof Extag !== 'undefined') {
    // eslint-disable-next-line no-undef
    Extag.conf('view-engine', ExtagDom);
  }

  return ExtagDom;

})));
