// src/core/template/evaluators/PropEvaluator.js

import { EMPTY_OBJECT } from 'src/share/constants'
import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

/**
 * for @{prop}, value@="prop"
 * @class
 * @constructor
 * @param {string} prop 
 */
function PropEvaluator(prop) {  // property paths appeared in this evaluator
  this.prop = prop;
}

defineClass({
  constructor: PropEvaluator,

  /**
   * compile this evaluator with component prototype and template identifiers
   * @param {Object} prototype 
   * @param {Array} identifiers 
   */
  compile: function(prototype, identifiers) {
    var resources = prototype.constructor.resources || EMPTY_OBJECT;
    var i = identifiers.indexOf(this.prop);
    if (i >= 0) {
      this.origin = i;
    } else if (this.prop in prototype) {
      this.origin = 0
    } else if (this.prop in resources) {
      this.origin = -1;
    } else {
      this.origin = -2;
    }
  },

  /**
   * @param {Array} scopes  - local varaibles
   * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
   */
  execute: function(scopes, value) {
    var ctx = scopes[0];
    var i = this.origin;
    if (i === 0) {
      return ctx[this.prop];
    } else if (i > 0) {
      return scopes[i];
    } else if (i === -1) {
      return ctx.constructor.resources[this.prop];
    }
  }
});

export default PropEvaluator;