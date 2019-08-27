// src/core/template/parsers/FragmentBindingParser.js

import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import { BINDING_OPERATORS, ONE_WAY_BINDING_BRACKETS } from 'src/share/constants'

var BINDING_LIKE_REGEXP = new RegExp(
  BINDING_OPERATORS.DATA +'\\' + ONE_WAY_BINDING_BRACKETS[0] + '.*?\\' + ONE_WAY_BINDING_BRACKETS[1]
);

export default {
  like: function like(expression) {
    return BINDING_LIKE_REGEXP.test(expression);
  },

  parse: function(expression, prototype, identifiers) {
    var i, j, n, template = [], start = 0, stop;
    var b0, b1, b2, ct = 0, cc, cb;

    for (i = 0, n = expression.length; i < n; ++i) {
      cb = cc;
      cc = expression.charCodeAt(i);
      if (b2) {
        if (cc === 125 && !b0 && !b1) { // }
          --ct;
          if (ct === 0) {
            if (start < stop) {
              template.push(expression.slice(start, stop));
            }
            template.push(
              // DataBindingParser.parse(expression.slice(stop+2, i), prototype, identifiers)
              new Expression(DataBinding, DataBindingParser.parse(expression.slice(stop+2, i), prototype, identifiers))
            );
            start = stop = i + 1;
            b2 = false;
          }
        } else if (cc === 39) {
          if (!b0) b0 = true; 
          else if (cb !== 92) b0 = false; // 92: \
        } else if (cc === 34) {
          if (!b1) b1 = true; 
          else if (cb !== 92) b1 = false; // 92: \
        } else if (cc === 123 && !b0 && !b1) {
          ++ct;
        } 
      } else if (cb === 64 && cc === 123) { // @{
        b2 = true;
        stop = i-1; 
        ct = 1;
      }
    }

    if (0 < start && start < n) {
      template.push(expression.slice(start, n));
    }
    
    return template.length ? template : null;
  }
};
  