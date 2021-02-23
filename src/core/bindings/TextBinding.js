// src/core/bindings/TextBinding.js

import Expression from 'src/core/template/Expression'

export default {
  evaluate: function evaluate(pattern, scopes) {
    var i, n, expr, cache = [];

    for (i = 0, n = pattern.length; i < n; ++i) {
      expr = pattern[i];
      if (expr instanceof Expression) {
        expr = expr.evaluate(scopes);
      }
      cache.push(expr);
    }

    return cache.join('');
  }
}