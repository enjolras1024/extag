// src/core/template/drivers/transferProps.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import { TYPE_TEXT } from 'src/share/constants'

function toStyleObject(source) {
  var type = typeof source;
  if (type === 'object') {
    return source;
  }
  if (type === 'string') {
    var style = {};
    var pieces = source.split(';');
    var piece, index, i, name, value;
    for (i = 0; i < pieces.length; ++i) {
      piece = pieces[i];
      index = piece.indexOf(':');
      if (index > 0) {
        name = piece.slice(0, index).trim();
        value = piece.slice(index + 1).trim();
        if (name) {
          style[name] = value;
        }
      }
    }
    return style;
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

  var style;

  if (shell.hasDirty('style')) {
    DirtyMarker.clean(shell, 'style');
    style = toStyleObject(shell.get('style'));
    shell.style.reset(style);
  }

  if (!shell.$props || !shell.constructor.__extag_component_class__) { 
      return; 
  }

  var $props = shell.$props;

  if ($props.hasDirty('style')) {
    var $style = getOrCreateCache(shell, '$style');
    DirtyMarker.clean($props, 'style');
    style = $props.get('style');
    style = toStyleObject(style);
    $style.reset(style);
  }
}

export default transferProps;