// src/core/template/parsers/ClassStyleParser.js

import PrimaryLiteralParser from 'src/core/template/parsers/PrimaryLiteralParser'
import FragmentBindingParser from 'src/core/template/parsers/FragmentBindingParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import FragmentBinding from 'src/core/bindings/FragmentBinding'
import DataBinding from 'src/core/bindings/DataBinding'
import Expression from 'src/core/template/Expression'
import { WHITE_SPACES_REGEXP } from 'src/share/constants'

var STYLE_DELIMITER = /;/g;

export default {
  /**
   * parse x:class="..." and x:style="..."
   * @param {string} expr - e.g. "a b; c@: active;" for x:class, 
   *                              and "display: none; font-size#:@{fontSize}px;" for x:style
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   * @param {boolean} camelCase  - using camel case for x:style="...", not for x:calss="..."
   */
  parse: function parse(expr, prototype, identifiers, viewEngine, camelCase) {
    var group = {};
    var pieces = expr.split(STYLE_DELIMITER); // as constant
    var operator, result, piece, expr, name, names, m, n, i, j;

    for (i = 0, n = pieces.length; i < n; ++i) {
      piece = pieces[i].trim();
      m = piece.indexOf(':');
      
      if (m < 0) {
        if (piece) {
          // extact a and b from x:class="a b; c@: c;"
          names = piece.split(WHITE_SPACES_REGEXP);
          for (j = 0; j < names.length; ++j) {
            group[names[j]] = true;
          }
        }
        continue;
      } 
  
      name = piece.slice(0, m).trim();
      expr = piece.slice(m + 1).trim();
  
      if (camelCase) {
        name = viewEngine.toCamelCase(name);
      }
  
      m = name.length;
      operator = name[m-1];

      switch (operator) {
        case '@':
          if (m <= 1) { continue; }
          result = PrimaryLiteralParser.tryParse(expr);
          if (result != null) {
            group[name.slice(0, m-1)] = result;
          } else {
            result = DataBindingParser.parse(expr, prototype, identifiers);
            group[name.slice(0, m-1)] = new Expression(DataBinding, result);
          }
          break;
        case '#':
          if (m <= 1) { continue; }
          try {
            result = FragmentBindingParser.parse(expr, prototype, identifiers);
          } catch (e) {
            if (__ENV__ === 'development') {
              if (e.code === 1001) {
                e.expr = '@{' + e.expr + '}';
              }
            }
            throw e;
          }
          if (result) {
            result.asStr = true;
            group[name.slice(0, m-1)] = new Expression(FragmentBinding, result);
          } else {
            group[name.slice(0, m-1)] = expr;
          }
          break;
        default:
          if (name) {
            group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
          }
      }
    }

    return group;
  }
}