// src/core/bindings/ClassBinding.js

import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'

export default {
  evaluate: function evaluate(pattern, scopes) {
    var name, expr, cache = {};
    for (name in pattern) {
      expr = pattern[name];
      if (expr instanceof Expression) {
        expr = DataBinding.evaluate(expr.pattern, scopes);
      }
      cache[name] = expr;
    }
    return cache;
  }
}