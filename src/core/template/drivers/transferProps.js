// src/core/template/drivers/transferProps.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import { TYPE_TEXT, WHITE_SPACES_REGEXP } from 'src/share/constants'

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

export default transferProps;