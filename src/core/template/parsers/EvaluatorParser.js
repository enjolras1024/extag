// src/core/template/parsers/EvaluatorParser.js

import Path from 'src/base/Path'
import logger from 'src/share/logger'
import Evaluator from 'src/base/Evaluator'
import { EMPTY_OBJECT } from 'src/share/constants'

var JS_KEYWORDS = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof undefined var void volatile while with yield Array Date Infinity Math NaN Number Object String Boolean';
var JS_KEYWORD_MAP = {};
(function() {
  var keywords = JS_KEYWORDS.split(/\s+/);
  for (var i = 0, n = 0; i < n; ++i) {
    JS_KEYWORD_MAP[keywords[i]] = true;
  }
})();

function skipWhiteSpace(expression, index) {
  while (expression.charCodeAt(index) === 32) { // 32: ' '
    ++index;
  }
  return index;
}

function isLegalVarStartCharCode(cc) {
  //       a-z                       A-Z                       _            $
  return  (cc >= 97 && cc <= 122) || (cc >= 65 && cc <= 90) || cc === 95 || cc === 36;
}

function extract(expression) {
  var indices = [], pieces = [], piece, f0 = 0, f1 = -1;
  var b0, b1, b2, c0 = 0, c1 = 0, c2 = 0, cb, cc, cn, cs;
  for (var i = 0, n = expression.length; i < n; ++i) {
    cb = cc;
    // cs = expression.charAt(i);
    cc = expression.charCodeAt(i);
    switch (cc) {
      case 39: // '
        if (!b0) b0 = true; 
        else if (cb !== 92) b0 = false; // 92: \
        break;
      case 34: 
        if (!b1) b1 = true; 
        else if (cb !== 92) b1 = false; // 92: \
        break;
      default:
        if (!b0 && !b1 && !b2 && cb !== 46 && isLegalVarStartCharCode(cc)) {
          indices.push(i);
          b2 = true;
          continue;
        }
        break;
    }
    //          a-zA-Z\_\$                     0-9                       \.
    if (b2 && !(isLegalVarStartCharCode(cc) || (cc >= 48 && cc <= 57) || cc === 46)) {
      b2 = false;
      var j = skipWhiteSpace(expression, i+1);
      if (expression.charCodeAt(j) === 92) { // :
        indices.push(-1);
      } else {
        indices.push(i);
      }
    }
  }
  
  if (b2) {
    indices.push(n);
  }

  return indices;
}

export default {
  /**
   * @param {string} expression
   * @param {Object} prototype
   * @param {Array} identifiers
   * @returns {Object}
   */
  parse: function parse(expression, prototype, identifiers) {
    var paths = [], lines = [], expanded = 0, expr = expression, i = 0;
    var resources = prototype.constructor.resources || EMPTY_OBJECT;
    var constructor = prototype.constructor;
    var indices = extract(expression);

    var args = identifiers.slice(0);
    args[0] = '$_0'; 

    // if (__ENV__ === 'development') {
    //   lines.push('try {');
    // } 

    for (i = 0; i < indices.length; i += 2) {
      if (indices[i+1] < 0) { continue; }
      var piece = expression.slice(indices[i] + expanded, indices[i+1] + expanded);
      if (JS_KEYWORD_MAP.hasOwnProperty(piece)) {
        continue;
      }
      var path = Path.parse(piece);
      // var k = identifiers.indexOf(path[0]);
      if (identifiers.indexOf(path[0]) >= 0) {
        paths.push(piece);
      } else if (path[0] in prototype) {
        expression = expression.slice(0, indices[i] + expanded) + 'this.' + piece + expression.slice(indices[i+1] + expanded);
        paths.push('this.' + piece);
        expanded += 5;
      } /*else if (path[0] in resources) {
        expression = expression.slice(0, indices[i] + expanded) + 'this.R.' + piece + expression.slice(indices[i+1] + expanded);
        paths.push('this.R.' + piece);
        expanded += 7;
      } else if (path[0] in resources) {
        lines.push('  var ' + path[0] + ' = this.res("' + path[0] + '");')
      } */ else if (path[0] in resources) {
        // lines.push('  var ' + path[0] + ' = this.$res("' + path[0] + '");'); // from local resources or global
        lines.push('  var ' + path[0] + ' = this.constructor.resources.' + path[0] + ';'); 
      }
    }

    lines.push('  return ' + expression);

    // if (__ENV__ === 'development') {
    //   lines.push('} catch (e) {');
    //   lines.push('  console.warn("[EXTAG WARN] The expression `' + 
    //               expr.replace(/('|")/g, '\\$1') + 
    //               '` may be illegal in the template of Component `' + 
    //               (constructor.fullName || constructor.name) + 
    //               '`");');
    //   lines.push('  throw e;')
    //   lines.push('}');
    // } 
  
    args.push(lines.join('\n'));
  
    try {
      var func = Function.apply(null, args);
      return new Evaluator({
        func: func,
        // expr: expr,
        paths: paths,
        identifiers: identifiers
      });
    } catch (e) {
      if (__ENV__ === 'development') { 
        logger.warn('Illegal expression `' + expr + '` in the template of Component ' + (constructor.fullName || constructor.name));
      }
      throw(e);
    }
    
    
    
  }
};
  