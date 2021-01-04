// src/core/template/parsers/ClassStyleParser.js

import PrimitiveLiteralParser from 'src/core/template/parsers/PrimitiveLiteralParser'
import TextBindingParser from 'src/core/template/parsers/TextBindingParser'
import TextBinding from 'src/core/bindings/TextBinding'
import Expression from 'src/core/template/Expression'
import { 
  throwError
} from 'src/share/functions'
import { 
  BINDING_FORMAT,
  // BINDING_BRACKETS,
  // BINDING_OPERATORS, 
  WHITE_SPACES_REGEXP
} from 'src/share/constants'

var STYLE_DELIMITER = /;/g;
var CSS_NAME_REGEXP = /^[a-z0-9\-_]+$/i;

export default {
  /**
   * parse x:class="..." and x:style="..."
   * @param {string} expr - e.g. "a b; c@: active;" for x:class, 
   *                              and "display: none; font-size#:@{fontSize}px;" for x:style
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   * @param {boolean} forStyle  - 
   */
  parse: function parse(expr, prototype, identifiers, forStyle) {
    var group = {};
    var pieces = expr.split(STYLE_DELIMITER); 
    var result, piece, name, names, n, i, j, k;

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

      if (!name || !CSS_NAME_REGEXP.test(name)) {
        throwError('Illegal ' + (forStyle ? 'x:style' : 'x:class') + ' expression.', {
          code: 1001,
          expr: name || arguments[0]
        });
      }

      try {
        if (!TextBindingParser.like(expr)) {
          group[name] = forStyle ? expr : PrimitiveLiteralParser.tryParse(expr);
          continue;
        }
        result = TextBindingParser.parse(expr, prototype, identifiers);
      } catch (e) {
        // eslint-disable-next-line no-undef
        {
          if (e.code === 1001) {
            e.expr = BINDING_FORMAT.replace('0', e.expr);
          }
        }
        throw e;
      }
      if (result) {
        if (result.length === 1) {
          group[name] = result[0];
        } else if (forStyle) {
          group[name] = new Expression(TextBinding, result);
        } else {
          throwError('Illegal x:class expression.', {
            code: 1001,
            expr: expr
          });
        }
      } else {
        group[name] = forStyle ? expr : PrimitiveLiteralParser.tryParse(expr);
      }
    }

    return group;
  }
}