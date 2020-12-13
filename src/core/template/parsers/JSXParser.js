import Path from 'src/base/Path'
import Slot from 'src/core/shells/Slot'
import Output from 'src/core/shells/Output'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import HTMXEngine from 'src/core/template/HTMXEngine'
import FuncEvaluator from 'src/core/template/FuncEvaluator'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import DataBindingParser from "src/core/template/parsers/DataBindingParser";
import TextBindingParser from "src/core/template/parsers/TextBindingParser";
import EventBindingParser from "src/core/template/parsers/EventBindingParser";
import PrimitiveLiteralParser from 'src/core/template/parsers/PrimitiveLiteralParser'
import DataBinding from 'src/core/bindings/DataBinding'
import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import logger from 'src/share/logger'
import { 
  EXTAG_VNODE,
  CAPITAL_REGEXP,
  BINDING_OPERATORS
 } from 'src/share/constants'
import { 
  slice, 
  flatten, 
  throwError,
  hasOwnProp
 } from 'src/share/functions'

 var DATA_BINDING_MODES = DataBinding.MODES;

function checkExprMode(mode) {
  if (mode !== BINDING_OPERATORS.DATA && mode !== BINDING_OPERATORS.TEXT) {
    throwError(mode + ' is not allowed in expr() for data binding');
  }
}

function parseJsxNode(node, prototype) {
  var props = node.props, value, key, ctor, args;
  if (node.xif) {
    args = node.xif.args;
    checkExprMode(args[0]);
    node.xif = parseJsxExpr(args, node, prototype);
  }
  if (node.xfor) {
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
  if (props) {
    // parse expression, and extract style, class
    for (key in props) {
      value = props[key];
      if (value && typeof value === 'object') {
        if (value.__extag_expr__ === Expression) {
          args = value.args;
          checkExprMode(args[0]);
          props[key] = parseJsxExpr(args, node, prototype);
        } else if (key === 'class' || key === 'style') {
          node[key] = parseJsxData(value, node, prototype);
          delete props[key];
        }
      }
    }
  }
  if (node.type && typeof node.type === 'string') {
    ctor = Path.search(node.type, prototype.constructor.resources);
    if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        logger.warn('Can not find such component type `' + expr + '`. ' + 
                    'Make sure it extends Component and please register `' + expr  + '` in static resources.');
      }
      throwError('Can not find such component type `' + expr + '`');
    }
    node.type = ctor;
  }
  if (node.type == null && CAPITAL_REGEXP.test(node.tag)) {
    ctor = Path.search(node.tag, prototype.constructor.resources);
    if (typeof ctor === 'function' && ctor.__extag_component_class__) {
      node.type = ctor;
    // eslint-disable-next-line no-undef
    } else if (__ENV__ === 'development') {
      logger.warn('`' + node.tag + '` maybe component type but not found.');
    }
  }
  if (node.type == null) {
    switch (node.tag) {
      case 'x:slot':
        node.type = Slot;
        break;
      // case 'x:view':
      //   node.type = View;
      //   break;
      case 'x:frag':
        node.type = Fragment;
        break;
      // case 'x:block':
      //   node.type = Block;
      //   break;
      case 'x:output':
        node.type = Output;
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
    return new FuncEvaluator(expr);
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
      return new Expression(DataBinding, pattern);
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
      return new Expression(DataBinding, pattern);
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

function parseJsxChildren(node, prototype) {
  var children = node.children;
  if (!children || !children.length) {
    return;
  }
  var i, child;
  for (i = children.length - 1; i >= 0; --i) {
    child = children[i];
    if (typeof child === 'object') {
      if (child.__extag_node__ === EXTAG_VNODE) {
        child.useExpr = true;
        child.identifiers = node.identifiers;
        parseJsxNode(child, prototype);
        parseJsxChildren(child, prototype);
        continue;
      } else if (child.__extag_expr__ === Expression) {
        var mode = child.args[0];
        if (mode !== BINDING_OPERATORS.DATA && 
            mode !== BINDING_OPERATORS.FRAGMENT) {
          throwError(mode + ' is not allowed in expr() for text or fragment binding');
        }
        children[i] = {
          __extag_node__: EXTAG_VNODE,
          useExpr: true,
          type: Expression,
          expr: parseJsxExpr(child.args, node, prototype)
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
 * @param {Object} options  some props, and expressions maybe
 * @param {string|Array|Object} children  child nodes
 * @returns {Object}
 */
function node(type, options, children) {
  var node = {
    __extag_node__: EXTAG_VNODE
  };
  var props, key;

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
          case 'x:output':
            node.tag = type;
            node.type = Output;
            break;
        }
      } 
      if (!node.type) {
        node.ns = type.slice(0, i);
        node.tag = type.slice(i + 1);
      }
    }
  } else if (t === 'function' && type.__extag_component_class__) {
    node.type = type;
  } else {
    throwError('The first argument must be string, component class or constructor.');
  }

  if (options != null) {
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
      if (!node.type) {
        node.type = options.xtype;
      } else if (node.type === Output) {
        node.props = {
          xtype: options.xtype
        }
      }
    }

    if (options.events) {
      node.events = options.events;
    }

    // var props;
    if (node.props) {
      props = node.props;
    } else {
      props = node.props = {};
    }

    for (key in options) {
      if (!RESERVED_PARAMS[key] && hasOwnProp.call(options, key)) {
        props[key] = options[key];
      }
    }
  }

  if (children) {
    if (arguments.length > 3 || Array.isArray(children)) {
      children = slice.call(arguments, 2);
      children = flatten(children);
    } else {
      children = [children];
    }
    node.children = children;

    // if (node.props) {
    //   props = node.props;
    // } else {
    //   props = node.props = {};
    // }
    // if (node.type) {
    //   props.contents = children;
    // } else {
    //   props.children = children;
    // }
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
    parseJsxChildren(_node, prototype);

    if (_node.type) {
      if (_node.tag === 'x:frag') {
        _node.type = null;
      } else if (_node.tag === 'x:slot' || _node.tag === 'x:view') {
        throwError(_node.tag + ' can not be used as root tag of component template.')
      } else {
        throwError('component can not be used as root tag of another component template.')
      }
    } else if (_node.xif || _node.xfor || _node.xkey) {
      throwError('`xif`, `xfor`, `xkey` can not be used on root tag of component template.')
    }

    return _node;
  }
}

HTMXEngine.parseJSX = JSXParser.parse;

export default JSXParser