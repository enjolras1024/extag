// src/core/template/JSXEngine.js

import Accessor from 'src/base/Accessor'
import Text from 'src/core/shells/Text'
import Element from 'src/core/shells/Element'
import Component from 'src/core/shells/Component'
import Slot from 'src/core/shells/Slot'
// import HTMXEngine from 'src/core/node/HTMXEngine'
// import HTMXnode from 'src/core/node/HTMXnode'
import { EMPTY_OBJECT, EMPTY_ARRAY } from 'src/share/constants'
import { defineProp } from 'src/share/functions'
import config from 'src/share/config'
import logger from 'src/share/logger'

var RESERVED_PARAMS = {
  ns: null,
  // tag: null,
  xkey: null,
  xname: null,
  //type: null,
  props: null,
  // attrs: null,
  // style: null,
  // 'class': null,
  // classes: null,
  // className: null,
  
  events: null,
  // directs: null,
  children: null,
  contents: null
};

/**
 * e.g. node('div', null, [
 *        node('h1', null, 'title'),
 *        node('ul', null,
 *          node('a', {
 *              'href@': 'link.url',
 *              classes: {link: true, 'active@': 'link.active'},
 *              directs: {'for': 'link of $.links', key: 'link.url'}
 *            },
 *            ['tip: @{ link.tip }']
 *          )
 *        ),
 *        node(Button, { label: 'OK', 'click+': '$.onClick' })
 *      ])
 *
 * @param {string|Function} tagOrType
 * @param {Object} params
 * @param {string|Array|Object} children
 * @returns {Object}
 */
function node(type, params, children) {
  var node = {
    __extag__node__: true
  };

  var t = typeof type;
  if (t === 'string') {
    var i = type.indexOf(':');
    if (i < 0) {
      node.ns = '';
      node.tag = type;
    } else {
      node.ns = type.slice(0, i);
      node.tag = type.slice(i + 1);
    }
  } else if (t === 'function') {
    node.type = type;
  } else {
    throw new TypeError('First argument must be string or constructor');
  }

  if (arguments.length === 2 && (Array.isArray(params) || typeof params !== 'object')) {
    children = params;
    params = null;
  }

  if (params) {
    if (params.xkey) {
      node.key = param.xkey;
    }
    if (params.xname) {
      node.name = params.xname;
    }
    // if (params.style) {
    //   node.style = params.style;
    // }
    // if (params.xattrs) {
    //   node.attrs = params.xattrs;
    // }
    // if (params.xclass) { // TODO: className
    //   node.classes = params.xclass;
    // }
    if (params.events) {
      node.events = params.events;
    }

    // node.directs = params.directs;

    var props = node.props = {};

    for (var key in params) {
      if (params.hasOwnProperty(key) && !RESERVED_PARAMS.hasOwnProperty(key)) {
        props[key] = params[key];
      }
    }
  }

  if (children) {
    if (Array.isArray(children)) {
      children = flatten(children);
    } else {
      children = [children];
    }
    if (node.type) {
      node.contents = children;
    } else {
      node.children = children;
    }
  }

  return node;
}

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

function flatten(list, array) {
  var i, n = list.length;
  if (!array) {
    for (i = 0; i < n; ++i) {
      if (Array.isArray(list[i])) {
        array = [];
        break;
      }
    }
  }
  if (array) {
    for (i = 0; i < n; ++i) {
      var item = list[i];
      if (Array.isArray(item)) {
        flatten(item, array);
      } else {
        array.push(item);
      }
    }
  }
  return array ? array : list;
}

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
      value: scope
    });
  }

  if (node.xkey) {
    child.__key__ = node.xkey;
  }

  return child;
}

/**
 * Update target's properties, including removing unuseful properties.
 * Update $props for component, _props for element.
 * 
 * @param {Object} props    - new props
 * @param {Shell} target    - child element or component
 * @param {Component} scope - scope component     
 */
// function updateProps(props, target, scope) {
//   var _props, $props, desc, key;

//   if (target instanceof Component) {
//     if (props) {
//       for (key in props) {
//         desc = Accessor.getAttrDesc(key);
//         if (desc) {
//           target.set(key, props[key]);
//         }
//       }
//     } else {
//       props = EMPTY_OBJECT;
//     }

//     $props = target.$props;
//     if ($props) {
//       for (key in $props) {
//         if (!(key in props)) {
//           desc = Accessor.getAttrDesc(key);
//           if (desc) {
//             target.set(key, Accessor.getAttributeDefaultValue(desc));
//           }
//         }
//       }
//     }
//   } else {
//     if (props) {
//       target.assign(props);
//     } else {
//       props = EMPTY_OBJECT;
//     }

//     _props = target._props;
//     if (_props) {
//       for (key in _props) {
//         if (!(key in props)) {
//           target.set(key, null);
//         }
//       }
//     }
    
//   } 
// }

function updateProps(props, target, scope) {
  var _props, $props, desc, key;

  if (target instanceof Component) {
    if (props) {
      for (key in props) {
        desc = Accessor.getAttrDesc(key);
        if (desc) {
          target.set(key, props[key]);
        }
      }
    } else {
      props = EMPTY_OBJECT;
    }
    $props = target.$props;   
    if ($props) {
      for (key in $props) {
        if (!(key in props)) {
          desc = Accessor.getAttrDesc(key);
          target.set(key, Accessor.getAttributeDefaultValue(desc));
        }
      }
    }
  } else {
    if (props) {
      target.assign(props);
    } else {
      props = EMPTY_OBJECT;
    }
    _props = target._props;
    if (_props) {
      for (key in _props) {
        if (!(key in props)) {
          target.set(key, null);
        }
      }
    }
  }
}

function updateStyle(style, target, scope) {
  target.set('style', style);
}

function updatePropsAndEvents(node, target, scope) {
  var name;
  var newProps = node.props;
  var newEvents = newProps && newProps.events;
  var oldProps = target._vnode && target._vnode.props;
  var oldEvents = target._vnode && target._vnode.events;
  
  if (oldEvents) {
    for (name in oldEvents) {
      if (!newEvents || !(name in newEvents)) {
        target.off(name, oldEvents[name]);
      }
    }
  }

  if (newEvents) {
    target.on(newEvents);
  }
  
  if (oldProps) {
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
    target.assign(newProps);
  }
  
  if (target._vnode) {
    target._vnode = node;
  } else {
    defineProp(target, '_vnode', {
      value: node, writable: true, enumerable: false, configurable: true
    });
  }
}

function updateEvents(events, target, scope) {
  var _events;
  // if (target instanceof Component) {
  //   _events = target._events;
  //   target._events = events;
  // } else {
  //   _events = target._actions;
  // }
  _events = target._events;
  events = events || EMPTY_OBJECT;
  

  // if (events) {
  //   // target.on(events);
  // } else {
  //   events = EMPTY_OBJECT;
  // }

  if (_events) {
    for (var name in _events) {
      if (!(name in events)) {
        target.off(name, _events[name]);
      }
    }
  }

  target.on(events);

  target._events = events;
}

function updateChildrenOrContents(node, target, scope) { // refer to Vue (http://vuejs.org/)
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
  if (typeof node === 'object' && node.__extag__node__) {
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
  node: node,
  // slot: slot,
  reflow: reflow
};

config.JSXEngine = JSXEngine;

export default JSXEngine