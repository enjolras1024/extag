/**
 * ExtagDOM v0.5.5
 * (c) 2017-present enjolras.chen
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ExtagDOM = factory());
}(this, (function () { 'use strict';

  // src/share/constants.js 

  // shell type
  var TYPE_FRAG = 0;
  var TYPE_ELEM = 1;
  var TYPE_TEXT = 3;
  var FLAG_CHANGED_CHILDREN = 2;
  var FLAG_CHANGED_COMMANDS = 8;

  // symbols
  var EXTAG_VNODE = Object.freeze({});
  var EMPTY_OBJECT = Object.freeze({});
  var EMPTY_ARRAY = Object.freeze([]);

  // src/share/functions.js 

  var slice = Array.prototype.slice;
  var hasOwnProp = Object.prototype.hasOwnProperty;

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
    },
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
    }, // For `<object />` acts as `src`, and text.
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
    },
    httpEquiv: null,
    icon: null,
    id: null,
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

  (function() {
    var key, desc, map = {};
    for (key in DOM_PROPERTY_DESCRIPTORS) {
      desc = DOM_PROPERTY_DESCRIPTORS[key];
      if (!desc) {
        desc = DOM_PROPERTY_DESCRIPTORS[key] = {};
      }
      desc.propertyName = key;
      if (desc.attributeName == null) {
        desc.attributeName = key.toLowerCase();
      }
      if (desc.attributeName && desc.attributeName !== key) {
        map[desc.attributeName] = desc;
      }
    }
    assign(DOM_PROPERTY_DESCRIPTORS, map);
  })();

  // var JS_TO_HTML = (function(map) {
  //   var key, desc, cache = {};
  //   for (key in map) {
  //     desc = map[key];
  //     if (!desc) {
  //       desc = map[key] = {};
  //     }
  //     if (!desc.attributeName) {
  //       desc.attributeName = key.toLowerCase();
  //     }
  //     cache[key] = desc.attributeName;
  //   }
  //   return cache;
  // })(DOM_PROPERTY_DESCRIPTORS);

  // JS_TO_HTML.cssFloat = 'float'; // TODO

  // var HTML_TO_JS = (function(map) {
  //   var key, cache = {};
  //   for (key in map) {
  //     if (hasOwnProp.call(map, key)){
  //       cache[map[key]] = key;
  //     }
  //   }
  //   return cache;
  // })(JS_TO_HTML);

  var namespaceURIs = {
    html: 'http://www.w3.org/1999/xhtml',
    math: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink'
  };
  // export namespaceURIs;

  var REGEXP_1 = /-([a-z])?/g;
  var REPLACER_1 = function(match, char) {
    return char ? char.toUpperCase() : '';
  };

  var camelCache = {};
  function toCamelCase(key) {
    // if (key in HTML_TO_JS) {
    //   return HTML_TO_JS[key];
    // }
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

  var WHITE_SPACES_REGEXP = /\s+/;

  function toClassList(classes) {
    if (!classes) {
      return;
    }
    var type = typeof classes;
    if (type === 'string') {
      return classes.trim().split(WHITE_SPACES_REGEXP);
    }
    if (type === 'object') {
      var list = [];
      for (var name in classes) {
        if (classes[name]) {
          list.push(name);
        }
      }
      return list;
    }
  }

  function getTagName($skin) {
    var tagName = $skin.tagName;
    return tagName ? tagName.toLowerCase() : '';
  }

  function getNameSpace($skin) {
    if ($skin.nodeType === 1) {
      var xmlns = $skin.namespaceURI || $skin.getAttribute('xmlns');
      return toNameSpace(xmlns);
    }
    return '';
  }

  function hasNameSpace(ns) {
    return hasOwnProp.call(namespaceURIs, ns);
  }

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

  /**
   * Get the shell of the $skin
   *
   * @param {Node} $skin
   * @returns {Shell}
   */
  function getShell($skin) {
    return $skin && $skin.__extag_shell__; 
  }

  /**
   * Set the shell of the $skin
   *
   * @param {Node} $skin
   * @param {Shell} shell
   */
  function setShell($skin, shell) {
    if (shell) {
      $skin.__extag_shell__ = shell;
    } else {
      delete $skin.__extag_shell__;
    }
  }

  function invoke($skin, method) {
    var func = $skin[method];
    if (arguments.length < 3) {
      return func.call($skin);
    } else {
      return func.apply($skin, slice.call(arguments, 2));
    }
  }

  function query(selector, $skin) {
    return ($skin || document).querySelector(selector);
  }

  var tag2events = {};

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

  function mayDispatchEvent($skin, type) {
    var tagName = $skin.tagName;
    if (!tagName) {
      return false;
    }
    
    var events = tag2events[tagName] || {};
    if (type in events) {
      return events[type];
    }
    events[type] = false;
    tag2events[tagName] = events;

    var eventHook = 'on' + type, value;
    if (eventHook in $skin) {
      if (typeof $skin[eventHook] === 'function') {
        events[type] = true;
      } else {
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
    }
    return events[type];
  }

  function addEventListener($skin, type, func, opts) {
    if (!opts) {
      $skin.addEventListener(type, func);
    } else if (!opts.passive) {
      $skin.addEventListener(type, func, !!opts.capture);
    } else {
      $skin.addEventListener(type, func, supportsPassiveOption ? opts : !!opts.capture);
    }
  }

  function removeEventListener($skin, type, func, opts) {
    $skin.removeEventListener(type, func, opts ? !!opts.capture : false);
  }

  function toClassName(classes) {
    if (classes) {
      var type = typeof classes;
      if (type === 'string') {
        return classes;
      }
      if (Array.isArray(classes)) {
        return classes.join(' ');
      }
      if (type === 'object') {
        var names = [];
        for (var name in classes) {
          if (classes[name] && 
              hasOwnProp.call(classes, name)) {
            names.push(name);
          }
        }
        return names.join(' ');
      }
    }
    return '';
  }

  function renderClassName($skin, newValue, oldValue) {
    newValue = toClassName(newValue);
    oldValue = toClassName(oldValue);
    if (newValue !== oldValue) {
      $skin.setAttribute('class', newValue);
    }
  }

  (function() {
    var desc;

    desc = DOM_PROPERTY_DESCRIPTORS.className;
    desc.render = renderClassName;

    desc = DOM_PROPERTY_DESCRIPTORS['class'];
    desc.render = renderClassName;
  })();

  function renderProps($skin, props, dirty) {
    var key, desc, index, value, nsURI;
    //if (!dirty) { return; }
    for (key in dirty) {
      if (hasOwnProp.call(dirty, key)) { 
        value = props[key];
        desc = DOM_PROPERTY_DESCRIPTORS[key];
        if (desc) {
          if (desc.render) {
            desc.render($skin, value, dirty[key]);
          } else if (desc.mustUseProperty) {
            $skin[desc.propertyName] = value;
          } else if (value != null) {
            $skin.setAttribute(desc.attributeName, value);
          } else {
            $skin.removeAttribute(desc.attributeName);
          }
        } else {
          index = key.indexOf(':');
          nsURI = index <= 0 ? null : 
                  namespaceURIs[key.slice(0, index)];
          if (nsURI) {
            // xlink:href ...
            key = key.slice(index + 1);
            if (value != null) {
              $skin.setAttributeNS(nsURI, key, value);
            } else {
              $skin.removeAttributeNS(nsURI, key);
            }
          } else if (index <= 0 || key.slice(0, index) !== 'x') {
            // data-sth, aria-sth, svg attributes ...
            if (value != null) {
              $skin.setAttribute(key, value);
            } else {
              $skin.removeAttribute(key);
            }
          }
        }
      }
    }
  }

  var cssVendorPrefix, cssVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

  function checkCssVendorPrefix(name, $style) {
    for (var i = 0; i < cssVendorPrefixes.length; ++i) {
      if ((cssVendorPrefixes[i] + name) in $style) {
        return cssVendorPrefixes[i];
      }
    }
  }

  var stylePropNameMap = {
    'float': 'cssFloat'
  };

  function getStylePropName(key, $style) {
    if (key in stylePropNameMap) {
      return stylePropNameMap[key];
    }

    var name = toCamelCase(key);
    if (name in $style) {
      stylePropNameMap[key] = name;
      return name;
    }

    name = name.charAt(0).toUpperCase() + name.slice(1); // capitalize
    if (!cssVendorPrefix) {
      cssVendorPrefix = checkCssVendorPrefix(name, $style);
    }
    if (cssVendorPrefix) {
      name = cssVendorPrefix + name;
      if (name in $style) {
        stylePropNameMap[key] = name;
        return name;
      }
    }
  }

  function renderStyle($skin, style, dirty) {
    var key, name, $style = $skin.style;
    for (key in dirty) {
      if (hasOwnProp.call(dirty, key)) {
        if (key[0] !== '-' || key[1] !== '-') {
          name = getStylePropName(key, $style);
          if (name) {
            $style[name] = style[key];
          }
        } else {
          if (style[key] != null) {
            $style.setProperty(key, style[key]);
          } else {
            $style.removeProperty(key);
          }
        }
      }
    }
  }

  // function getParent($skin) {
  //   return $skin.parentNode;
  // }

  function createChild(type, tag, ns) {
    return type === TYPE_TEXT ? 
            document.createTextNode('') :
            (!ns ? document.createElement(tag) : 
            document.createElementNS(namespaceURIs[ns], tag));
  }

  function hasSameId($skin, shell) {
    var _props = shell._props;
    var _id = _props && _props.id;
    var $id = $skin.getAttribute('id');
    return _id == $id; // not use ===
  }

  function hasSameType($skin, shell) {
    var _props = shell._props;
    var _type = (_props && _props.type) || 'text';
    var $type = $skin.getAttribute('type') || 'text';
    return _type === $type
  }

  function hasSameClass($skin, shell) {
    var _classes = shell._classes;
    var className = $skin.getAttribute('class');
    var classObject = _classes && _classes._props;

    if (className && !classObject) {
      return false;
    }

    var list1 = toClassList(className) || EMPTY_ARRAY;
    var list2 = toClassList(classObject) || EMPTY_ARRAY;

    if (list1.length !== list2.length) {
      return false;
    }

    if (list2.length === 1) {
      return list1[0] === list2[0];
    }

    return list1.sort().join(' ') === list2.sort().join(' ');
  }

  /**
   * can hydrate if $skin and shell has same tag name, namescape, id, class and type (just for `input` tag).
   * @param $skin 
   * @param shell 
   */
  function canHydrate($skin, shell) {
    var $meta = shell.$meta;
    if ($meta.type === TYPE_TEXT) {
      return $skin.nodeType === 13;
    }
    // TODO: check x:key or not?
    if ($meta.tag === getTagName($skin) && 
        $meta.ns === getNameSpace($skin) && 
        hasSameId($skin, shell) && 
        hasSameClass($skin, shell) && 
        ($meta.tag !== 'input' || hasSameType($skin, shell))) {
      return true;
    }
  }

  function resumeSomeAttributes($skin) {
    var tagName = getTagName($skin);
    var attributes = $skin.attributes;
    for (var i = attributes.length - 1; i >= 0; --i) {
      var attribute = attributes[i];
      var name = attribute.name;

      if (name === 'id' || name === 'class') {
        continue;
      }
      if (name === 'type' && tagName === 'input') {
        continue;
      }

      var desc = DOM_PROPERTY_DESCRIPTORS[name];
      if (desc && desc.mustUseProperty) {
        if (desc.isBoolProperty) {
          $skin[name] = false; // desc.defaultValue
        } else {
          $skin[name] = '';
        }
      } else {
        if (attribute.namespaceURI) {
          $skin.removeAttributeNS(attribute.namespaceURI, name);
        } else {
          $skin.removeAttribute(name);
        }
      }
    }
  }

  function flattenChildren(children, array) {
    var i, n = children.length, child;
    array = array || [];
    for (i = 0; i < n; ++i) {
      child = children[i];
      if (child.$meta.type === TYPE_FRAG) {
        if (child._children) {
          flattenChildren(child._children, array);
        }
      } else {
        array.push(child);
      }
    }
    return array;
  }

  function renderChildren($skin, shell, children) {
    if (shell.$meta.type === TYPE_FRAG) { return; }

    children = flattenChildren(children);

    var i, n, m;
    var newChild, oldChild;
    var $newChild, $oldChild;
    var $children = $skin.hasChildNodes() ? $skin.childNodes : EMPTY_ARRAY;

    n = children.length;
    m = $children.length;

    if (m) {
      for (i = m - 1; i >= 0; --i) {
        $oldChild = $children[i];
        oldChild = getShell($oldChild);
        if (oldChild && shell !== oldChild.getParent(true)) {
          $skin.removeChild($oldChild);
        }
      }
    }

    if (n) {
      for (i = 0; i < n; ++i) {
        newChild = children[i];
        if (newChild.$skin) {
          newChild.__extag_index__ = i;
        }
      }
      for (i = 0; i < n; ++i) {
        newChild = children[i];
        $newChild = newChild.$skin;
        $oldChild = $children[i];
        oldChild = $oldChild ? getShell($oldChild) : null;
        if (!$newChild) {
          var meta = newChild.$meta;

          if ($oldChild && !oldChild && 
              canHydrate($oldChild, newChild)) {
            $newChild = $oldChild;
            resumeSomeAttributes($oldChild);
          } else {
            $newChild = createChild(meta.type, meta.tag, meta.ns);
          }

          newChild.attach($newChild);
        }

        if (!$oldChild) {
          $skin.appendChild($newChild);
        } else if ($newChild !== $oldChild) {
          $skin.insertBefore($newChild, $oldChild);
          if (oldChild && oldChild.__extag_index__) {
            $skin.insertBefore($oldChild, $children[oldChild.__extag_index__] || null);
          } else {
            $skin.removeChild($oldChild);
          }
        }
      }
    }
  }

  function mergeClasses(outerClasses, innerClasses) {
    var outerClassName = toClassName(outerClasses);
    var innerClassName = toClassName(innerClasses);
    if (!outerClassName) {
      return innerClassName;
    }
    if (!innerClassName) {
      return outerClassName;
    }
    return innerClassName + ' ' + outerClassName;
  }

  function mergeDirty(outerDirty, innerDirty, outerProps) {
    if (!innerDirty) {
      return outerDirty;
    }
    if (!outerDirty) {
      return innerDirty;
    }
    var key, dirty = {};
    for (key in outerDirty) {
      dirty[key] = outerDirty[key];
    }
    for (key in innerDirty) {
      if ((key in dirty) || (key in outerProps)) {
        continue;
      }
      dirty[key] = innerDirty[key];
    }
    if ('class' in dirty) {
      dirty['class'] = mergeClasses(outerDirty[key], innerDirty[key]);
    }
    return dirty;
  }

  function mergeProps(outerProps, innerProps, mergedDirty) {
    if (!mergedDirty) {
      return;
    }
    var key, props = {};
    for (key in mergedDirty) {
      props[key] = (key in outerProps) ? outerProps[key] : innerProps[key];
    }
    if ('class' in props) {
      props['class'] = mergeClasses(outerProps[key], innerProps[key]);
    }
    return props;
  }

  function mergeStyle(outerStyle, innerStyle) {
    var outerProps = outerStyle._props;
    var outerDirty = outerStyle._dirty;
    var innerProps = innerStyle._props;
    var innerDirty = innerStyle._dirty;
    var key, name, style = {};
    if (outerDirty) {
      for (key in outerDirty) {
        if (key[0] !== '-' || key[1] !== '-') {
          name = toCamelCase(key);
        } else {
          name = key;
        }
        style[name] = outerProps[key];
      }
    }
    if (innerDirty) {
      for (key in innerDirty) {
        if (key[0] !== '-' || key[1] !== '-') {
          name = toCamelCase(key);
        } else {
          name = key;
        }
        if ((name in style) || (key in outerProps) || (name in outerProps)) {
          continue;
        }
        style[name] = innerProps[key];
      }
    }
    return style;
  }

  function invokeCommands($skin, commands) {
    for (var i = 0, n = commands.length; i < n; ++i) {
      var command = commands[i];
      if (command && command.name) {
        var method = $skin[command.name];
        if (typeof method === 'function') {
          method.apply($skin, command.args || EMPTY_ARRAY);
        }
      }
    }
  }

  /**
   * attach a shell to the $skin
   * @required
   */
  function attachShell($skin, shell) {
    var _shell = getShell($skin);

    if (_shell) {
      if (_shell === shell) {
        return;
      } else {
        throw new Error('a shell can not attach a $skin that has been attached');
      }
    }

    var meta = shell.$meta;

    if (meta.type === TYPE_ELEM && meta.tag !== getTagName($skin)) {
      throw new Error('a shell can not attach a $skin that has a different tag');
    }

    if (meta.ns !== getNameSpace($skin)) {
      throw new Error('a shell can not attach a $skin that has a different namespace');
    }

    setShell($skin, shell);
  }

  /**
   * detach a shell from the $skin
   * @required
   */
  function detachShell($skin, shell) {
    var _shell = getShell($skin);
    if (_shell === shell) {
      setShell($skin, null);
    }
  }

  function renderShell($skin, shell) {
    if (getShell($skin) !== shell) { 
      throw new Error('the shell is not attached to this $skin');
    }

    var meta = shell.$meta;
    if (meta.type === TYPE_TEXT) {
      if (shell._dirty) {
        $skin.nodeValue = shell._content;
      }
    } else if (meta.type === TYPE_ELEM) {
      var $props = shell.$props, _props, _dirty;
      // render props
      if ($props) {
        _dirty = mergeDirty(shell._dirty, $props._dirty, shell._props, $props._props);
        if (_dirty === shell._dirty) {
          _props = shell._props;
        } else if (_dirty === $props._dirty) {
          _props = $props._props;
        } else {
          _props = mergeProps(shell._props, $props._props, _dirty);
        }
      } else {
        _props = shell._props;
        _dirty = shell._dirty;
      }
      if (_props && _dirty) {
        renderProps($skin, _props, _dirty);
      }
      
      var shadowMode = _props && _props['shadow-mode'];
      var children = shell._children;
      // render style
      var _style = shell._style;
      var $style = shell.$style;
      if (_style && $style) {
        _props = mergeStyle(_style, $style);
        if (_props === _style._props) {
          _dirty = _style._dirty;
        } else if (_props === $style._props) {
          _dirty = $style._dirty;
        } else {
          _dirty = _props;
        }
      } else if (_style) {
        _props = _style._props;
        _dirty = _style._dirty;
      } else if ($style) {
        _props = $style._props;
        _dirty = $style._dirty;
      } else {
        _props = null;
        _dirty = null;
      }
      if (_props && _dirty) {
        renderStyle($skin, _props, _dirty);
      }      
      // render children
      if (children && (shell.$flag & FLAG_CHANGED_CHILDREN)) {
        if (!shadowMode || !$skin.attachShadow) {
          renderChildren($skin, shell, children);
        } else {
          if ($skin.shadowRoot == null) {
            $skin.attachShadow({mode: shadowMode});
          }
          renderChildren($skin.shadowRoot, shell, children);
        }
      }
      // invoke commands
      if (shell._commands && (shell.$flag & FLAG_CHANGED_COMMANDS)) {
        invokeCommands($skin, shell._commands);
      }
    }
  }

  var ExtagDOM = {
    query: query,
    invoke: invoke,
    attachShell: attachShell,
    detachShell: detachShell,
    renderShell: renderShell,
    getTagName: getTagName,
    getNameSpace: getNameSpace,
    hasNameSpace: hasNameSpace,
    mayDispatchEvent: mayDispatchEvent,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
  };

  if (window.Extag) {
    window.Extag.conf('view-engine', ExtagDOM);
  }

  return ExtagDOM;

})));
