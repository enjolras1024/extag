// src/core/template/parsers/JSXParser.js

import Path from 'src/base/Path'
import Slot from 'src/core/shells/Slot'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import HTMXEngine from 'src/core/template/HTMXEngine'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import DataBindingParser from "src/core/template/parsers/DataBindingParser";
import EventBindingParser from "src/core/template/parsers/EventBindingParser";
import PrimitiveLiteralParser from 'src/core/template/parsers/PrimitiveLiteralParser'
import FuncBinding from 'src/core/bindings/FuncBinding'
import DataBinding from 'src/core/bindings/DataBinding'
import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import { 
  HOOK_ENGINE,
  EXTAG_VNODE,
  BINDING_OPERATORS,
  WHITE_SPACES_REGEXP
 } from 'src/share/constants'
import { 
  slice, 
  flatten, 
  throwError,
  hasOwnProp
 } from 'src/share/functions'
 import config from 'src/share/config'

 var DATA_BINDING_MODES = DataBinding.MODES;

function checkExprMode(mode) {
  if (mode !== BINDING_OPERATORS.DATA && mode !== BINDING_OPERATORS.TEXT) {
    throwError(mode + ' is not allowed in expr() for data binding');
  }
}

function parseJsxNode(node, prototype) {
  var attrs = node.attrs, value, key, args;
  if (node.xif) {
    args = node.xif.args;
    checkExprMode(args[0]);
    node.xif = parseJsxExpr(args, node, prototype);
  }
  if (node.xfor) {
    if (!Array.isArray(node.xfor[0])) {
      node.xfor[0] = node.xfor[0].replace(WHITE_SPACES_REGEXP, '').split(',');
    }
    args = node.xfor[1].args;
    checkExprMode(args[0]);
    node.xfor[1] = parseJsxExpr(args, node, prototype);
    node.identifiers = node.identifiers.concat([node.xfor[0]]);
  }
  if (node.xkey) {
    args = node.xkey.args;
    checkExprMode(args[0]);
    node.xkey = parseJsxExpr(args, node, prototype);
  }
  if (attrs) {
    // parse expression, and extract style, class
    for (key in attrs) {
      value = attrs[key];
      if (value && typeof value === 'object') {
        if (value.__extag_expr__ === Expression) {
          args = value.args;
          checkExprMode(args[0]);
          attrs[key] = parseJsxExpr(args, node, prototype);
        } else if (key === 'style') {
          node[key] = parseJsxData(value, node, prototype);
          delete attrs[key];
        }
      }
    }
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
    parseJsxEvents(node, prototype);
  }
}

function parseEvaluater(expr, prototype, identifiers) {
  var type = typeof expr;
  if (type === 'string') {
    return EvaluatorParser.parse(expr, prototype, identifiers);
  } else if (type === 'function') {
    return expr;
  } else {
    throwError('evaluator must be string or function');
  }
}

function parseConverters(exprs, prototype, identifiers) {
  var converters = [], converter;
  for (var i = 0; i < exprs.length; ++i) {
    converter = parseEvaluater(
      exprs[i], 
      prototype, 
      identifiers
    );
    converters.push(converter);
  }
  return converters;
}

function parseJsxData(data, node, prototype) {
  var key, value;
  for (key in data) {
    value = data[key];
    if (value && typeof value === 'object') {
      if (value.__extag_expr__ === Expression) {
        data[key] = parseJsxExpr(value.args, node, prototype);
      }
    }
  }
  return data;
}
function parseJsxExpr(args, node, prototype) {
  if (args.length < 2) {
    throwError('Unexpected arguments for expr()');
  }
  var mode = args[0];
  var expr = args[1];
  var type = typeof expr;
  var target, pattern, result;
  if (mode === BINDING_OPERATORS.DATA 
      || mode === BINDING_OPERATORS.FRAGMENT) {
    if (mode === BINDING_OPERATORS.FRAGMENT) {
      target = 'frag';
    }
    if (args.length === 2 && type === 'string') {
      if (!target && expr[0] === BINDING_OPERATORS.TWO_WAY) {
        if (!Path.test(expr.slice(1))) {
          throwError('Invalid two-way binding expression!', {
            code: 1001,
            expr: arguments[0],
            desc: '`' + arguments[0] + '` is not a valid two-way binding expression. Must be a property name or path.'
          });
        }
        pattern = {
          mode: DATA_BINDING_MODES.TWO_WAY,
          evaluator: parseEvaluater(expr.slice(1), prototype, node.identifiers)
        };
        return new Expression(DataBinding, pattern);
      }
      result = PrimitiveLiteralParser.tryParse(expr.trim());
      if (result != null) {
        return result;
      }
      pattern = DataBindingParser.parse(expr, prototype, node.identifiers);
      pattern.target = target;
      return new Expression(target === 'frag' ? FuncBinding : DataBinding, pattern);
    } else {
      switch (args[args.length - 1]) {
        case BINDING_OPERATORS.ASSIGN:
          mode = DATA_BINDING_MODES.ASSIGN;
          args = args.slice(0, -1);
          break;
        case BINDING_OPERATORS.ANY_WAY:
          mode = DATA_BINDING_MODES.ANY_WAY;
          args = args.slice(0, -1);
          break;
        case BINDING_OPERATORS.ONE_TIME:
          mode = DATA_BINDING_MODES.ONE_TIME;
          args = args.slice(0, -1);
          break;
        default:
          mode = DATA_BINDING_MODES.ONE_WAY;
          break;
      }

      pattern = {
        mode: mode,
        target: target,
        evaluator: parseEvaluater(expr, prototype, node.identifiers),
        converters: args.length <= 2 ? null :
                      parseConverters(args.slice(2), prototype, node.identifiers)
      };
      return new Expression(target === 'frag' ? FuncBinding : DataBinding, pattern);
    }
  } else if (mode === BINDING_OPERATORS.EVENT) {
    if (type === 'string' && args.length === 2) {
      pattern = EventBindingParser.parse(expr, prototype, node.identifiers);
    } else if (type === 'function') {
      pattern = {
        evaluator: parseEvaluater(expr, prototype, node.identifiers),
        modifiers: args.length > 2 ? args.slice(2) : null
      };
    } else {
      throwError('Unexpected arguments for expr()');
    }
    return new Expression(EventBinding, pattern);
  } else if (mode === BINDING_OPERATORS.TEXT) {
    pattern = [];
    for (var i = 1; i < args.length; ++i) {
      expr = args[i];
      if (expr && typeof expr === 'object' && expr.__extag_expr__) {
        expr = parseJsxExpr(expr.args, node, prototype);
      }
      pattern.push(expr);
    }
    return new Expression(TextBinding, pattern);
  } else {
    throwError('The first argument of expr() should be one of "@", "+", "#", "{}"');
  }

}

function parseJsxEvents(node, prototype) {
  var evt, expr, args, value, events = node.events;
  for (evt in events) {
    value = events[evt];
    if (value && typeof value === 'object' && value.__extag_expr__ === Expression) {
      args = value.args;
      if (args[0] !== BINDING_OPERATORS.EVENT) {
        throwError(args[0] + ' is not allowed in expr() for event binding');
      }
      expr = parseJsxExpr(args, node, prototype);
      if (expr) {
        events[evt] = expr;
      }
    }
  }
}

function parseJsxContents(node, prototype) {
  var contents = node.contents;
  if (!contents || !contents.length) {
    return;
  }
  contents = node.contents = flatten(contents);

  var i, type, vnode;
  for (i = contents.length - 1; i >= 0; --i) {
    vnode = contents[i];
    type = typeof vnode;
    if (type === 'object') {
      if (vnode.__extag_node__ === EXTAG_VNODE) {
        if (node.ns && !vnode.ns) {
          vnode.ns = node.ns;
        }
        vnode.useExpr = true;
        vnode.identifiers = node.identifiers;
        parseJsxNode(vnode, prototype);
        parseJsxContents(vnode, prototype);
        continue;
      } else if (vnode.__extag_expr__ === Expression) {
        var mode = vnode.args[0];
        if (mode !== BINDING_OPERATORS.DATA && 
            mode !== BINDING_OPERATORS.FRAGMENT) {
          throwError(mode + ' is not allowed in expr() for text or fragment binding');
        }
        contents[i] = {
          __extag_node__: EXTAG_VNODE,
          useExpr: true,
          type: Expression,
          expr: parseJsxExpr(vnode.args, node, prototype)
        };
      }
    }
  }
}

var RESERVED_PARAMS = {
  xns: true,
  xif: true,
  xfor: true,
  xkey: true,
  xname: true,
  xslot: true,
  xtype: true,
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
    if (options.xns) {
      node.ns = options.xns;
    }
    if (options.xif) {
      node.xif = options.xif;
    }
    if (options.xfor) {
      node.xfor = options.xfor;
    }
    if (options.xkey) {
      node.xkey = options.xkey;
    }
    if (options.xname) {
      node.name = options.xname;
    }
    if (options.xslot) {
      node.slot = options.xslot;
    }
    if (options.xtype) {
      if (options.xtype instanceof Expression) {
        node.xtype = options.xtype;
      } else {
        node.type = options.xtype;
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
    node.contents = contents;
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
function expr() {
  return {
    args: slice.call(arguments, 0),
    __extag_expr__: Expression
  };
}

var JSXParser = {
  node: node,
  expr: expr,
  /**
   * Parse the template created by node(), connect to prototype
   * @param {Object} template 
   * @param {Object} prototype 
   */
  parse: function(template, prototype) {
    var _node = template(node, expr);

    if (_node.__extag_node__ !== EXTAG_VNODE) {
      throwError('template root must be a tag node');
    }

    _node.useExpr = true;
    _node.identifiers = ['this'];
    parseJsxNode(_node, prototype);
    parseJsxContents(_node, prototype);

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