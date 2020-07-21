import { 
  TYPE_TEXT,
  TYPE_FRAG,
  EMPTY_ARRAY
} from 'src/share/constants'

import {
  namespaceURIs,
  DOM_PROPERTY_DESCRIPTORS
} from './config'

import {
  getShell,
  getTagName,
  getNameSpace,
  toClassList
} from './utils'

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
  var $children = $skin.childNodes;

  n = children.length;
  m = $children.length;

  if (m) {
    for (i = m - 1; i >= 0; --i) {
      $oldChild = $children[i];
      oldChild = getShell($oldChild);
      if (oldChild && shell !== oldChild.getParent(true)) {
        $skin.removeChild($oldChild);
        // $removed.push($oldChild);
      }
    }
    // for (i = $removed.length - 1; i >= 0;  --i) {
    //   $parent = getParent($removed[i]);
    //   oldChild = getShell($removed[i]);
    //   if (!$parent && oldChild) { 
    //     oldChild.detach();
    //   }
    // }
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
        // if (!$oldChild || 
        //     meta.tag !== getTagName($oldChild) || 
        //     meta.ns !== getNameSpace($oldChild) || 
        //     (oldChild && oldChild !== newChild)) {
        //   $newChild = createChild(meta.type, meta.tag, meta.ns);
        // } else {
        //   $newChild = $oldChild;
        // }

        if ($oldChild && !oldChild && 
            canHydrate($oldChild && newChild)) {
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
          $skin.insertBefore($oldChild, $children[oldChild.__extag_index__] || null)
        } else {
          $skin.removeChild($oldChild);
        }
      }
    }
  }
}

export {
  renderChildren
}