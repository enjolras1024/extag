// src/template/Expression.js

import { defineClass } from 'src/share/functions'
import { 
  CONTEXT_REGEXP,
  HANDLER_REGEXP,
  CAPITAL_REGEXP,
  PROP_EXPR_REGEXP
 } from 'src/share/constants'
//  import FuncEvaluator from 'src/core/template/evaluators/FuncEvaluator';
// import PropEvaluator from 'src/core/template/evaluators/PropEvaluator';
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import Evaluator from 'src/core/template/Evaluator';

function parseEvaluator(expr, prototype, identifiers) {
  var type = typeof expr;
  if (type === 'string') {
    // if (PROP_EXPR_REGEXP.test(expr)) {
    //   return new PropEvaluator(expr.trim());
    // }
    return EvaluatorParser.parse(expr, prototype, identifiers);
  } else if (type === 'function') {
    // var evaluator = new FuncEvaluator(expr);
    // evaluator.connect(prototype, identifiers);
    // return evaluator;
    return new Evaluator(expr, null);
  }
}

/**
 * Expression parsed from 'checked@="selected"' and so on, in the component pattern.
 * 
 * @class
 * @constructor
 * @param {Object} binding
 * @param {Object} pattern
 */
export default function Expression(binding, pattern, unparsed) {
  this.binding = binding;
  this.pattern = pattern;
  this.unparsed = unparsed;
}

defineClass({
  constructor: Expression,
  statics: {
    /**
     * Factory method
     *  @param {Object} binding
      * @param {Object} pattern
      */
    // create: function(binding, pattern) {
    //   return new Expression(binding, pattern);
    // },
    // /**
    //  * Compile all expressions related to the target in the scope.
    //  * @param {Object} expressions  - all expressions
    //  * @param {Object} target       - the target that is related to the expressions
    //  * @param {Object} scope        - the scope where the target is located
    //  * @param {Array}  locals       - some other local varibles
    //  */
    // compile: function(expressions, target, scope, locals) {  
    //   var key, expression;
    //   for (key in expressions) {
    //     if (expressions.hasOwnProperty(key)) {
    //       expression = expressions[key];
    //       expression.compile(key, target, scope, locals);
    //     }
    //   }
    // }
  },
  connect: function(prototype, identifiers) {
    if (!this.unparsed) {
      return;
    }
    var pattern = this.pattern;
    var evaluator = pattern.evaluator;
    var converters = pattern.converters;
    if (evaluator) {
      // evaluator.connect(prototype, identifiers);
      pattern.evaluator = parseEvaluator(evaluator, prototype, identifiers);
    } 
    if (converters) {
      for (var i = 0; i < converters.length; ++i) {
        // converters[i].connect(prototype, identifiers);
        pattern.converters[i] = parseEvaluator(converters[i], prototype, identifiers);
      }
    }
    this.unparsed = false;
  },
  /**
   * Compile this expression related to the target in the scope.
   * @param {Object} property - the target property
   * @param {Object} target   - the target that is related to the expressions
   * @param {Object} scope    - the scope where the target is located
   * @param {Array}  locals   - some other local varibles
   */
  compile: function(property, target, scopes) {
    return this.binding.compile(this.pattern, property, target, scopes);
  }
});
