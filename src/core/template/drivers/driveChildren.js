// src/core/template/drivers/driveChildren.js

import { 
  TYPE_TEXT, 
  EXTAG_VNODE,
  EMPTY_ARRAY,
  EMPTY_OBJECT
} from 'src/share/constants'
import { isVNode } from 'src/share/functions'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'
import createContent from "./createContent";
import driveEvents from "./driveEvents";
import driveProps from './driveProps'

/**
 * Check if the node matches the child text, element or component.
 * @param {Shell} child  - text, element or component
 * @param {string | Object} vnode - vnode
 */
function matchChild(child, vnode) {
  var meta = child.$meta;
  if (meta.type === TYPE_TEXT && vnode.__extag_node__ !== EXTAG_VNODE) {
    return true;
  }
  return child.__extag_key__ === vnode.xkey && 
          (vnode.type ? child.constructor === vnode.type : 
            (meta.tag === vnode.tag && meta.ns === vnode.ns));
}

function driveChild(target, vnode, scopes) {
  if (isVNode(vnode)) {
    driveProps(target, scopes, vnode.attrs);
    driveEvents(target, scopes, vnode.events);
    driveChildren(target, scopes, vnode.contents, vnode.useExpr, target instanceof Component);
  } else /*if (target instanceof Text)*/ {
    target.set('content', vnode);
  }
}

function createContents(vnodes, scopes) {
  var i, n, content, contents = [];
  if (vnodes && vnodes.length) { 
    for (i = 0, n = vnodes.length; i < n; ++i) {
      content = createContent(vnodes[i], scopes, true);
      if (content) {
        contents.push(content);
      }
    }
  }
  return contents;
}

function collectContents(vnodes, scopes, target) {
  var oldShells = target._children || EMPTY_ARRAY;
  var newVNodes = vnodes || EMPTY_ARRAY;


  if (newVNodes.length) {
    newVNodes = flattenVNodes(newVNodes, null, target.$meta.ns);
  }

  var contents = new Array(newVNodes.length);
  var content, indices, key, i;

  var oldBeginIndex = 0, oldEndIndex = oldShells.length - 1;
  var newBeginIndex = 0, newEndIndex = newVNodes.length - 1;

  var oldBeginShell = oldShells[oldBeginIndex];
  var oldEndShell = oldShells[oldEndIndex];
  var newBeginVNode = newVNodes[newBeginIndex];
  var newEndVNode = newVNodes[newEndIndex];

  // refer to Vue (https://vuejs.org/)
  while (oldBeginIndex <= oldEndIndex && newBeginIndex <= newEndIndex) {
    if (oldBeginShell == null) {
      oldBeginShell = oldShells[++oldBeginIndex];
    } else if (oldEndShell == null) {
      oldEndShell = oldShells[--oldEndIndex];
    } else if (matchChild(oldBeginShell, newBeginVNode)) {
      contents[newBeginIndex] = oldBeginShell; 
      driveChild(oldBeginShell, newBeginVNode, scopes);
      oldBeginShell = oldShells[++oldBeginIndex];
      newBeginVNode = newVNodes[++newBeginIndex];
    } else if (matchChild(oldEndShell, newEndVNode)) {
      contents[newEndIndex] = oldEndShell;
      driveChild(oldEndShell, newEndVNode, scopes);
      oldEndShell = oldShells[--oldEndIndex];
      newEndVNode = newVNodes[--newEndIndex];
    } else if (matchChild(oldBeginShell, newEndVNode)) {
      contents[newEndIndex] = oldBeginShell;
      driveChild(oldBeginShell, newEndVNode, scopes);
      oldBeginShell = oldShells[++oldBeginIndex];
      newEndVNode = newVNodes[--newEndIndex];
    } else if (matchChild(oldEndShell, newBeginVNode)) {
      contents[newBeginIndex] = oldEndShell;
      driveChild(oldEndShell, newBeginVNode, scopes);
      oldEndShell = oldShells[--oldEndIndex];
      newBeginVNode = newVNodes[++newBeginIndex];
    } else  {
      if (!indices) {
        indices = {};
        for (i = oldBeginIndex; i <= oldEndIndex; ++i) {
          key = oldShells[i].__extag_key__;
          if (key) {
            indices[key] = i;
          }
        }
      }

      key = newBeginVNode.xkey;
      i = key && indices[key];

      if (i != null && matchChild(oldShells[i] || EMPTY_OBJECT, newBeginVNode)) {
        contents[newBeginIndex] = oldShells[i];
      } else {
        content = createContent(newBeginVNode, scopes, false);
        content.__extag_key__ = key;
        contents[newBeginIndex] = content;
      }

      // driveChild(contents[newBeginIndex], newBeginVNode, scopes);

      newBeginVNode = newVNodes[++newBeginIndex];
    }
  }

  if (oldBeginIndex > oldEndIndex) {
    while (newBeginIndex <= newEndIndex) {
      content = createContent(newBeginVNode, scopes, false);
      content.__extag_key__ = newBeginVNode.xkey;
      contents[newBeginIndex] = content;
      newBeginVNode = newVNodes[++newBeginIndex];
    }
  }

  return contents;
}

function flattenVNodes(vnodes, array, ns) {
  var i, n = vnodes.length, vnode;
  if (!array) {
    for (i = 0; i < n; ++i) {
      if (Array.isArray(vnodes[i])) {
        array = [];
        break;
      }
    }
  }
  if (array) {
    for (i = 0; i < n; ++i) {
      vnode = vnodes[i];
      if (Array.isArray(vnode)) {
        flattenVNodes(vnode, array, ns);
      } else {
        array.push(vnode);
        if (ns && isVNode(vnode) && !vnode.ns) {
          vnode.ns = ns;
        }
      }
    }
  } else {
    for (i = 0; i < n; ++i) {
      vnode = vnodes[i];
      if (ns && isVNode(vnode) && !vnode.ns) {
        vnode.ns = ns;
      }
    }
  }
  return array ? array : vnodes;
}

function driveChildren(target, scopes, vnodes, useExpr, forComponent) {
  var contents;
  if (!vnodes) {
    vnodes = EMPTY_ARRAY;
  }
  if (forComponent) {
    target.accept(vnodes, scopes);
  } else {
    if (useExpr) {
      if (vnodes.length === 1 && isVNode(vnodes[0]) && (vnodes[0].type === Expression)) {
        var expr = vnodes[0].expr;
        if (expr instanceof Expression && expr.pattern.target === 'frag') {
          if (target instanceof Component) {
            expr.connect(function(vnodes, scopes) {
              // this is target, and this is scopes[0]
              // driveChildren(this, scopes, vnodes, false);
              Fragment.prototype.accept.call(this, vnodes, scopes);
            }, target, scopes);
          } else {
            expr.connect('accept', target, scopes);
          }
          return;
        }
      }
      contents = createContents(vnodes, scopes);
    } else {
      contents = collectContents(vnodes, scopes, target);
    }
    target.setChildren(contents);
  }
}

export default driveChildren;