// src/core/template/parsers/EvaluatorParser.js

import Path from 'src/base/Path'
import { hasOwnProp, throwError } from 'src/share/functions'
import { WHITE_SPACE_REGEXP } from 'src/share/constants'
import Evaluator from 'src/core/template/Evaluator'

var DIVISION_REGEXP = /[\w).+\-_$\]]/;

var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield ' 
                  +  'isNaN isFinite parseFloat parseInt Array Date Infinity Math NaN Number Object String Boolean RegExp JSON';
var JS_KEYWORD_MAP = {};
(function() {
  var keywords = JS_KEYWORDS.split(/\s+/);
  for (var i = 0, n = keywords.length; i < n; ++i) {
    JS_KEYWORD_MAP[keywords[i]] = true;
  }
})();

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
        // if (space && !dot) {
        //   throwError("Unexpected token '" + expr[index] + "'.", {
        //     code: 1001, 
        //     expr: expr
        //   });
        // }
        if (space && !dot) {
          --index;
          break;
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

function skipToEnding(code, index, expr) {
  var n = expr.length;
  while (index < n) {
    if (expr.charCodeAt(index) === code 
        && expr.charCodeAt(index - 1) !== 92) { // 92: \
      return index;
    }
    ++index;
  }
  return n;
}

function getPropChainIndices(expr) {
  var cc, cb, cp;
  var indices = [];
  var n = expr.length, i = -1, j;
  while (i < n) {
    cb = cc;
    cc = expr.charCodeAt(i);
    if (cc === 32 || (cc >=9 && cc <= 13)) {
      ++i;
      continue;
    }
    switch (cc) {
      case 39: // 39: '
      case 34: // 34: "
        i = skipToEnding(cc, i + 1, expr);
        if (i === n) {
          throwError("Unclosed " + expr[i] + ".", {
            code: 1001, 
            expr: expr
          });
        }
        break;
      case 47: // 47: /, maybe regexp
        for (j = i - 1; j >= 0; --j) {
          cp = expr.charCodeAt(j);
          if (!(cp === 32 || (cp >=9 && cp <= 13))) {
            break;
          }
        }
        if (!cp || !DIVISION_REGEXP.test(String.fromCharCode(cp))) {
          i = skipToEnding(cc, i + 1, expr);
          if (i === n) {
            throwError("Unclosed " + expr[i] + ".", {
              code: 1001, 
              expr: expr
            });
          }
        }
        break;
      default:
        if (cb === 46) { // .e.g, "abc".toUpperCase(), /\d+/.test('123')
            i = skipToPathEnding(expr, i + 1);
            continue;
          } else if (isLegalVarStartCharCode(cc)) {
            j = skipToPathEnding(expr, i + 1); 
            if (expr.charCodeAt(j) !== 58) { // 58: :, not a property name of object
              indices.push(i, j);
            } else if (notPropertyName(expr, i - 1)) {
              indices.push(i, j);
            }
            i = j;
            continue;
          }
        break;
    }
    ++i;
  }
  return indices;
}

export default {
  /**
   * Parse an evaluator from string
   * @param {string} expr - e.g. "a + b" in @{a + b} or value@="a + b".
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   * @returns {PropEvaluator|FuncEvaluator}
   */
  parse: function parse(expr, prototype, identifiers) {
    var args = identifiers.slice(1);
    var expanded = 0, piece, path;
    var lines = [], i, j;
    // get start-index and stop-index of all prop chains, like `a` or `a.b.c`
    var indices = getPropChainIndices(expr);

    var resources = prototype.constructor.resources;

    for (j = 0; j < indices.length; j += 2) {
      if (indices[j+1] < 0) { continue; }
      piece = expr.slice(indices[j] + expanded, indices[j+1] + expanded);
      path = Path.parse(piece.replace(WHITE_SPACE_REGEXP, ''));
      if (hasOwnProp.call(JS_KEYWORD_MAP, path[0])) {
        continue;
      }
      i = identifiers.indexOf(path[0]);
      if (i < 0) {
        if (resources && hasOwnProp.call(resources, path[0])) {
          lines.push('var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
        } else {
          expr = expr.slice(0, indices[j] + expanded) + 'this.' + piece + expr.slice(indices[j+1] + expanded);
          expanded += 5;
        }
      } else {
        //
      }
    }

    lines.push('return ' + expr);
    args.push(lines.join('\n'));

    try {
      var func = Function.apply(null, args);
      return new Evaluator(func, arguments[0]);
    } catch (e) {
      throwError(e, {
        code: 1001,
        expr: arguments[0],
        desc: 'Illegal expression `' + arguments[0] + '`.'
      });
    }
  }
};
  