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
import { renderAttrs } from "./attrs";
import { renderStyle } from "./style";
import { renderClasses } from "./classes";
import { renderChildren } from "./children";

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
    if (shell.__props) {
      props = mergeProps(props, shell.__props._props);
      dirty = mergeDirty(dirty, shell.__props._dirty);
    }
    if (props && dirty) {
      renderProps($skin, props, dirty);
    }

    var shadowMode = props.shadowMode;

    // var attrs = shell._attrs;
    var style = shell._style;
    var classes = shell._classes;
    var children = shell._children;

    // if (attrs) {
    //   props = attrs._props;
    //   dirty = attrs._dirty;
    // } else {
    //   props = null;
    //   dirty = null;
    // }
    // if (shell.__attrs) {
    //   props = mergeProps(props, shell.__attrs && shell.__attrs._props);
    //   dirty = mergeDirty(dirty, shell.__attrs && shell.__attrs._dirty);
    // }
    // if (props && dirty) {
    //   renderAttrs($skin, props, dirty);
    // }
    
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
      renderStyle($skin, props, dirty);
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
      renderClasses($skin, props, dirty);
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