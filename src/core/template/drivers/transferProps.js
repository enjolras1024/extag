// src/core/template/drivers/transferProps.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import { toCamelCase } from 'src/share/functions'
import { WHITE_SPACES_REGEXP } from 'src/share/constants'

function toStyle(cssText) {
  var style = {};
  var pieces = cssText.split(';');
  var piece, index, i, name, value;
  for (i = pieces.length - 1; i >= 0; --i) {
    piece = pieces[i];
    index = piece.indexOf(':');
    if (index > 0) {
      name = piece.slice(0, index).trim();
      value =  piece.slice(index + 1).trim();
      style[toCamelCase(name)] = value;
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

function transferProps(shell) {
  if (!shell.$meta.tag) {
    return;
  }

  var _props = shell._props;
  var style, attrs, classes;

  if (shell.hasDirty('attrs')) {
    DirtyMarker.clean(shell, 'attrs');
    attrs = _props.attrs;
    if (typeof attrs === 'object') {
      shell.attrs.reset(attrs);
    } else {
      shell.attrs.reset(null);
    }
  }
  if (shell.hasDirty('style')) {
    DirtyMarker.clean(shell, 'style');
    style = _props.style;
    if (typeof style === 'string') {
      style = toStyle(style);
    }
    if (typeof style === 'object') {
      shell.style.reset(style);
    } else {
      shell.style.reset(null);
    }
  }
  if (shell.hasDirty('classes')) {
    DirtyMarker.clean(shell, 'classes');
    classes = _props.classes;
    if (typeof classes !== 'object') {
      classes = toClasses(classes);
    }
    if (typeof classes === 'object') {
      shell.classes.reset(classes);
    } else {
      shell.classes.reset(null);
    }
  }

  if (!shell.__props || !shell.constructor.__extag_component_class__) { 
      return; 
  }

  var __props = shell.__props;
  
  if (__props.hasDirty('attrs')) {
    var __attrs = shell.__attrs;
    if (!__attrs) {
      __attrs = new Cache(shell);
      shell.__attrs = __attrs;
    }
    DirtyMarker.clean(__props, 'attrs');
    attrs = __props.get('attrs');
    if (typeof attrs === 'object') {
      __attrs.reset(attrs);
    } else {
      __attrs.reset(null);
    }
  }
  if (__props.hasDirty('style')) {
    var __style = shell.__style;
    if (!__style) {
      __style = new Cache(shell);
      shell.__style = __style;
    }
    DirtyMarker.clean(__props, 'style');
    style = __props.get('style');
    if (typeof style === 'string') {
      style = toStyle(style);
    }
    if (typeof style === 'object') {
      __style.reset(style);
    } else {
      __style.reset(null);
    }
  }
  if (__props.hasDirty('classes')) {
    var __classes = shell.__classes;
    if (!__classes) {
      __classes = new Cache(shell);
      shell.__classes = __classes;
    }
    DirtyMarker.clean(__props, 'classes');
    classes = __props.get('classes');
    if (typeof classes !== 'object') {
      classes = toClasses(classes);
    }
    if (typeof classes === 'object') {
      __classes.reset(classes);
    } else {
      __classes.reset(null);
    }
  }
}

export default transferProps;