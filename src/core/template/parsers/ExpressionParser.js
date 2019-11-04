import { CONTEXT_SYMBOL, BINDING_OPERATORS, ONE_WAY_BINDING_BRACKETS } from 'src/share/constants'
import { slice } from 'src/share/functions'
import DataBinding from 'src/core/bindings/DataBinding'
// import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import FragmentBinding  from 'src/core/bindings/FragmentBinding'
import Expression from 'src/core/template/Expression'
import FuncEvaluator from 'src/core/template/evaluators/FuncEvaluator';
import PropEvaluator from 'src/core/template/evaluators/PropEvaluator';
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

var PROP_EXPR_REGEXP = /^\s*[\$_a-zA-Z0-9]+\s*$/;
var CONTEXT_REGEXP = new RegExp('^' + CONTEXT_SYMBOL + '\\.');
var HANDLER_REGEXP = new RegExp('^(' + CONTEXT_SYMBOL + '\\.)?[\\w\\$\\_]+$');

function createEvaluator(expr) {
  var type = typeof expr === 'string' ;
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

var ExpressionParser = {
  /**
   * 
   * @param {string} type - binding type, one of '@', '+', '#', '@!', '@?', '@@'
   * @param {string|Function} base - base expression string or function
   * @param {Array} more - converters, every item just be like the param `base`. 
   *                       Or some expressions for type '#'. Or modifiers for type '+'.
   */
  parse: function(type, base/*, ...more*/) {
    var more = arguments.length > 2 ? slice(arguments, 2) : null;
    var mode;
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
        path: mode === 2 ? expr : null,
        evaluator: createEvaluator(base),
        converters: more ? createConverters(more) : null
        // TODO: identifiers
      });
    } else if (type === '+') {
      if (typeof base === 'string' && HANDLER_REGEXP.test(base)) {
        return new Expression(EventBinding, {
          handler: base.replace(CONTEXT_REGEXP, ''),
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
}

export default ExpressionParser