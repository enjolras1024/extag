import { 
  EMPTY_ARRAY,
  TYPE_TEXT,
  TYPE_ELEM,
  FLAG_CHANGED_CHILDREN,
  FLAG_CHANGED_COMMANDS
} from 'src/share/constants'

import { 
  getShell,
  setShell,
  getTagName,
  getNameSpace,
  toCamelCase
} from './utils'

import { renderProps } from "./props";
import { renderStyle } from "./style";
import { toClassName } from "./classes";
import { renderChildren } from "./children";

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
      invokeCommands($skin, shell._commands)
    }
  }
}

export {
  attachShell,
  detachShell,
  renderShell
}