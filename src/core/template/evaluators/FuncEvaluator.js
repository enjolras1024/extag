// src/core/template/evaluators/FuncEvaluator.js

import { EMPTY_OBJECT } from 'src/share/constants'
import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

var PARAM_DELIMITER = /\s*\,\s*/g;
var SINGLE_PARAM_ARROW_REGEXP = /^\s*[\$-a-zA-Z0-9]+\s*=>/;

/**
 * @class
 * @constructor
 * @param {string|Function} expr 
 * @param {Array} params
 */
function FuncEvaluator(expr, params, origins) {
  if (typeof expr === 'string') {
    this.func = Function.apply(null, params.concat(['return ' + expr]));
    this.code = expr;
  } else {
    this.func = expr;
  }
  this.params = params;
  this.origins = origins;
}

defineClass({
  constructor: FuncEvaluator,

  /**
   * connect this evaluator with component prototype and template identifiers.
   * @param {Object} prototype 
   * @param {Array} identifiers 
   */
  connect: function(prototype, identifiers) {
    var resources = prototype.constructor.resources || EMPTY_OBJECT;
    var origins, params, param;
    // var paths = [];
    var i, j;
    // console.log(this.func.toString())
    if (!this.params) {
      var code = this.func.toString();
      if (!SINGLE_PARAM_ARROW_REGEXP.test(code)) {
        i = code.indexOf('(');
        j = code.indexOf(')', i + 1);
        this.params = code.slice(i + 1, j).trim().split(PARAM_DELIMITER);
      } else {
        i = code.indexOf('=>');
        this.params = [code.slice(0, i).trim()];
      }
    }
    if (!this.origins) {
      params = this.params;
      this.origins = origins = [];
      for (j = 0; j < params.length; ++j) {
        param = params[j];
        i = identifiers.indexOf(param);
        if (i > 0) {
          origins.push(i);
        } else if (param in prototype) {
          origins.push(0);
        } else if (param in resources) {
          origins.push(-1);
        } else {
          origins.push(-2);
        }
      }
    }
  },

  /**
   * @param {Array} scopes  - local varaibles
   * @param {*} value       - value returned by the prevoius evluator/converter in data-binding expression.
   */
  execute: function(scopes, value) {
    var args = [], ctx = scopes[0], param, i, j, n;
    for (j = 0, n = this.params.length; j < n; ++j) {
      param = this.params[j];
      i = this.origins[j];
      if (i === 0) {
        args.push(ctx[param]);
      } else if (i > 0) {
        args.push(scopes[i]);
      } else if (i === -1) {
        args.push(ctx.constructor.resources[param])
      } else {
        args.push(ctx[param]);
      }
    }

    if (arguments.length >= 2) {
      args.push(value);
    }

    if (__ENV__ === 'development') { 
      try {
        return this.func.apply(ctx, args);
      } catch (e) {
        var constructor = ctx.constructor;
        logger.warn('The expression `' + this.code + '` maybe illegal in the template of Component ' + (constructor.fullName || constructor.name));
        throw e;
      }
    } 
    return this.func.apply(ctx, args);
  }
});

export default FuncEvaluator;