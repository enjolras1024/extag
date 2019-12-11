// src/core/template/evaluators/PropEvaluator.js

import { EMPTY_OBJECT } from 'src/share/constants'
import { defineClass } from 'src/share/functions'

/**
 * evaluator for expression like @{prop}, value@="prop"
 * @class
 * @constructor
 * @param {string} prop - property name
 */
function PropEvaluator(prop) {
  this.prop = prop;
}

defineClass({
  constructor: PropEvaluator,

  /**
   * connect this evaluator with component prototype and template identifiers
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   */
  connect: function(prototype, identifiers) {
    var resources = prototype.constructor.resources || EMPTY_OBJECT;
    var i = identifiers.indexOf(this.prop);
    if (i > 0) {
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
   * execute to evaluate
   * @param {Array} scopes  - scopes, the first one is the component whose template contains this evaluator, 
   *                          and the rest are iterator variable from x:for expression.
   */
  execute: function(scopes) {
    var ctx = scopes[0];
    var i = this.origin;
    if (i === 0) {
      return ctx[this.prop];
    } else if (i > 0) {
      return scopes[i]; // e.g. @{item} from x:for="item of items"
    } else if (i === -1) {
      var resources = ctx.constructor.resources;
      return resources && resources[this.prop];
    } else {
      return this.prop !== 'this' ? ctx[this.prop] : ctx;
    }
  }
});

export default PropEvaluator;