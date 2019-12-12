import Path from 'src/base/Path'
import View from 'src/core/shells/View'
import Slot from 'src/core/shells/Slot'
import Block from 'src/core/shells/Block'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import FragmentBinding  from 'src/core/bindings/FragmentBinding'
import config from 'src/share/config'
import logger from 'src/share/logger'

import { 
  CONTEXT_REGEXP,
  HANDLER_REGEXP,
  CAPITAL_REGEXP,
  PROP_EXPR_REGEXP
 } from 'src/share/constants'
import { slice, flatten, throwError } from 'src/share/functions'

import FuncEvaluator from 'src/core/template/evaluators/FuncEvaluator';
import PropEvaluator from 'src/core/template/evaluators/PropEvaluator';
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

function parseJsxNode(node, prototype) {
  var props = node.props, value, key;
  if (node.xif) {
    node.xif.connect(prototype, node.identifiers);
  }
  if (node.xfor) {
    // if (Array.isArray(ctrls.xfor))
    node.xfor[1].connect(prototype, node.identifiers);
    node.identifiers = node.identifiers.concat([node.xfor[0]]);
  }
  if (node.xkey) {
    node.xkey.connect(prototype, node.identifiers);
  }
  if (props) {
    // style, attrs, classes, actions
    for (key in props) {
      value = props[key];
      if (typeof value === 'object' && value instanceof Expression) {
        value.connect(prototype, node.identifiers);
      }
    }
  }
  if (node.type && typeof node.type === 'string') {
    var ctor = Path.search(node.type, prototype.constructor.resources);
    if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
      if (__ENV__ === 'development') {
        logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in static resources.');
      }
      throwError('Can not find such component type `' + expr + '`');
    }
    // _directs.xType = ctor;
    node.type = ctor;
  }
  if (node.type == null && CAPITAL_REGEXP.test(node.tag)) {
    var ctor = Path.search(node.tag, prototype.constructor.resources);
    if (typeof ctor === 'function' && ctor.__extag_component_class__) {
      node.type = ctor;
    }
  }
  if (node.type == null) {
    switch (node.tag) {
      case 'x:slot':
        node.type = Slot;
        break;
      case 'x:view':
        node.type = View;
        break;
      case 'x:frag':
        node.type = Fragment;
        break;
      // case 'x:block':
      //   node.type = Block;
      //   break;
    }
  }
  if (node.events) {
    parseJsxEvents(node, prototype);
  }
}

function parseJsxEvents(node, prototype) {
  var events = node.events;
  var value, evt;
  for (evt in events) {
    value = events[evt];
    if (typeof value === 'object' && value instanceof Expression) {
      value.connect(prototype, node.identifiers);
      // actions[evt] = value;
    } else {
      value = expr('+', value);
      if (typeof value === 'object' && value instanceof Expression) {
        events[evt] = value;
      } else {
        delete events[evt];
      }
    }
      
  }
}

function parseJsxChildren(node, prototype) {
  var children = node.children;
  var i, j = -1, k, n, child;
  var hasExpr;
  for (i = children.length - 1; i >= 0; --i) {
    child = children[i];
    if (typeof child === 'object') {
      if (child.__extag_node__) {
        // TODO: slice(i, j);   splice(i, j, expr('#'))
        if (hasExpr) {
          children.splice(i + 1, j + 1, new Expression(FragmentBinding, children.slice(i + 1, j + 1)));
        }
        hasExpr = false;
        j = -1;

        child.identifiers = node.identifiers;
        parseJsxNode(child, prototype);
        parseJsxChildren(child, prototype);
        continue;
      }
      if (child instanceof Expression) {
        child.connect(prototype, node.identifiers);
        hasExpr = true;
      }
    }
    // if (hasExpr && i === 0) {
      
    // }
    if (j < 0) { 
      j = i;
    }
  }

  if (hasExpr && j > -1) {
    children.splice(0, j + 1, new Expression(FragmentBinding, children.slice(0, j + 1)));
  }

  // node.children = children.filter(function(child) {
  //   return !!child;
  // });
}

var RESERVED_PARAMS = {
  ns: null,
  on: null,
  // tag: null,
  xif: null,
  xfor: null,
  xkey: null,
  xname: null,
  xtype: null,
  props: null,
  // attrs: null,
  // style: null,
  // 'class': null,
  // classes: null,
  // className: null,
  
  // events: null,
  // directs: null,
  children: null,
  contents: null
};

/**
 *
 * @param {string|Function} tagOrType
 * @param {Object} attrs
 * @param {string|Array|Object} children
 * @returns {Object}
 */
function node(type, attrs, children) {
  var node = {
    __extag_node__: true
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
    throwError('First argument must be class, string or constructor.');
  }

  if (arguments.length === 2 && (Array.isArray(attrs) || typeof attrs !== 'object')) {
    children = attrs;
    attrs = null;
  }

  if (attrs) {
    if (attrs.xif) {
      node.xif = attrs.xif;
    }
    if (attrs.xfor) {
      node.xfor = attrs.xfor;
    }
    if (attrs.xkey) {
      node.xkey = attrs.xkey;
    }
    if (attrs.xname) {
      node.name = attrs.xname;
    }
    if (attrs.xtype && !node.type) {
      node.type = attrs.xtype;
    }
    // if (attrs.style) {
    //   node.style = attrs.style;
    // }
    // if (attrs.xattrs) {
    //   node.attrs = attrs.xattrs;
    // }
    // if (attrs.xclass) { // TODO: className
    //   node.classes = attrs.xclass;
    // }
    if (attrs.on) {
      node.events = attrs.on;
    }

    // node.directs = attrs.directs;

    var props = node.props = {};

    for (var key in attrs) {
      if (attrs.hasOwnProperty(key) && !RESERVED_PARAMS.hasOwnProperty(key)) {
        props[key] = attrs[key];
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

function createEvaluator(expr) {
  var type = typeof expr;
  if (type === 'string') {
    if (PROP_EXPR_REGEXP.test(expr)) {
      return new PropEvaluator(expr.trim());
    }
    return EvaluatorParser.parse(expr);
  } else if (type === 'function') {
    return new FuncEvaluator(expr);
  }
}

function createConverters(more) {
  var converters = [], type, expr, j, i;
  for (j = 0; j < more.length; ++j) {
    expr = more[j];
    type = typeof expr;
    if (type === 'string') {
      i = expr.indexOf('(');
      if (i > 0) {
        expr = expr.slice(0, i + 1) + 'arguments[arguments.length-1],' + expr.slice(i + 1);
      } else {
        expr = expr + '(arguments[arguments.length-1])';
      }
      converters.push(EvaluatorParser.parse(expr));
    } else if (type === 'function') {
      converters.push(new FuncEvaluator(expr));
    }
  }
  return converters;
}

/**
 * 
 * @param {string} type - binding type, one of '@', '+', '#', '@!', '@?', '@@'
 * @param {string|Function} base - base expression string or function
 * @param {Array} more - converters, every item just be like the param `base`. 
 *                       Or some expressions for type '#'. Or modifiers for type '+'.
 */
function expr(type, base/*, ...more*/) {
  var more = arguments.length > 2 ? slice(arguments, 2) : null;
  var mode;
  // if (typeof base === 'string') {
  //   base = base.trim();
  // }
  if (type[0] === '@') {
    switch (type) {
      case '@':
        mode = 1;
        break;
      case '@@':
        mode = 2;
        // TODO: check expr
        break;
      case '@!':
        mode = -1;
        break;
      case '@?':
        mode = 0;
        break;
      default:
        return;
    }
    return new Expression(DataBinding, {
      mode: mode,
      path: mode === 2 ? base.trim().replace(CONTEXT_REGEXP, '') : null,
      evaluator: createEvaluator(base),
      converters: more ? createConverters(more) : null
      // TODO: identifiers
    });
  } else if (type === '+') {
    if (typeof base === 'string' && HANDLER_REGEXP.test(base.trim())) {
      return new Expression(EventBinding, {
        handler: base.trim().replace(CONTEXT_REGEXP, ''),
        modifiers: more
      });
    } else {
      return new Expression(EventBinding, {
        evaluator: createEvaluator(base),
        modifiers: more
      });
    }
  } else if (type === '#') {
    if (more) {
      more.unshift(base);
    } else {
      more = [base];
    }
    return new Expression(FragmentBinding, more);
  }
}

var JSXParser = {
  node: node,
  expr: expr,
  parse: function(template, prototype) {
    var node = template(config.JSXEngine.node, expr);
    node.identifiers = [CONTEXT_SYMBOL];
    parseJsxNode(node, prototype);
    parseJsxChildren(node, prototype);

    if (node.type) {
      if (node.tag === 'x:frag') {
        node.type = null;
      } else if (node.tag === 'x:slot' || node.tag === 'x:view') {
        throwError(node.tag + ' can not be used as root tag of component template.')
      } else {
        throwError('component can not be used as root tag of another component template.')
      }
    } else if (node.xif || node.xfor || node.xkey) {
      throwError('`xif`, `xfor`, `xkey` can not be used on component template root tag.')
    }

    return node;
  }
}

config.JSXParser = JSXParser;

export default JSXParser