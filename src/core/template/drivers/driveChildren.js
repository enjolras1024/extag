// src/core/template/drivers/driveChildren.js

import { 
  TYPE_TEXT, 
  EXTAG_VNODE,
  EMPTY_ARRAY,
  EMPTY_OBJECT
} from 'src/share/constants'
import { isVNode } from 'src/share/functions'
import Text from 'src/core/shells/Text'
import Block from 'src/core/shells/Block'
import Element from 'src/core/shells/Element'
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
    driveProps(target, scopes, vnode.props);
    driveEvents(target, scopes, vnode.events);
    driveChildren(target, scopes, vnode.children, vnode.useExpr, target instanceof Component);
    // if (target instanceof Component && target !== scopes[0]) {
    // } else {

    // }
  } else /*if (target instanceof Text)*/ {
    target.set('content', vnode);
  }
}

// export function createContent(vnode, scopes) {
//   if (!isVNode(vnode)) {
//     return new Text(vnode);
//   }  

//   var ctor, expr, content;
//   var useExpr = vnode.useExpr;

//   if (vnode.xif || vnode.xfor || vnode.xtype) {
//     content = new Block(vnode, scopes);
//   } else if (useExpr && vnode.type === Expression) {
//     expr = vnode.expr;
//     if (expr.pattern.target === 'frag') {
//       content = new Fragment(null, scopes);
//       expr.connect('accept', content, scopes);
//     } else {
//       content = new Text('');
//       expr.connect('content', content, scopes);
//     }
//   } else if (vnode.tag !== '!') {
//     ctor = vnode.type;
//     if (ctor) {
//       // content = new ctor(null, scopes, vnode);
//       content = new ctor(vnode, scopes);
//     } else {
//       // content = new Element(vnode.ns ? vnode.ns + ':' + vnode.tag : vnode.tag);

//       // if (vnode.events) {
//       //   driveEvents(content, scopes, vnode.events, useExpr);
//       // }

//       // if (vnode.props) {
//       //   driveProps(content, scopes, vnode.props, useExpr)
//       // }
//       // if (vnode.style) {
//       //   driveProps(content.style, scopes, vnode.style, useExpr);
//       // }
//       // if (vnode.classes) {
//       //   ClassBinding.create(vnode.classes).connect('class', content, scopes);
//       // }
//       // if (vnode.children) {
//       //   driveChildren(content, scopes, vnode.children, useExpr);
//       // }
//       content = new Element(vnode, scopes);
//     }

//     if (content && vnode.name) {
//       content.$owner = scopes[0];
//       scopes[0].addNamedPart(vnode.name, content); // TODO: removeNamedPart
//     }
//   }

//   return content;
// }

function createContents(children, scopes) {
  var i, n, child, content, contents = [];
  if (children && children.length) { 
    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];
      content = createContent(child, scopes, true);
      if (content) {
        contents.push(content);
      }
    }
  }
  return contents;
}

function collectContents(children, scopes, target) {
  var oldShells, newVNodes;

  // if (target instanceof Component && target !== scopes[0]) {
  //   oldShells = target._contents || EMPTY_ARRAY;
  //   newVNodes = children || EMPTY_ARRAY;
  // } else if (!(target instanceof Slot)) {
    oldShells = target._children || EMPTY_ARRAY;
    newVNodes = children || EMPTY_ARRAY;
  // } else {
  //   return;
  // }

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

function flattenVNodes(children, array, ns) {
  var i, n = children.length, child;
  if (!array) {
    for (i = 0; i < n; ++i) {
      if (Array.isArray(children[i])) {
        array = [];
        break;
      }
    }
  }
  if (array) {
    for (i = 0; i < n; ++i) {
      child = children[i];
      if (Array.isArray(child)) {
        flattenVNodes(child, array, ns);
      } else {
        array.push(child);
        if (ns && isVNode(child) && !child.ns) {
          child.ns = ns;
        }
      }
    }
  } else {
    for (i = 0; i < n; ++i) {
      child = children[i];
      if (ns && isVNode(child) && !child.ns) {
        child.ns = ns;
      }
    }
  }
  return array ? array : children;
}

function driveChildren(target, scopes, children, useExpr, areContents) {
  var contents;
  if (!children) {
    children = EMPTY_ARRAY;
  }
  if (areContents) {
    target.accept(children, scopes);
  } else {
    if (useExpr) {
      if (children.length === 1) {
        var expr = children[0];
        if (expr instanceof Expression && expr.pattern.target === 'frag') {
          if (target instanceof Component) {
            expr.connect(function(children, scopes) {
              driveChildren(this, scopes, children, false);
            }, target, scopes);
          } else {
            expr.connect('accept', target, scopes);
          }
          return;
        }
      }
      contents = createContents(children, scopes);
    } else {
      contents = collectContents(children, scopes, target);
    }
    target.setChildren(contents);
  }
}

export default driveChildren;