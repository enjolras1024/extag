// src/template/Expression.js

import { defineClass } from 'src/share/functions'

/**
 * Expression parsed from 'checked@="selected"' and so on, in the component pattern.
 * 
 * @class
 * @constructor
 * @param {Object} binding
 * @param {Object} pattern
 */
export default function Expression(binding, pattern) {
  this.binding = binding;
  this.pattern = pattern;
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
    var evaluator = this.pattern.evaluator;
    var converters = this.pattern.converters;
    if (evaluator) {
      evaluator.connect(prototype, identifiers);
    } 
    if (converters) {
      for (var i = 0; i < converters.length; ++i) {
        converters[i].connect(prototype, identifiers);
      }
    }
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
