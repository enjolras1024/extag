// src/core/template/HTMXEngine.js

import Text from 'src/core/shells/Text'
import Block from 'src/core/shells/Block'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
// import IfBlock from 'src/core/blocks/IfBlock'
// import ForBlock from 'src/core/blocks/ForBlock'
// import SlotBlock from 'src/core/blocks/SlotBlock'
// import TypeBlock from 'src/core/blocks/TypeBlock'
import Expression from 'src/base/Expression'


import { defineProp } from 'src/share/functions'
import config from 'src/share/config'
// import Block from './dynamic/Block';
// import Slot from './dynamic/Slot';
// import View from './dynamic/View';

function initProps(props, scopes, target) {
  if (props) {
    var key, value;
    for (key in props) {
      value = props[key];
      if (typeof value === 'object' && value instanceof Expression) {
        value.compile(key, target, scopes);
      } else {
        target.set(key, value);
      }
    }
  }
}

function initAttrs(attrs, scopes, target) {
  if (attrs) {
    initProps(attrs, scopes, target.attrs);
  }
}

function initStyle(style, scopes, target) {
  if (style) {
    initProps(style, scopes, target.style);
  }
}

function initClasses(classes, scopes, target) {
  if (classes) {
    initProps(classes, scopes, target.classes);
  }
}

function initActions(actions, scopes, target) {
  if (actions) {
    var type, value;
    for (type in actions) {
      value = actions[type];
      if (typeof value === 'object' && value instanceof Expression) {
        value.compile(type, target, scopes);
      } else if (typeof value === 'function') {
        target.on(type, value);
      }
    }
  }
}

// function initCache(props, member, scopes) {
//   var key, value;
//   for (key in props) {
//     value = props[key];
//     if (typeof value === 'object' && value instanceof Expression) {
//       value.compile(key, member, scopes);
//     } else {
//       member.set(key, value);
//     }
//   }
// }

// function initShell(target, props, scopes, node) {
//   if (props && node.props) {
//     props = assign({}, node.props, props);
//   }
//   // initProps(node.props, target, scopes);
//   initProps(props, target, scopes);
//   initAttrs(node.attrs, target, scopes);
//   initStyle(node.style, target, scopes);
//   initClasses(node.classes, target, scopes);
//   initActions(node.actions, target, scopes);
// }

// function initProps() {}

function initOthers(node, scopes, target) {
  initAttrs(node.attrs, scopes, target);
  initStyle(node.style, scopes, target);
  initClasses(node.classes, scopes, target);
  initActions(node.actions, scopes, target);
  
  var contents = makeContents(node.children, scopes);
  if (node.type) {
    target.setContents(contents);
  } else {
    target.setChildren(contents);
  }
}

function makeContents(children, scopes) {
  var i, n, content, contents = [];

  if (!children || !children.length) { return; }

  for (i = 0, n = children.length; i < n; ++i) {
    content = makeContent(children[i], scopes);
    if (content) {
      contents.push(content);
    }
  }

  return contents;
}


function makeContent(node, scopes) {
  var tag = node.tag, type, content;

  if (typeof node === 'string') {
    content = Text.create(node);
  } else if (node instanceof Expression) { // like "hello, @{ $.name }..."
    content = Fragment.create(null, scopes, node);
    // node.compile('contents', content, scopes);
  } else if (node.ctrls == null && node.tag !== '!') {
    type = node.type;
    if (type) {
      // TODO: Component.create(type, props, options, scopes);
      content = Component.create(type, null, scopes, node);
    } else if (node.tag !== '!') {
      // if (node.ns == null) {
      //   node.ns = node.ns;
      // }
      content = Element.create(node.ns ? node.ns + ':' + tag : tag, null, scopes, node);
    }
    // start(node, content, scopes);
    if (content && node.name) {
      scopes[0].addNamedPart(node.name, content); // TODO: removeNamedPart
      defineProp(content, '$owner', {
        value: scopes[0]
      });
    }
  } else if (node.ctrls) {
    content = Component.create(Block, null, scopes, node);
  }

  return content;
}

// function start(node, target, scopes) { // TODO: host, data, event
//   scope = scope || target;

//   if (scope === target) {
//     locals = [scope];
//   }

//   build(node, target, scopes);
// }



// function fillShell(target, scopes, node) {
//   var i, n, content, contents = [], children = node.children;

//   if (!children || !children.length) { return; }

//   for (i = 0, n = children.length; i < n; ++i) {
//     content = makeShell(children[i], scopes);
//     if (content) {
//       contents.push(content);
//     }
//   }

//   /*if (target === scope) {
//     target._content.setChildren(contents);
//   } else*/ if (!node.type/* || target === scope*/) {
//     target.setChildren(contents);
//   } else {
//     target.setContents(contents);
//   }
// }

var HTMXEngine = {
  initProps: initProps,
  initOthers: initOthers,
  makeContent: makeContent
};

config.HTMXEngine = HTMXEngine;

export default HTMXEngine;