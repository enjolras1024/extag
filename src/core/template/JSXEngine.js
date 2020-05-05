// src/core/template/JSXEngine.js

import Accessor from 'src/base/Accessor'
import Text from 'src/core/shells/Text'
import Element from 'src/core/shells/Element'
import Component from 'src/core/shells/Component'
import Slot from 'src/core/shells/Slot'
// import HTMXEngine from 'src/core/node/HTMXEngine'
// import HTMXnode from 'src/core/node/HTMXnode'
import { EMPTY_OBJECT, EMPTY_ARRAY } from 'src/share/constants'
import { defineProp, flatten } from 'src/share/functions'
import config from 'src/share/config'
import logger from 'src/share/logger'

// function slot(name, children) {
//   return {
//     tag: 'x-slot',
//     type: Slot,
//     directs: {
//       name: name || ''
//     },
//     children: children
//   }
// }

/**
 * Check if the node matches the child element or child component.
 * @param {Shell} oldChild  - child element or component
 * @param {Object} newChild - node
 */
function matchesChild(oldChild, newChild) {
  return oldChild.xkey === newChild.xkey && 
          (newChild.type ? oldChild.constructor === newChild.type : 
            (oldChild.tag === newChild.tag && oldChild.ns === newChild.ns));
}

/**
 * Create a child from node.
 * @param {Object} node 
 * @param {Shell} target      - parent element or component
 * @param {Component} scope   - scope component
 */
function createChild(node, target, scope) {
  var child, ctor, ns;
  if (node == null) {
    child = new Text('');
    return child;
  } else if (node.type) {
    ctor = node.type;
    child = new ctor(
      node.props, 
      [scope]//, node
    );
  } else if (node.tag) {
    ns = node.ns || target.ns;
    child = new Element(
      ns ? ns + ':' + node.tag : node.tag, 
      node.props, 
      [scope]//, node
    );
  } else {
    child = new Text(node);
    return child;
  }

  if (node.name) {
    // console.log('x:name=' + node.name);
    // scope[node.xName] = child; // TODO: addNamedPart
    scope.addNamedPart(node.name, child);
    defineProp(child, '$owner', {
      configurable: true,
      enumarable: false,
      writable: false,
      value: scope
    });
  }

  if (node.xkey) {
    child.__key__ = node.xkey;
  }

  return child;
}

function updatePropsAndEvents(node, target, scope) {
  var name, desc;
  var newProps = node.props;
  var newEvents = node.events;
  var oldProps = target._props;
  var oldEvents = target._events;

  // update props
  if (oldProps) {
    // firstly, remove redundant properties, or reset default property values.
    if (target instanceof Component) {
      for (name in oldProps) {
        if (!newProps || !(name in newProps)) {
          desc = Accessor.getAttrDesc(name);
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
    // assign new property values.
    target.assign(newProps);
  }

  // update events
  if (oldEvents) {
    // firstly, remove old event handlers
    for (name in oldEvents) {
      if (oldEvents[name]) {
        target.off(name, oldEvents[name]);
      }
    }
  }
  if (newEvents) {
    // add new event handlers
    target.on(newEvents);
  }
  
  // if (target._vnode) {
  //   target._vnode = node;
  // } else {
  //   defineProp(target, '_vnode', {
  //     value: node, writable: true, enumerable: false, attrsurable: true
  //   });
  // }
}

// refer to Vue (https://vuejs.org/)
function updateChildrenOrContents(node, target, scope) { 
  var oldChildren, newChildren;

  if (target instanceof Component && target !== scope) {
    oldChildren = target._contents || EMPTY_ARRAY;
    newChildren = node.contents || EMPTY_ARRAY;
  } else if (!(target instanceof Slot)) {
    oldChildren = target._children || EMPTY_ARRAY;
    newChildren = node.children || EMPTY_ARRAY;
  } else {
    return;
  }

  var contents = new Array(newChildren.length), indices, key, i;

  var oldBeginIndex = 0, oldEndIndex = oldChildren.length - 1;
  var newBeginIndex = 0, newEndIndex = newChildren.length - 1;

  var oldBeginChild = oldChildren[oldBeginIndex];
  var oldEndChild = oldChildren[oldEndIndex];
  var newBeginChild = newChildren[newBeginIndex];
  var newEndChild = newChildren[newEndIndex];
  // console.log(oldBeginIndex, oldEndIndex, newBeginIndex, newEndIndex)
  while (oldBeginIndex <= oldEndIndex && newBeginIndex <= newEndIndex) {
    
    if (oldBeginChild == null) {
      oldBeginChild = oldChildren[++oldBeginIndex];
    } else if (oldEndChild == null) {
      oldEndChild = oldChildren[--oldEndIndex];
    } else if (matchesChild(oldBeginChild, newBeginChild)) {
      contents[newBeginIndex] = oldBeginChild; 
      updateShell(newBeginChild, oldBeginChild, scope);
      oldBeginChild = oldChildren[++oldBeginIndex];
      newBeginChild = newChildren[++newBeginIndex];
    } else if (matchesChild(oldEndChild, newEndChild)) {
      contents[newEndIndex] = oldEndChild;
      updateShell(newEndChild, oldEndChild, scope);
      oldEndChild = oldChildren[--oldEndIndex];
      newEndChild = newChildren[--newEndIndex];
    } else if (matchesChild(oldBeginChild, newEndChild)) {
      contents[newEndIndex] = oldBeginChild;
      updateShell(newEndChild, oldBeginChild, scope);
      oldBeginChild = oldChildren[++oldBeginIndex];
      newEndChild = newChildren[--newEndIndex];
    } else if (matchesChild(oldEndChild, newBeginChild)) {
      contents[newBeginIndex] = oldEndChild;
      updateShell(newBeginChild, oldEndChild, scope);
      oldEndChild = oldChildren[--oldEndIndex];
      newBeginChild = newChildren[++newBeginIndex];
    } else  {
      if (!indices) {
        indices = {};
        for (i = oldBeginIndex; i <= oldEndIndex; ++i) {
          key = oldChildren[oldBeginIndex].__key__;
          if (key) {
            indices[key] = i;
          }
        }
      }

      key = newBeginChild.xkey;
      i = key && indices[key];

      if (i != null && matchesChild(oldChildren[i] || EMPTY_OBJECT, newBeginChild)) {
        contents[newBeginIndex] = oldChildren[i];
      } else {
        // child = createChild(newBeginChild, scope);
        contents[newBeginIndex] = createChild(newBeginChild, target, scope);
      }

      updateShell(newBeginChild, contents[newBeginIndex], scope);

      newBeginChild = newChildren[++newBeginIndex];
    }
    // console.log(oldBeginIndex, oldEndIndex, newBeginIndex, newEndIndex)
  }

  if (oldBeginIndex > oldEndIndex) {
    while (newBeginIndex <= newEndIndex) {
      contents[newBeginIndex] = createChild(newBeginChild, target, scope);
      updateShell(newBeginChild, contents[newBeginIndex], scope);
      newBeginChild = newChildren[++newBeginIndex];
    }
  }
  
  if (target instanceof Component && target !== scope) {
    target.setContents(contents);
  } else {
    target.setChildren(contents);
  }
}

function updateShell(node, target, scope) {
  if (typeof node === 'object' && node.__extag_node__) {
    // updateSelf(node, target, scope);
    // updateProps(node.props, target, scope);
    // updateStyle(node.style, target, scope);
    // updateEvents(node.events, target, scope);
    updatePropsAndEvents(node, target, scope);
    updateChildrenOrContents(node, target, scope);
  } else /*if (target instanceof Text)*/ {
    target.set('data', node);
  }
}

// function reflow(nodes, target, scope) {
//   if (target instanceof Component && target !== scope) {
//     updateChildrenOrContents({contents: nodes}, target, scope);
//   } else {
//     updateChildrenOrContents({children: nodes}, target, scope);
//   }
// }

function reflow(scope, target, nodes) {
  if (arguments.length === 2) {
    nodes = target;
    target = scope;
  } 
  // console.log(nodes)
  if (target instanceof Component && target !== scope) {
    updateChildrenOrContents({contents: flatten(nodes)}, target, scope);
  } else {
    updateChildrenOrContents({children: flatten(nodes)}, target, scope);
  }
}

var JSXEngine = {
  // node: node,
  // slot: slot,
  reflow: reflow
};

config.JSXEngine = JSXEngine;

export default JSXEngine