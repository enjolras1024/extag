// src/core/template/parsers/ClassStyleParser.js

import PrimaryLiteralParser from 'src/core/template/parsers/PrimaryLiteralParser'
import FragmentBindingParser from 'src/core/template/parsers/FragmentBindingParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import FragmentBinding from 'src/core/bindings/FragmentBinding'
import DataBinding from 'src/core/bindings/DataBinding'
import Expression from 'src/core/template/Expression'
import { throwError } from 'src/share/functions'
import { 
  BINDING_FORMAT,
  BINDING_OPERATORS, 
  WHITE_SPACES_REGEXP, 
  ONE_WAY_BINDING_BRACKETS 
} from 'src/share/constants'

var STYLE_DELIMITER = /;/g;
var CSS_NAME_REGEXP = /^[a-z0-9\-\_]+$/i;
// var SINGLE_BINDING_REGEXP = /^@\{[^@]*\}$/;
var SINGLE_BINDING_REGEXP = new RegExp(
  '^' + BINDING_OPERATORS.DATA +'\\' + ONE_WAY_BINDING_BRACKETS[0] + '[^' + BINDING_OPERATORS.DATA + ']*\\' + ONE_WAY_BINDING_BRACKETS[1] + '$'
);

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
    var pieces = expr.split(STYLE_DELIMITER); 
    var result, piece, expr, name, names, n, i, j, k;

    for (i = 0, n = pieces.length; i < n; ++i) {
      piece = pieces[i].trim();
      k = piece.indexOf(':');
      
      if (k < 0) {
        piece = piece.trim();
        if (piece) {
          // extact a and b from x:class="a b; c: @{c};"
          names = piece.split(WHITE_SPACES_REGEXP);
          for (j = 0; j < names.length; ++j) {
            group[names[j]] = true;
          }
        }
        continue;
      } 
  
      name = piece.slice(0, k).trim();
      expr = piece.slice(k + 1).trim();
  
      // if (!/[\_\-a-z0-9]/i.test(name)) {
      if (!name || !CSS_NAME_REGEXP.test(name)) {
        throwError('Illegal ' + (camelCase ? 'x:style' : 'x:class') + ' expression.', {
          code: 1001,
          expr: name || arguments[0]
        });
      }
      if (camelCase) {
        name = viewEngine.toCamelCase(name);
      }

      try {
        if (!FragmentBindingParser.like(expr)) {
          group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
          continue;
        }
        if (SINGLE_BINDING_REGEXP.test(expr)) {
          result = DataBindingParser.parse(expr.slice(2, expr.length-1), prototype, identifiers);
          group[name] = new Expression(DataBinding, result);
          continue;
        }
        result = FragmentBindingParser.parse(expr, prototype, identifiers);
      } catch (e) {
        if (__ENV__ === 'development') {
          if (e.code === 1001) {
            e.expr = BINDING_FORMAT.replace('0', e.expr);
          }
        }
        throw e;
      }
      if (result) {
        if (result.length === 1 && (result[0] instanceof Expression)) {
          group[name] = result[0]
        } else if (camelCase) {
          result.asStr = true;
          group[name] = new Expression(FragmentBinding, result);
        } else {
          throwError('Illegal x:class expression.', {
            code: 1001,
            expr: expr
          });
        }
      } else {
        group[name] = camelCase ? expr : PrimaryLiteralParser.tryParse(expr);
      }
    }

    return group;
  }
}