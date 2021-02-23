// src/template/Expression.js

import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

/**
 * Expression parsed from some piece, like 'title@="title"' or '@{label}', in the component template.
 * 
 * @class
 * @constructor
 * @param {Object} binding  One of DataBinding, EventBinding or FragmentBinding
 * @param {Object} pattern  will be used by different type of binding
 */
export default function Expression(binding, pattern) {
  this.binding = binding;
  this.pattern = pattern;
}

defineClass({
  constructor: Expression,
  /**
   * Connect this expression to the target in the scopes.
   * @param {Object} property - the target property or event
   * @param {Object} target   - the target related to this expression
   * @param {Object} scopes   - the scopes where this expression is located
   */
  connect: function(property, target, scopes) {
    var binding = this.binding.create(this.pattern);
    binding.connect(property, target, scopes);
  },

  evaluate: function evaluate(scopes) {
    return this.binding.evaluate(this.pattern, scopes);
  }
});