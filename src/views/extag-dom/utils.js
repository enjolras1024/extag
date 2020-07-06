import {
  namespaceURIs,
  // HTML_TO_JS,
  // JS_TO_HTML
} from './config';

import { 
  slice,
  hasOwnProp 
} from "src/share/functions";


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

var kebabCache = {};
function toKebabCase(key) {
  // if (key in JS_TO_HTML) {
  //   return JS_TO_HTML[key];
  // }
  if (key in kebabCache) {
    return kebabCache[key];
  }
  var name = REGEXP_2.test(key) ? key.replace(REGEXP_2, REPLACER_2) : key;
  kebabCache[key] = name;
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

function getChildren($skin) { // include texts and comments, getChildrenCopy, getContents
  var $copy = [], $children = $skin.childNodes;// ExtagDOM.getProp($skin, 'childNodes');

  if ($children && $children.length) {
    $copy.push.apply($copy, $children);
  }

  return $copy;
}

function getParent($skin) {
  return $skin.parentNode;
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

export {
  query,
  invoke, 
  
  getShell,
  setShell,

  getParent,
  getChildren,

  getTagName,
  getNameSpace,

  hasNameSpace,

  toNameSpace,
  toCamelCase,
  toKebabCase,

  toClassList
  
}