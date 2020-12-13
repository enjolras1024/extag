// src/core/template/FuncEvaluator.js

import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

/**
 * @class
 * @constructor
 * @param {Function} func 
 * @param {string} expr
 */
export default function FuncEvaluator(func, expr) {
  this.func = func;    // function to be applied
  this.expr = expr;
}

defineClass({
  constructor: FuncEvaluator,

  /**
   * @param {Array} scopes  - local varaibles
   * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
   */
  execute: function execute(scopes, value) {
    var args = scopes;
    if (arguments.length > 1) {
      args = scopes.slice(0);
      args.push(value);
    }
    
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') { 
      try {
        return this.func.apply(scopes[0], args);
      } catch (e) {
        var constructor = scopes[0].constructor;
        logger.warn('The expression `' + (this.expr || this.func.toString()) + 
                    '` maybe illegal in the template of component ' + (constructor.fullname || constructor.name));
        throw e;
      }
    } else {
      return this.func.apply(scopes[0], args);
    }
  }
});