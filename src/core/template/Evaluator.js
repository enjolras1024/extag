// src/base/Evaluator.js

import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

/**
 * @class
 * @constructor
 * @param {Object} template 
 */
export default function Evaluator(template) {
  this.paths = template.paths;  // property paths appeared in this evaluator
  this.func = template.func;    // function to be applied
  // this.args = template.args;    // arguments
}

defineClass({
  constructor: Evaluator,

  /**
   * @param {Array} scopes  - local varaibles
   * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
   */
  compile: function(scopes, value) {
    var args;
    if (arguments.length > 1) {
      args = scopes.slice(0);
      args[0] = value;
    } else {
      args = scopes;
    }
    if (__ENV__ === 'development') { 
      try {
        return this.func.apply(scopes[0], args);
      } catch (e) {
        var constructor = scopes[0].constructor;
        logger.warn('The expression `' + this.expr + '` maybe illegal in the template of Component ' + (constructor.fullName || constructor.name));
        throw e;
      }
    } 
    return this.func.apply(scopes[0], args);
  }
});