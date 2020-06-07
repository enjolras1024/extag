import { 
  TYPE_TEXT,
  TYPE_FRAG
} from 'src/share/constants'

import {
  namespaceURIs
} from './config'

import {
  getShell,
  getTagName,
  getNameSpace
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
      if (oldChild && shell !== oldChild.getParent()) {
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
        if (!$oldChild || 
            meta.tag !== getTagName($oldChild) || 
            meta.ns !== getNameSpace($oldChild) || 
            (oldChild && oldChild !== newChild)) {
          $newChild = createChild(meta.type, meta.tag, meta.ns);
        } else {
          $newChild = $oldChild;
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