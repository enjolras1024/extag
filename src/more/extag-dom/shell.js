import { 
  assign
 } from 'src/share/functions'

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
  getNameSpace
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

function mergeProps(outerProps, innerProps) {
  if (!innerProps) {
    return outerProps;
  }
  if (!outerProps) {
    return innerProps;
  }
  var key, props = {};
  assign(props, outerProps);
  for (key in innerProps) {
    if (key === 'class') {
      props[key] = mergeClasses(outerProps[key], innerProps[key]);
    } else if (!(key in outerProps)) {
      props[key] = innerProps[key];
    }
  }
  return props;
}

function mergeDirty(outerDirty, innerDirty) {
  if (!innerDirty) {
    return outerDirty;
  }
  if (!outerDirty) {
    return innerDirty;
  }

  var key, dirty = {};
  assign(dirty, outerDirty);
  for (key in innerDirty) {
    if (!(key in outerDirty)) {
      dirty[key] = innerDirty[key];
    }
  }
  return dirty;
  // if (innerDirty) {
  //   return assign({}, innerDirty, outerDirty);
  // }
  // return outerDirty;
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
    var props, dirty;

    props = shell._props;
    dirty = shell._dirty;
    if (shell.$props) {
      props = mergeProps(props, shell.$props._props);
      dirty = mergeDirty(dirty, shell.$props._dirty);
    }
    if (props && dirty) {
      renderProps($skin, props, dirty);
    }
    
    var shadowMode = props.shadowMode;
    var children = shell._children;
    var style = shell._style;
    
    props = style && style._props;
    dirty = style && style._dirty;
    if (shell.$style) {
      props = mergeProps(props, shell.$style._props);
      dirty = mergeDirty(dirty, shell.$style._dirty);
    }
    if (props && dirty) {
      renderStyle($skin, props, dirty);
    }      
    
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