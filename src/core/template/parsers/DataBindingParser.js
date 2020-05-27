// src/core/template/parsers/DataBindingParser.js

import Path from 'src/base/Path'
import { throwError } from 'src/share/functions'
import { BINDING_OPERATORS } from 'src/share/constants'
import DataBinding from 'src/core/bindings/DataBinding'
import Evaluator from 'src/core/template/Evaluator'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

var DATA_BINDING_MODES = DataBinding.MODES;

function newIdentifier(expr, identifiers) {
  var identifier = '$' + identifiers.length;
  while (expr.indexOf(identifier) >= 0) {
    identifier = '$' + identifier;
  }
  return identifier;
}

export default {
  /**
   * Parse data-binding expression
   * @param {string} expr - e.g. "text |=upper" in @{text |=upper} or value@="text |=upper".
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is an iterator from x:for expression.
   * @returns {*}
   */
  parse: function parse(expr, prototype, identifiers) {
    var mode = -1, n = expr.length, i;

    if (expr[0] === BINDING_OPERATORS.TWO_WAY) {              // <text-box model@="@text"/>
      mode = DATA_BINDING_MODES.TWO_WAY;
      expr = expr.slice(1, n); 
    } else if (expr[n-1] === BINDING_OPERATORS.ANY_WAY) {     // <h1 title@="title ^">@{title ^}</h1>
      mode = DATA_BINDING_MODES.ANY_WAY;
      expr = expr.slice(0, n-1);
    } else if (expr[n-1] === BINDING_OPERATORS.ASSIGN) {      // <h1 title@="title!">@{title !}</h1>
      mode = DATA_BINDING_MODES.ASSIGN;
      expr = expr.slice(0, n-1);
    } else if (expr[n-1] === BINDING_OPERATORS.ONE_TIME) {    // <div x:type="Panel" x:if="showPanel ?"></div>
      mode = DATA_BINDING_MODES.ONE_TIME;
      expr = expr.slice(0, n-1);
    } else {                                                  // <h1 title@="title">@{title}</h1>
      mode = DATA_BINDING_MODES.ONE_WAY;
    }

    var converters, converter, evaluator, pieces, piece, path;
    if (mode === DATA_BINDING_MODES.TWO_WAY) {
      if (!Path.test(expr.trim())) {
        throwError('', {
          code: 1001,
          expr: arguments[0],
          desc: '`' + arguments[0] + '` is not a valid two-way binding expression. Must be a property name or path.'
        });
      }
      path = Path.parse(expr.trim());
      if ((path[0] in prototype) && identifiers.indexOf(path[0]) < 0) {
        path.unshift('this');
      }
      evaluator = EvaluatorParser.parse(expr, prototype, identifiers);
    } else if (expr.indexOf(BINDING_OPERATORS.CONVERTER) < 0) {
      evaluator = EvaluatorParser.parse(expr, prototype, identifiers);
    } else {
      pieces = expr.split(BINDING_OPERATORS.CONVERTER);
      evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);
      if (pieces.length > 1) {
        for (i = 1; i < pieces.length; ++i) {
          piece = pieces[i].trim();

          if (!piece) {
            throwError('Converter must not be empty!', {
              code: 1001,
              expr: arguments[0],
              desc: 'Empty converter in the expression `' + arguments[0] + '` is not allowed.'
            });
          }

          var identifier = newIdentifier(expr, identifiers);
          var index = piece.indexOf('(');
          if (index > 0) {
            piece = piece.slice(0, index + 1) + identifier + ',' + piece.slice(index + 1);
          } else {
            if (piece.indexOf('.') < 0 && identifiers.indexOf(piece) < 0) {
              var resources = prototype.constructor.resources;
              if (resources) {
                var func = Path.search(piece, resources);
                if (typeof func === 'function') {
                  converters = converters || [];
                  converters.push(new Evaluator(func, piece));
                  continue;
                } 
              }
            }
            piece = piece + '(' + identifier + ')';
          }

          converter = EvaluatorParser.parse(piece, prototype, identifiers.concat([identifier]));
          converters = converters || [];
          converters.push(converter);
        }
      }
    }

    var pattern = {
      mode: mode,
      evaluator: evaluator
    };

    if (mode === DATA_BINDING_MODES.TWO_WAY) {
      pattern.identifiers = identifiers;
      pattern.path = path;
    } else if (converters && converters.length) {
      pattern.converters = converters;
    }

    return pattern;
  }
};
  