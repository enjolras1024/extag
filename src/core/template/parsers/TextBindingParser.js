// src/core/template/parsers/FragmentBindingParser.js

import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import { BINDING_OPERATORS, BINDING_BRACKETS } from 'src/share/constants'
import { throwError, decodeHTML } from 'src/share/functions'

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
  parse: function parse(expr, prototype, identifiers) {
    var template = [], start = 0, stop;
    var n = expr.length, i = 0;
    var cc, cb, ct = 0, b2;
    var pattern, text;
    while (i < n) {
      cb = cc;
      cc = expr.charCodeAt(i);
      switch (cc) {
        case 125: // 125: }
          if (b2) {
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
              if (expr.charCodeAt(stop + 2) === 123 && expr.charCodeAt(i - 1) === 125) {
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
          }
          break;
        case 123: // 123: {
          if (b2) {
            if (cb === 64) {
              throwError("Unclosed @{ .", {
                code: 1001, 
                expr: expr
              });
            }
            ++ct;
          } else {
            if (cb === 64) { // 64: @
              stop = i - 1;
              b2 = true;
              ct = 1;
            }
          }
          break;
        case 39: // 39: '
        case 34: // 34: "
          i = EvaluatorParser.gotoEnding(cc, expr, i + 1);
          if (i === n) {
            throwError("Unclosed " + String.fromCharCode(cc) + " .", {
              code: 1001, 
              expr: expr
            });
          }
          break;
      case 47: // 47: /, maybe regexp
        if (EvaluatorParser.regexStarts(expr, i)) {
          i = EvaluatorParser.gotoEnding(cc, expr, i + 1);
          if (i === n) {
            throwError("Unclosed " + String.fromCharCode(cc) + " .", {
              code: 1001, 
              expr: expr
            });
          }
        }
        break;
      }

      ++i;
    }

    if (b2) {
      throwError("Unclosed @{ .", {
        code: 1001, 
        expr: expr
      });
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
  