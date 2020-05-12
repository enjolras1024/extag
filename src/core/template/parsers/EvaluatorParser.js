// src/core/template/parsers/EvaluatorParser.js

import Path from 'src/base/Path'
import { hasOwnProp, throwError } from 'src/share/functions'
import { 
  EMPTY_OBJECT,
  // PROP_EXPR_REGEXP,
  WHITE_SPACE_REGEXP
 } from 'src/share/constants'
import Evaluator from 'src/core/template/Evaluator'

var DIVISION_REGEXP = /[\w).+\-_$\]]/;

var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield Array Date Infinity Math NaN Number Object String Boolean';
var JS_KEYWORD_MAP = {};
(function() {
  var keywords = JS_KEYWORDS.split(/\s+/);
  for (var i = 0, n = keywords.length; i < n; ++i) {
    JS_KEYWORD_MAP[keywords[i]] = true;
  }
})();

// function skipWhiteSpace(expr, index) {
//   var cc, length = expr.length;
//   while (index < length) {
//     cc = expr.charCodeAt(index);
//     //    \             \f\n\r\t\v
//     if (!(cc === 32 || (cc >=9 && cc <= 13))) {
//       break;
//     }
//     ++index;
//   }
//   return index;
// }

function notPropertyName(expr, index) {
  var cc, length = expr.length;
  while (index < length) {
    cc = expr.charCodeAt(index);
    //    \             \f\n\r\t\v
    if (!(cc === 32 || (cc >=9 && cc <= 13))) {
      return cc !== 44 && cc !== 123; // not ',' and '{'
    }
    --index;
  }
}

function skipToPathEnding(expr, index) {
  var cc, dot, space, length = expr.length;
  while (index < length) {
    cc = expr.charCodeAt(index);
    if (cc === 32 || (cc >=9 && cc <= 13)) {
      space = true;
      ++index;
      continue;
    }
    if (cc === 46) {
      if (dot) {
        throwError("Unexpected token '.'.", {
          code: 1001, 
          expr: expr
        });
      }
      space = false;
      dot = true;
    } else {
      if (!isLegalVarStartCharCode(cc) && !(cc >= 48 && cc <= 57)) {
        if (dot) {
          throwError("Unexpected token '" + expr[index] + "'.", {
            code: 1001, 
            expr: expr
          });
        }
        break;
      } else {
        if (space && !dot) {
          throwError("Unexpected token '" + expr[index] + "'.", {
            code: 1001, 
            expr: expr
          });
        }
      }
      space = false;
      dot = false;
    }
    ++index;
  }
  return index;
}

function isLegalVarStartCharCode(cc) {
  //       a-z                       A-Z                       _            $
  return  (cc >= 97 && cc <= 122) || (cc >= 65 && cc <= 90) || cc === 95 || cc === 36;
}

function getIdentifierIndices(expr) {
  var indices = [];
  var b0, b1, b2, cb, cc;
  var n = expr.length, i = 0, j;
  while(i < n) {
    cb = cc;
    cc = expr.charCodeAt(i);
    switch (cc) {
      case 39: // 39: '
        if (!b0) { b0 = true; } 
        else if (cb !== 92) { b0 = false; }// 92: \
        break;
      case 34: // 34: "
        if (!b1) { b1 = true; } 
        else if (cb !== 92) { b1 = false; } // 92: \
        break;
      case 47: // 47: /, maybe regexp
        if (!b2) {
          var cp;
          for (; j >= 0; --j) {
            cp = expr.charCodeAt(j);
            if (!(cp === 32 || (cp >=9 && cp <= 13))) {
              break;
            }
          }
          if (!cp || !DIVISION_REGEXP.test(cp)) {
            b2 = true;
          }
        } else if (cb !== 92) { b2 = false; }
        break;
      // TODO: ``
      default:
        if (!b0 && !b1 && !b2 && cb !== 46 && isLegalVarStartCharCode(cc)) {
          j = skipToPathEnding(expr, i + 1); 
          cc = expr.charCodeAt(j);
          if (cc !== 58) { // 58: :, not a property name of object
            indices.push(i, j);
          } else if (notPropertyName(expr, i - 1)) {
            indices.push(i, j);
          }
          i = j;
        }
        break;
    }
    ++i;
  }
  
  return indices;
}

export default {
  /**
   * @param {string} expr - e.g. "a + b" in @{a + b} or value@="a + b".
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   * @returns {PropEvaluator|FuncEvaluator}
   */
  parse: function parse(expr, prototype, identifiers) {
    var args = identifiers.slice(1);
    var expanded = 0, piece, path;
    var lines = [], i, j;
    // if (PROP_EXPR_REGEXP.test(expr)) {
    //   evaluator = new PropEvaluator(expr.trim());
    //   if (prototype && identifiers) {
    //     evaluator.connect(prototype, identifiers);
    //   }
    //   return evaluator;
    // }

    var indices = getIdentifierIndices(expr);

    var resources = prototype.constructor.resources || EMPTY_OBJECT;

    for (j = 0; j < indices.length; j += 2) {
      if (indices[j+1] < 0) { continue; }
      piece = expr.slice(indices[j] + expanded, indices[j+1] + expanded);
      path = Path.parse(piece.replace(WHITE_SPACE_REGEXP, ''));
      if (hasOwnProp.call(JS_KEYWORD_MAP, path[0])) {
        continue;
      }
      i = identifiers.indexOf(path[0]);
      if (i < 0) {
        if (path[0] in resources) {
          lines.push('var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
        } else {
          expr = expr.slice(0, indices[j] + expanded) + 'this.' + piece + expr.slice(indices[j+1] + expanded);
          expanded += 5;
        }
      } 
    }

    lines.push('return ' + expr);
    args.push(lines.join('\n'));

    try {
      var func = Function.apply(null, args);
      return new Evaluator(func, expr);
    } catch (e) {
      throwError(e, {
        code: 1001,
        expr: arguments[0],
        desc: 'Illegal expression `' + arguments[0] + '`.'
      });
    }
  }
};
  