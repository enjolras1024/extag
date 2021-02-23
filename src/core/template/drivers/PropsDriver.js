// src/core/template/drivers/driveProps.js

import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import DirtyMarker from 'src/base/DirtyMarker'
import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import Cache from 'src/core/models/Cache'
import { TYPE_TEXT } from 'src/share/constants'
import { assign } from 'src/share/functions'


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

export function transProps(shell) {
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

export function patchProps(target, scopes, vnode, first) {
  var name, desc;
  var newProps = vnode.attrs;
  var oldProps = target._props;
  if (__ENV__ === 'development') {
    if (target instanceof Component) {
      Validator.validate0(target, newProps);
    }
  }
  if (!first && oldProps) {
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
  if (newProps) {
    for (name in newProps) {
      target.set(name, newProps[name]);
    }
  }
  
}

export function driveProps(target, scopes, vnode, first) {
  var name, expr, attrs, props;
  if (__ENV__ === 'development') {
    if (target instanceof Component) {
      Validator.validate0(target, assign({}, vnode.attrs, vnode.xattrs));
    }
  }
  if (vnode.scopes) {
    scopes = vnode.scopes;
  }
  if (target !== scopes[0]) {
    props = target;
  } else {
    if (!target.$props) {
      target.$props = new Cache(target);
    }
    props = target.$props;
  }
  attrs = vnode.attrs;
  if (attrs && first) {
    for (name in attrs) {
      props.set(name, attrs[name]);
    }
  }
  attrs = vnode.xattrs;
  if (attrs) {
    if (first) {
      for (name in attrs) {
        expr = attrs[name];
        if (expr instanceof Expression) {
          props.set(name, expr.evaluate(scopes));
          if (expr.pattern.mode === DataBinding.MODES.TWO_WAY) {
            addChangedHandler(scopes, target, name, expr.pattern.evaluator.path)
          }
        }
      }
    } else {
      for (name in attrs) {
        expr = attrs[name];
        if (expr instanceof Expression) {
          props.set(name, expr.evaluate(scopes));
        }
      }
    }
  }
}

function addChangedHandler(scopes, target, name, path) {
  target.on('changed', function(key) {
    if (key !== name) {
      return;
    }
    var _scopes = target.__extag_scopes__;
    if (!_scopes || scopes[0] === target) {
      _scopes = scopes;
    }
    var from = path.from;
    var n = path.length;
    var source;
    if (n === 2) {
      if (from >= 0) {
        source = _scopes[from];
      } else {
        source = _scopes[0].constructor.resources;
      }
      source.set(path[1], target[name]);
    } else if (n > 2) {
      if (from >= 0) {
        source = Path.search(path.slice(1, n - 1), _scopes[from], true);
      } else {
        source = Path.search(path.slice(1, n - 1), _scopes[0].constructor.resources, true);
      }
      source.set(path[n - 1], target[name]);
    }
  });
}

export default {
  drive: function drive(target, scopes, vnode, first) {
    if ('xflag' in vnode) {
      if (vnode.attrs || vnode.xattrs) {
        driveProps(target, scopes, vnode, first)
      }
    } else {
      if (vnode.attrs || vnode._props) {
        patchProps(target, null, vnode, first);
      }
    }
  }
}

