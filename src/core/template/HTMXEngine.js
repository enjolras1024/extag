// src/core/template/HTMXEngine.js

import DirtyMarker from 'src/base/DirtyMarker'
import Validator from 'src/base/Validator'
import Cache from 'src/core/models/Cache'
import Text from 'src/core/shells/Text'
import Shell from 'src/core/shells/Shell'
import Block from 'src/core/shells/Block'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
// import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'
import { defineProp, assign } from 'src/share/functions'
import config from 'src/share/config'

function toStyle(cssText, viewEngine) {
  if (!viewEngine || typeof cssText !== 'string') {
    return;
  }
  var style = {},  pieces = cssText.split(';'), piece, index, i;
  for (i = pieces.length - 1; i >= 0; --i) {
    piece = pieces[i];
    index = piece.indexOf(':');
    if (index > 0) {
      style[viewEngine.toCamelCase(piece.slice(0, index).trim())] = piece.slice(index + 1).trim();
    }
  }
  return style;
}

function toClasses(classList) {
  if (typeof classList === 'string') {
    classList = classList.trim().split(WHITE_SPACES_REGEXG);
  }
  if (Array.isArray(classList)) {
    var i, classes = {};
    for (i = 0; i < classList.length; ++i) {
      if (classList[i]) {
        classes[classList[i]] = true;
      }
    }
    return classes;
  }
}

function driveProps(target, props, scopes) {
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

function driveEvents(target, events, scopes) {
  if (events) {
    var type, value;
    for (type in events) {
      value = events[type];
      if (typeof value === 'object' && value instanceof Expression) {
        value.compile(type, target, scopes);
      } else if (typeof value === 'function') {
        target.on(type, value);
      }
    }
  }
}

function driveChildren(target, children, scopes) {
  var contents = makeContents(children, scopes);
  target.setChildren(contents);
}

function driveContents(target, children, scopes) {
  var contents = makeContents(children, scopes);
  target.setContents(contents);
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
    content = new Text(node);
  } else if (node instanceof Expression) { // like "hello, @{ $.name }..."
    content = new Fragment(null, scopes, node);
    // node.compile('contents', content, scopes);
  } else if (node.xif || node.xfor) {
    content = new Block(null, scopes, node);
  } else if (node.tag !== '!') {
    type = node.type;
    if (type) {
      content = new type(null, scopes, node);
    } else if (node.tag !== '!') {
      // if (node.ns == null) {
      //   node.ns = node.ns;
      // }
      content = new Element(node.ns ? node.ns + ':' + tag : tag, null, scopes, node);
      if (node.events) {
        driveEvents(content, node.events, scopes);
      }
      if (node.props) {
        driveProps(content, node.props, scopes)
      }
      if (node.attrs) {
        driveProps(content.attrs, node.attrs, scopes);
      }
      if (node.style) {
        driveProps(content.style, node.style, scopes);
      }
      if (node.classes) {
        driveProps(content.classes, node.classes, scopes);
      }
      if (node.children) {
        driveChildren(content, node.children, scopes);
      }
    }

    if (content && node.name) {
      scopes[0].addNamedPart(node.name, content); // TODO: removeNamedPart
      defineProp(content, '$owner', {
        value: scopes[0]
      });
    }
  }

  return content;
}

function driveComponent(target, _template, scopes, template, props) {
  var _scopes = [target];

  if (template && scopes) {
    if (props && template.props) {
      props = assign({}, template.props, props);
    } else if (!props && template.props) {
      props = template.props;
    }
    if (__ENV__ === 'development') {
      Validator.validate0(target, props);
    }
    driveProps(target, props, scopes);

    if (template.events) {
      driveEvents(target, template.events, scopes);
    }
    if (template.attrs) {
      driveProps(target.attrs, template.attrs, scopes);
    }
    if (template.style) {
      driveProps(target.style, template.style, scopes);
    }
    if (template.classes) {
      driveProps(target.classes, template.classes, scopes);
    }
    if (template.children) {
      driveContents(target, template.children,scopes);
    }
  } else if (props) {
    if (__ENV__ === 'development') {
      Validator.validate0(store, props);
    }
    driveProps(target, props, scopes);
  }
  
  if (_template.events) {
    driveEvents(target, _template.events, _scopes);
  }
  if (_template.props) {
    defineProp(target, '__props', {
      value: new Cache(target), 
      configurable: true
    });
    driveProps(target.__props, _template.props, _scopes);
  }
  if (_template.attrs) {
    defineProp(target, '__attrs', {
      value: new Cache(target), 
      configurable: true
    });
    driveProps(target.__attrs, _template.attrs, _scopes);
  }
  if (_template.style) {
    defineProp(target, '__style', {
      value: new Cache(target), 
      configurable: true
    });
    driveProps(target.__style, _template.style, _scopes);
  }
  if (_template.classes) {
    defineProp(target, '__classes', {
      value: new Cache(target), 
      configurable: true
    });
    driveProps(target.__classes, _template.classes, _scopes);
  }
  if (_template.children) {
    driveChildren(target, _template.children, _scopes);
  }
}

function transferProperties(shell) {
  if (!shell.tag) {
    return;
  }

  var _props = shell._props;
  var style, classes, viewEngine;
    
  if (shell.hasDirty('style')) {
    DirtyMarker.clean(shell, 'style');
    style = _props.style;
    if (typeof style === 'object') {
      shell.style.reset(style);
    } else if (typeof style === 'string') {
      viewEngine = Shell.getViewEngine(shell);
      if (viewEngine) {
        style = toStyle(style, viewEngine);
      }
      shell.style.reset(style);
    }
  }
  if (shell.hasDirty('classes')) {
    DirtyMarker.clean(shell, 'classes');
    classes = _props.classes;
    if (typeof classes !== 'object') {
      classes = toClasses(classes);
    }
    shell.classes.reset(classes);
  }

  if (!shell.__props || !shell.constructor.__extag_component_class__) { 
      return; 
  }

  var __props = shell.__props;
  
  if (__props && __props.hasDirty('style')) {
    var __style = shell.__style;
    if (!__style) {
      __style = new Cache(shell);
      defineProp(target, '__style', {
        value: __style, 
        configurable: true
      });
    }
    DirtyMarker.clean(__props, 'style');
    style = __props.style;
    if (typeof style === 'object') {
      __style.reset(style);
    } else if (typeof style === 'string') {
      viewEngine = Shell.getViewEngine(shell);
      if (viewEngine) {
        style = toStyle(style, viewEngine);
      }
      __style.reset(style);
    }
  }
  if (__props && __props.hasDirty('classes')) {
    var __classes = shell.__classes;
    if (!__classes) {
      __classes = new Cache(shell);
      defineProp(target, '__classes', {
        value: __classes, 
        configurable: true
      });
    }
    DirtyMarker.clean(__props, 'classes');
    classes = __props.classes;
    if (typeof classes !== 'object') {
      classes = toClasses(classes);
    }
    __classes.reset(classes);
  }
}

var HTMXEngine = {
  driveProps: driveProps,
  driveEvents: driveEvents,
  driveContents: driveContents,
  driveChildren: driveChildren,
  driveComponent: driveComponent,
  transferProperties: transferProperties,
  buildContent: makeContent,
  makeContent: makeContent,
  makeContents: makeContents
};

config.HTMXEngine = HTMXEngine;

export default HTMXEngine;