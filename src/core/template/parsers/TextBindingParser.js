// src/core/template/parsers/FragmentBindingParser.js

import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import { BINDING_OPERATORS, BINDING_BRACKETS } from 'src/share/constants'
import { decodeHTML } from 'src/share/functions'

var LF_IN_BLANK = /\s*\n\s*/g;

var BINDING_LIKE_REGEXP = new RegExp(
  BINDING_OPERATORS.DATA +'\\' + BINDING_BRACKETS[0] + '(\\s|.)*?\\' + BINDING_BRACKETS[1]
);

export default {
  /**
   * check if the fragment expression contains `@{...}`
   * @param {string} expr - content of text node in template.
   */
  like: function like(expr) {
    return BINDING_LIKE_REGEXP.test(expr);
  },

  /**
   * parse an fragment expression that contains  `@{...}`
   * @param {string} expr - fragment expression that contains  `@{...}`
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   */
  parse: function(expr, prototype, identifiers) {
    var i, n, template = [], start = 0, stop;
    var b0, b1, b2, ct = 0, cc, cb;
    var pattern, text;
    for (i = 0, n = expr.length; i < n; ++i) {
      cb = cc;
      cc = expr.charCodeAt(i);
      if (b2) {
        if (cc === 125 && !b0 && !b1) { // }
          --ct;
          if (ct === 0) {
            if (start < stop) {
              text = expr.slice(start, stop)
              text = text.replace(LF_IN_BLANK, ' ');
              if (text) {
                text = decodeHTML(text);
                template.push(text);
              }
            }
            if (expr.charCodeAt(stop + 3) === 123 && expr.charCodeAt(i - 1) === 125) {
              // @{{...}}
              pattern = DataBindingParser.parse(expr.slice(stop + 3, i - 1), prototype, identifiers);
              pattern.target = 'frag';
            } else {
              // @{...}
              pattern = DataBindingParser.parse(expr.slice(stop + 2, i), prototype, identifiers);
              pattern.target = 'text';
            }
            template.push(pattern);
            start = stop = i + 1;
            b2 = false;
          }
        } else if (cc === 39) { // 39: '
          if (!b0) b0 = true; 
          else if (cb !== 92) b0 = false; // 92: \
        } else if (cc === 34) { // 34: "
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
      text = expr.slice(start, n)
      text = text.replace(LF_IN_BLANK, ' ');
      if (text) {
        text = decodeHTML(text);
        template.push(text);
      }
    }
    
    return template.length ? template : null;
  }
};
  