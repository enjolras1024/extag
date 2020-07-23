import Path from 'src/base/Path'
import Slot from 'src/core/shells/Slot'
import Output from 'src/core/shells/Output'
import Fragment from 'src/core/shells/Fragment'
import Evaluator from 'src/core/template/Evaluator'
import Expression from 'src/core/template/Expression'
import HTMXEngine from 'src/core/template/HTMXEngine'
import DataBindingParser from "src/core/template/parsers/DataBindingParser";
import EventBindingParser from "src/core/template/parsers/EventBindingParser";
import DataBinding from 'src/core/bindings/DataBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import logger from 'src/share/logger'
import { 
  EXTAG_VNODE,
  CAPITAL_REGEXP,
 } from 'src/share/constants'
import { 
  slice, 
  flatten, 
  throwError,
  hasOwnProp
 } from 'src/share/functions'

 function getExprArgs(value) {
  var type = typeof value;
  if (type === 'object' && value.__extag_expr__ === Expression) {
    return value.args;
  } else if (type === 'string' || type === 'function') {
    return [value];
  } else if (Array.isArray(value)) {
    return value;
  }
}

function parseJsxNode(node, prototype) {
  var props = node.props, value, key, ctor, args;
  if (node.xif) {
    args = getExprArgs(node.xif);
    node.xif = parseJsxDataExpr(args, node, prototype);
  }
  if (node.xfor) {
    args = getExprArgs(node.xfor[1]);
    node.xfor[1] = parseJsxDataExpr(args, node, prototype);
    node.identifiers = node.identifiers.concat([node.xfor[0]]);
  }
  if (node.xkey) {
    args = getExprArgs(node.xkey);
    node.xkey = parseJsxDataExpr(args, node, prototype);
  }
  if (props) {
    // parse expression, and extract style, attrs, classes
    for (key in props) {
      value = props[key];
      if (typeof value === 'object') {
        if (value.__extag_expr__ === Expression) {
          props[key] = parseJsxDataExpr(value.args, node, prototype);
        } /*else if (key === 'classes' || key === 'style' || key === 'attrs') {
          node[key] = value;
          delete props[key];
        }*/
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

function parseEvaluater(evaluator, prototype, identifiers) {
  var type = typeof evaluator;
  if (type === 'string') {
    return EventBindingParser.parse(evaluator, prototype, identifiers);
  } else if (type === 'function') {
    return new Evaluator(evaluator);
  } else {
    throwError('evaluator must be string or function');
  }
}

function parseConverters(converters, prototype, identifiers) {
  for (var i = 0; i < converters.length; ++i) {
    converters[i] = parseEvaluater(converters[i, prototype, identifiers]);
  }
}

function parseJsxDataExpr(args, node, prototype) {
  var target, type = typeof args[0];
  if (args.length === 1) {
    if (type === 'string') {
      return new Expression(DataBinding, 
        DataBindingParser.parse(args[0], prototype, node.identifiers));
    } else if (type === 'function') {
      return new Expression(DataBinding, {
        mode: 1,
        evaluator: parseEvaluater(args[0], prototype, node.identifiers)
      })
    } else {
      return args[0]
    }
    
  } else {
    if (args[0] === '{' && args[args.length - 1] === '}') {
      args = args.slice(1, 2);
      target = 'frag';
    }
    if (args[0] === '@') {
      return new Expression(DataBinding, {
        mode: 2,
        path: args[1],
        evaluator: parseEvaluater(args[2]),
        identifiers: node.identifiers
      })
    } else {
      var mode = 1;
      switch (args[args.length - 1]) {
        case '?':
          args = args.slice(0, -1);
          mode = 0;
          break;
        case '!':
          args = args.slice(0, -1);
          mode = -1;
          break;
        case '^':
          args = args.slice(0, -1);
          mode = 3;
          break;
      }
      return new Expression(DataBinding, {
        mode: mode,
        target: target,
        evaluator: parseEvaluater(args[1], prototype, node.identifiers),
        converters: args.length === 2 ? null : 
                    parseConverters(args.slice(2), prototype, node.identifiers)
      });
    }
  }
}

function parseJsxEventExpr(args, node, prototype) {
  var pattern,  type = typeof args[0];
  if (type === 'string' && args.length === 1) {
    pattern = EventBindingParser.parse(args[0], prototype, node.identifiers);
  } else if (type === 'function') {
    pattern = {
      evaluator: new Evaluator(args[0]),
      modifiers: args.length > 1 ? args.slice(1) : null
    };
  } else {
    pattern = null;
  }
  return pattern ? new Expression(EventBinding, pattern) : null;
}

function parseJsxEvents(node, prototype) {
  var evt, expr, args, value, events = node.events;
  for (evt in events) {
    value = events[evt];
    args = getExprArgs(value);
    expr = parseJsxEventExpr(args, prototype, node.identifiers);
    if (expr) {
      events[evt] = expr;
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
        // children[i] = parseJsxDataExpr(child.args, node, prototype);
        children[i] = {
          __extag_node__: EXTAG_VNODE,
          useExpr: true,
          type: Expression,
          expr: parseJsxDataExpr(child.args, node, prototype)
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