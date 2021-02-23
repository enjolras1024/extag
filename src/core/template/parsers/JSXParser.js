// src/core/template/parsers/JSXParser.js

import Path from 'src/base/Path'
import Slot from 'src/core/shells/Slot'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import HTMXEngine from 'src/core/template/HTMXEngine'
import DataBinding from 'src/core/bindings/DataBinding'
import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import ClassBinding from 'src/core/bindings/ClassBinding'
import StyleBinding from 'src/core/bindings/StyleBinding'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import { 
  HOOK_ENGINE,
  EXTAG_VNODE,
  HANDLER_REGEXP,
  BINDING_OPERATORS,
  WHITE_SPACES_REGEXP,

  FLAG_X_ATTRS,
  FLAG_X_CLASS,
  FLAG_X_STYLE,
  FLAG_X_EVENTS,
  FLAG_X_CONTENTS
 } from 'src/share/constants'
import { 
  slice, 
  flatten, 
  throwError,
  hasOwnProp
 } from 'src/share/functions'
 import config from 'src/share/config'

function checkExpr(name, value) {
  if (!(value instanceof Expression)) {
    throwError(name + ': not an expression');
  }
}

function parseJsxExpr(expr, resources, identifiers) {
  var evaluator = expr.pattern.evaluator;
  if (typeof evaluator === 'string') {
    expr.pattern.evaluator = EvaluatorParser.parse(evaluator, resources, identifiers);
  }
  if (expr.binding == null) {
    expr.binding = DataBinding;
  }
  return expr;
}

function parseJsxData(data, resources, identifiers) {
  var key, value;
  for (key in data) {
    value = data[key];
    if (value && (value instanceof Expression)) {
      parseJsxExpr(value, resources, identifiers);
    }
  }
  return data;
}

function parseJsxNode(node, resources) {
  var attrs = node.attrs, value, key, identifiers;
  if (attrs) {
    var xattrs;
    identifiers = node.identifiers;
    for (key in attrs) {
      value = attrs[key];
      if (value && typeof value === 'object') {
        if (value instanceof Expression) {
          // if (value.binding === EventBinding) {
          //   parseJsxExpr(value, resources, node.identifiers.concat(['$event']));
          //   (events = events || {})[key] = value;
          //   delete attrs[key];
          // } else {
            parseJsxExpr(value, resources, identifiers);
            
            (xattrs = xattrs || {})[key] = value;
            delete attrs[key];
          // }
        } else if (key === 'x-class') {
          value = parseJsxData(value, resources, identifiers);
          (xattrs = xattrs || {})['class'] = new Expression(ClassBinding, value);
          delete attrs[key];
        } else if (key === 'x-style') {
          value = parseJsxData(value, resources, identifiers);
          (xattrs = xattrs || {})['style'] = new Expression(StyleBinding, value);
          delete attrs[key];
        }
      }
    }
    if (xattrs) {
      node.xattrs = xattrs;
      node.xflag |= FLAG_X_ATTRS;
    }
    // if (events) {
    //   node.events = events;
    //   node.xflag |= FLAG_X_EVENTS;
    // }
  }
  if (node.type == null && node.xtype == null) {
    switch (node.tag) {
      case 'x:slot':
        node.type = Slot;
        break;
      case 'x:frag':
        node.type = Fragment;
        break;
    }
  }
  if (node.events) {
    var events = node.events;
    identifiers = node.identifiers.concat(['$event']);
    for (key in events) {
      value = events[key];
      if (value instanceof Expression) {
        value.binding = EventBinding;
        if (!HANDLER_REGEXP.test(value.pattern.evaluator)) {
          parseJsxExpr(value, resources, identifiers);
        }
      }
    }
  }
}

function parseJsxContents(vnode, resources) {
  var contents = vnode.contents;
  if (!contents || !contents.length) {
    return;
  }
  contents = vnode.contents = flatten(contents);
  var identifiers = vnode.identifiers;
  if (vnode.xfor) {
    identifiers = identifiers.slice(0);
    identifiers.push(vnode.xfor[0]);
  }

  var i, type, value;
  for (i = contents.length - 1; i >= 0; --i) {
    value = contents[i];
    type = typeof value;
    if (type !== 'object') {
      continue;
    }
    if (value.__extag_node__ === EXTAG_VNODE) {
      if (vnode.ns && !value.ns) {
        value.ns = vnode.ns;
      }
      value.xflag = 0;
      value.key = i + '.' + vnode.key;
      value.identifiers = identifiers;
      parseJsxNode(value, resources);
      parseJsxContents(value, resources);

      if (value.xif || value.xfor || value.xtype) {
        vnode.xflag |= FLAG_X_CONTENTS;
      }
    } else if (value instanceof Expression) {
      parseJsxExpr(value, resources, identifiers);
      vnode.xflag |= FLAG_X_CONTENTS;
    }
  }
}

var RESERVED_PARAMS = {
  'x-ns': true,
  'x-if': true,
  'x-for': true,
  'x-key': true,
  'x-name': true,
  'x-slot': true,
  'x-type': true,
  events: true
};

/**
 * Create virtual node
 * @param {string|Function} type  element tag or component type
 * @param {Object} options  some attrs, events, and expressions maybe
 * @param {string|Array|Object} contents  virtual child nodes
 * @returns {Object}
 */
function node(type, options, contents) {
  var node = {
    __extag_node__: EXTAG_VNODE
  };

  var t = typeof type;
  if (t === 'string') {
    var i = type.indexOf(':');
    if (i < 0) {
      node.ns = '';
      node.tag = type;
    } else {
      if (type.slice(0, i) === 'x') {
        switch(type) {
          case 'x:slot':
            node.tag = type;
            node.type = Slot;
            break;
          case 'x:frag':
            node.tag = type;
            node.type = Fragment;
            break;
        }
      } 
      if (!node.type) {
        node.ns = type.slice(0, i);
        node.tag = type.slice(i + 1);
      }
    }
  } else if (t === 'function') {
    if (type.__extag_component_class__ || type === Fragment) {
      node.type = type;
    } else {
      var hookEngine = config.get(HOOK_ENGINE);
      if (hookEngine) {
        node.type = hookEngine.getHookableComponentClass(type);
      }
      if (typeof node.type !== 'function' || !node.type.__extag_component_class__) {
        throwError('component class is not found.');
      }
    }
  } else {
    throwError('The first argument must be string, function, component class or constructor.');
  }

  if (options && typeof options === 'object') {
    if (options['x-ns']) {
      node.ns = options['x-ns'];
    }
    if (options['x-if']) {
      node.xif = options['x-if'];
      checkExpr('x-if', node.xif);
    }
    if (options['x-for']) {
      node.xfor = options['x-for'];
      checkExpr('x-for', node.xfor[0]);
      if (!Array.isArray(node.xfor[0])) {
        node.xfor[0] = node.xfor[0].replace(WHITE_SPACES_REGEXP, '').split(',');
      }
    }
    if (options['x-key']) {
      node.xkey = options['x-key'];
    }
    if (options['x-name']) {
      node.name = options['x-name'];
    }
    if (options['x-slot']) {
      node.slot = options['x-slot'];
    }
    if (options['x-type']) {
      if (options['x-type'] instanceof Expression) {
        node.xtype = options['x-type'];
      } else {
        node.type = options['x-type'];
      }
    }

    if (options.events) {
      node.events = options.events;
    }

    var key, attrs = {};
    for (key in options) {
      if (!RESERVED_PARAMS[key] && 
          hasOwnProp.call(options, key)) {
        attrs[key] = options[key];
      }
    }
    node.attrs = attrs;
  }

  if (contents != null) {
    if (arguments.length > 3) {
      contents = slice.call(arguments, 2);
    } else if (!Array.isArray(contents)) {
      contents = [contents];
    }
    node.contents = flatten(contents);
  }

  return node;
}

/**
 * Create virtual expression.
 * e.g.
 * just a string: expr('a > b')
 * just a function: expr(function() {return this.a > this.b;})
 * just a function with iterator: expr(function(item) {return this.key === item.key})
 * just a string with converters(modifiers): expr('titile |=upper ?'), expr('onClick::bind')
 * a function followed by more functions as converters: expr(function(){return this.title}, upper, '?')
 * a event handler function followed by more strings as modifiers: expr(function(){return this.title}, 'once')
 */
// function expr(type, statement, modifiers) {
//   switch (type) {
//     case '@':
//       // if (typeof statement === 'function') {
//       //   return new Expression(DataBinding, {
//       //     evaluator: statement,
//       //     modifiers: modifiers
//       //   });
//       // } else if (typeof statement === 'string') {
//       //   // statement = statement.slice(1);
//       //   // if (!Path.test(statement)) {
//       //   //   throwError('Invalid two-way binding expression: ' + statement);
//       //   // }
//       //   // return new Expression(DataBinding, {
//       //   //   mode: DataBinding.MODES.TWO_WAY,
//       //   //   path: Path.parse(statement)
//       //   // });
//       //   return new Expression(DataBinding, {
//       //     statement: statement,
//       //     modifiers: modifiers
//       //   });
//       // } else {
//       //   return throwError('Unexpected statement: ', statement);
//       // }
//       return new Expression(DataBinding, {
//         evaluator: statement,
//         modifiers: modifiers
//       });
//     case '+':
//       return new Expression(EventBinding, {
//         handler: statement,
//         modifiers: modifiers
//       })
//     case '#':
//       return new Expression(TextBinding, slice.call(arguments, 1));
//     default:
//       return throwError('Unsopported binding type: ' + type);
//   }
// }

function expr(evaluator, modifiers) {
  var type = typeof evaluator;
  if (type === 'function' || type === 'string') {
    return new Expression(null, {
      evaluator: evaluator,
      modifiers: modifiers
    })
  } else if (Array.isArray(evaluator)) {
    return new Expression(TextBinding, evaluator);
  }
}

var JSXParser = {
  node: node,
  expr: expr,
  /**
   * Parse the template
   * @param {function} template 
   */
  parse: function(template, resources, sign) {
    var _node = template(node, expr);

    if (_node.__extag_node__ !== EXTAG_VNODE) {
      throwError('template root must be a tag node');
    }

    _node.key = sign;
    _node.xflag = 0;
    _node.identifiers = ['this'];
    parseJsxNode(_node, resources);
    parseJsxContents(_node, resources);

    if (_node.type) {
      if (_node.type === Fragment) {
        _node.tag = 'x:frag';
        _node.type = null;
      } else {
        throwError('component can not be used as root tag of another component template.')
      }
    } 
    if (_node.xif || _node.xfor || _node.xkey) {
      throwError('`xif`, `xfor`, `xkey` can not be used on root tag of component template.')
    }

    return _node;
  }
}

HTMXEngine.parseJSX = JSXParser.parse;

export default JSXParser