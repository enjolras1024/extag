// src/template/Expression.js

import { defineClass } from 'src/share/functions'

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
