// src/core/template/drivers/ChildrenDriver.js

import { 
  TYPE_TEXT, 
  EXTAG_VNODE,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  FLAG_X_CONTENTS
} from 'src/share/constants'
import { 
  assign, 
  isVNode, 
  throwError 
} from 'src/share/functions'
import Expression from 'src/core/template/Expression'
// import createContent from "./createContent";
import Text from 'src/core/shells/Text'
// import Block from 'src/core/shells/Block'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
import EventsDriver from './EventsDriver'
import PropsDriver from './PropsDriver'

function createContent(vnode, scopes) {
  if (!isVNode(vnode)) {
    return new Text(vnode);
  }  

  var ctor, expr, content;
  
  if (vnode.type === Expression) {
    expr = vnode.expr;
    if (expr.pattern.target === 'frag') {
      content = new Fragment(null, scopes);
      // expr.connect('accept', content, scopes);
    } else {
      content = new Text('');
      // expr.connect('content', content, scopes);
    }
  } else {
    ctor = vnode.type;
    if (ctor) {
      content = new ctor(vnode, scopes);
    } else {
      content = new Element(vnode, scopes);
    }
    if (vnode.name) {
      scopes[0].addNamedPart(vnode.name, content); // TODO: removeNamedPart
    }
  }

  content.__extag_key__ = vnode.key;

  return content;
}

function flattenVNodes(vnodes, array, ns) {
  var i, n = vnodes.length, vnode;
  if (!array) {
    for (i = 0; i < n; ++i) {
      vnode = vnodes[i];
      if (vnode == null || Array.isArray(vnode)) {
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
      } else if (vnode != null) {
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
  return child.__extag_key__ === vnode.key && 
          (vnode.type ? child.constructor === vnode.type : 
            (meta.tag === vnode.tag && meta.ns === vnode.ns));
}

function driveChild(target, vnode, scopes) {
  if (isVNode(vnode)) {
    if (vnode.scopes) {
      scopes = vnode.scopes;
    }
    if (scopes.length > 1) {
      target.__extag_scopes__ = scopes;
    }
    PropsDriver.drive(target, scopes, vnode);
    EventsDriver.drive(target, scopes, vnode);
    driveChildren(target, scopes, vnode, false, target instanceof Component);
  } else /*if (target instanceof Text)*/ {
    target.set('content', vnode);
  }
}

function createContents(vnodes, scopes) {
  var i, n, content, contents = [];
  if (vnodes && vnodes.length) { 
    for (i = 0, n = vnodes.length; i < n; ++i) {
      content = createContent(vnodes[i], scopes);
      if (content) {
        content.__extag_scopes__ = scopes;
        contents.push(content);
      }
    }
  }
  return contents;
}

function collectContents(vnodes, scopes, target) {
  var oldShells = target._children || EMPTY_ARRAY;
  var newVNodes = vnodes || EMPTY_ARRAY;

  // if (newVNodes.length) {
  //   newVNodes = flattenVNodes(newVNodes, null, target.$meta.ns);
  // }

  var contents = new Array(newVNodes.length);
  var content, indices, key, i;

  var oldBeginIndex = 0, oldEndIndex = oldShells.length - 1;
  var newBeginIndex = 0, newEndIndex = newVNodes.length - 1;

  var oldBeginShell = oldShells[oldBeginIndex];
  var oldEndShell = oldShells[oldEndIndex];
  var newBeginVNode = newVNodes[newBeginIndex];
  var newEndVNode = newVNodes[newEndIndex];

  if (oldShells.length) {
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
            if (key != null) {
              if (key in indices) {
                throwError('duplicated key: ' + key);
              }
              indices[key] = i;
            }
          }
        }

        key = newBeginVNode.key;
        i = key && indices[key];

        if (i != null && matchChild(oldShells[i] || EMPTY_OBJECT, newBeginVNode)) {
          content = oldShells[i];
          content.__extag_scopes__ = scopes;
          contents[newBeginIndex] = content;
        } else {
          content = createContent(newBeginVNode, scopes, false);
          // content.__extag_key__ = key;
          content.__extag_scopes__ = scopes;
          contents[newBeginIndex] = content;
        }

        // driveChild(contents[newBeginIndex], newBeginVNode, scopes);

        newBeginVNode = newVNodes[++newBeginIndex];
      }
    }
  }
  

  if (oldBeginIndex > oldEndIndex) {
    while (newBeginIndex <= newEndIndex) {
      content = createContent(newBeginVNode, scopes, false);
      // content.__extag_key__ = newBeginVNode.key;
      contents[newBeginIndex] = content;
      newBeginVNode = newVNodes[++newBeginIndex];
    }
  }

  return contents;
}

function createVNodes(source, type, scopes) {
  var vnodes = [];
  var xkey = source.xkey;
  var xfor = source.xfor;
  var names = xfor[0];
  var items = xfor[1].evaluate(scopes);
  for (var i = 0; i < items.length; ++i) {
    var data = {};
    data[names[0]] = items[i];
    if (names.length > 1) {
      data[names[1]] = i;
    }
    var newScopes = scopes.concat([data]);
    var key = xkey ? xkey.evaluate(newScopes) : null;
    var vnode = createVNode(source, type, key);
    vnode.scopes = newScopes;
    vnodes.push(vnode);
  }
  return vnodes;
}

function createVNode(source, type, key) {
  var vnode = assign({}, source);
  delete vnode.xif;
  delete vnode.xfor;
  delete vnode.xtype;
  if (type) {
    vnode.type = type;
  }
  if (key) {
    vnode.key = key;
  }
  return vnode;
}

function spreadContents(vnodes, scopes) {
  var contents = [];
  for (var i = 0; i < vnodes.length; ++i) {
    var vnode = vnodes[i];
    if (isVNode(vnode)) {
      if (vnode.xif || vnode.xfor || vnode.xtype) {
        var type = null;
        if (vnode.xtype) {
          type = vnode.xtype.evaluate(scopes);
          if (!type) {
            continue;
          }
        }
        if (vnode.xif) {
          if (!vnode.xif.evaluate(scopes)) {
            continue;
          }
        }
        if (vnode.xfor) {
          contents.push.apply(contents, createVNodes(vnode, type, scopes));
        } else {
          contents.push(createVNodes(vnode, type));
        }
        continue;
      } 
    } else if (vnode instanceof Expression) {
      contents.push(vnode.evaluate(scopes));
      continue;
    }
    contents.push(vnode);
  }
  return contents;
}

function driveChildren(target, scopes, vnode, first) {
  var forChildComponent = (
    (target instanceof Component) && 
    (!scopes || target !== scopes[0])
  );
  var children, vnodes = vnode.contents || EMPTY_ARRAY;
  if ('xflag' in vnode) {
    if (vnode.xflag & FLAG_X_CONTENTS) {
      vnodes = spreadContents(vnodes, scopes);
    } else if (!first && !forChildComponent) {
      children = target._children || EMPTY_ARRAY;
      // if (children.length !== vnodes.length) {
      //   console.log(children)
      //   console.log(vnode)
      // }
      if (vnodes.length) {
        vnodes = flattenVNodes(vnodes, null, target.$meta.ns);
      } else if (!children.length) {
        return;
      }
      
      for (var i = 0; i < children.length; ++i) {
        // ContentDriver.drive(children[i], scopes, vnodes[i], false);
        // EventsDriver.drive(children[i], scopes, vnodes[i], first);
        // PropsDriver.drive(children[i], scopes, vnodes[i], first)
        // driveChildren(children[i], scopes, vnodes[i], first, children[i] instanceof Component);
        driveChild(children[i], vnodes[i], scopes);
      }
      return;
    }
  }
  if (vnodes.length) {
    vnodes = flattenVNodes(vnodes, null, target.$meta.ns);
  }
  if (forChildComponent) {
    target.accept(vnodes); // set('contents'
  } else {
    // children = collectContents(contents, scopes, target);
    if (first) {
      children = createContents(vnodes, scopes);
    } else {
      children = collectContents(vnodes, scopes, target);
    }
    target.setChildren(children);
  }
}

export default {
  drive: driveChildren
}