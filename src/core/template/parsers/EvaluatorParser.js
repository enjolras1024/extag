// src/core/template/parsers/EvaluatorParser.js

import Path from 'src/base/Path'
import { WHITE_SPACES_REGEXP } from 'src/share/constants'
import { hasOwnProp, throwError } from 'src/share/functions'

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

function newParameter(expr, index) {
  var identifier = '$' + index;
  while (expr.indexOf(identifier) >= 0) {
    identifier = '$' + identifier;
  }
  return identifier;
}

function identifierIndexOf(identifier, identifiers) {
  for (var i = identifiers.length - 1; i >= 0; --i) {
    if (typeof identifiers[i] === 'string') {
      if (identifier === identifiers[i]) {
        return i;
      }
    } else { // array, like ['item', 'index'] from x:for="(item, index) of items"
      if (identifiers[i].indexOf(identifier) >= 0) {
        return i;
      }
    }
  }
  return -1;
}

function gotoPathEnding(expr, index) {
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

function gotoEnding(code, expr, index) {
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

function regexStarts(expr, index) {
  var cp;
  while (--index >= 0) {
    cp = expr.charCodeAt(index);
    if (!(cp === 32 || (cp >=9 && cp <= 13))) {
      break;
    }
  }
  return !cp || !DIVISION_REGEXP.test(String.fromCharCode(cp));
}

function getPropChainIndices(expr) {
  var cc, cb;
  var indices = [];
  var n = expr.length, i = 0, j;
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
        i = gotoEnding(cc, expr, i + 1);
        if (i === n) {
          throwError("Unclosed " + String.fromCharCode(cc) + " .", {
            code: 1001, 
            expr: expr
          });
        }
        break;
      case 47: // 47: /, maybe regexp
        if (regexStarts(expr, i)) {
          i = gotoEnding(cc, expr, i + 1);
          if (i === n) {
            throwError("Unclosed " + String.fromCharCode(cc) + " .", {
              code: 1001, 
              expr: expr
            });
          }
        }
        break;
      default:
        if (cb === 46) { // .e.g, "abc".toUpperCase(), /\d+/.test('123')
            i = gotoPathEnding(expr, i + 1);
            continue;
          } else if (isLegalVarStartCharCode(cc)) {
            j = gotoPathEnding(expr, i + 1); 
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

function makeEvaluator(parameters, lines, path, expr) {
  try {
    parameters.push(lines.join('\n'));
    var evaluator = Function.apply(null, parameters);
    if (path) {
      evaluator.path = path;
    }
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      evaluator.expr = expr;
    }
    return evaluator;
  } catch (e) {
    throwError(e, {
      code: 1001,
      expr: expr,
      desc: 'Illegal expression `' + expr + '`.'
    });
  }
}

export default {
  regexStarts: regexStarts,

  gotoEnding: gotoEnding,

  /**
   * Parse an evaluator from string
   * @param {string} expr - e.g. "a + b" in @{a + b} or value@="a + b".
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   * @param {string} wholeExpr
   * @returns {Function}
   */
  parse: function parse(expr, prototype, identifiers, wholeExpr) {
    var i, j;
    var lines = [];
    var parameters = [];
    for (i = 0; i < identifiers.length; ++i) {
      if (identifiers[i][0] === '$') { 
        parameters.push(identifiers[i]);
      } else {
        parameters.push(newParameter(expr, i));
      }
      
    }
    var varaibles = parameters.slice(0);

    var resources = prototype.constructor.resources;
    var path = Path.parse(expr);
    if (path && path.length) {
      if (!hasOwnProp.call(JS_KEYWORD_MAP, path[0]) || path[0] === 'this') {
        // path.from = identifiers.indexOf(path[0]);
        path.from = identifierIndexOf(path[0], identifiers);
        if (path.from < 0) {
          if (resources && hasOwnProp.call(resources, path[0])) {
            lines.push('var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
          } else {
            path.unshift('this');
            path.from = 0;
          }
        } else {
          if (typeof identifiers[path.from] !== 'string') {
            path.unshift(parameters[path.from]);
          }
        }
        lines.push('return ' + path.join('.'));
        // return new PathEvaluator(path, expr, identifiers);
        return makeEvaluator(parameters, lines, path, wholeExpr);
      }
    }

    var expanded = 0, piece;
    // get start-index and stop-index of all prop chains, like `a` or `a.b.c`
    var indices = getPropChainIndices(expr);

    for (j = 0; j < indices.length; j += 2) {
      if (indices[j+1] < 0) { continue; }
      piece = expr.slice(indices[j] + expanded, indices[j+1] + expanded);
      path = Path.parse(piece.replace(WHITE_SPACES_REGEXP, ''));
      if (hasOwnProp.call(JS_KEYWORD_MAP, path[0])) {
        continue;
      }
      
      i = identifierIndexOf(path[0], identifiers);
      if (i < 0) {
        if (resources && hasOwnProp.call(resources, path[0])) {
          lines.push('var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
          varaibles.push(path[0]);
        } else {
          expr = expr.slice(0, indices[j] + expanded) + 'this.' + piece + expr.slice(indices[j+1] + expanded);
          expanded += 5;
        }
      } else if (typeof identifiers[i] !== 'string') {
        // array, like ['item', 'index'] from x:for="(item, index) of items"
        expr = expr.slice(0, indices[j] + expanded) + parameters[i] + '.' + piece + expr.slice(indices[j+1] + expanded);
        expanded += parameters[i].length + 1;
      }
    }

    lines.push('return ' + expr);

    return makeEvaluator(parameters, lines, null, wholeExpr);
  }
};
  