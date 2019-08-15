// src/core/template/parsers/DataBindingParser.js

import Path from 'src/base/Path'
import logger from 'src/share/logger'
import { BINDING_OPERATORS } from 'src/share/constants'
// import Expression from 'src/base/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

var DATA_BINDING_MODES = DataBinding.MODES;

function collectPaths(evaluator, collection) {
  var paths = evaluator.paths;
  for (var i = 0; i < paths.length; ++i) {
    if (collection.indexOf(paths[i]) < 0) {
      collection.push(paths[i]);
    }
  }
}

export default {
  /**
   *
   * @param {string} expression
   * @param {Object} prototype
   * @param {Array} identifiers
   * @returns {*}
   */
  parse: function parse(expression, prototype, identifiers) {
    var mode = -1, paths = [], n = expression.length, i;

    if (expression[0] === BINDING_OPERATORS.TWO_WAY) {              // <text-box model@="@text"/>
      mode = DATA_BINDING_MODES.TWO_WAY;
      expression = expression.slice(1, n); 
    } else if (expression[n-1] === BINDING_OPERATORS.ANY_WAY) {     // <h1 title@="title ^">@{title ^}</h1>
      mode = DATA_BINDING_MODES.ANY_WAY;
      expression = expression.slice(1, n);
      event = 'update';
    } else if (expression[n-1] === BINDING_OPERATORS.ASSIGN) {      // <h1 title@="title!">@{title !}</h1>
      mode = DATA_BINDING_MODES.ASSIGN;
      expression = expression.slice(0, n-1);
    } else if (expression[n-1] === BINDING_OPERATORS.ONE_TIME) {    // <div x:type="Panel" x:if@="showPanel ?"></div>
      mode = DATA_BINDING_MODES.ONE_TIME;
      expression = expression.slice(0, n-1);
    } else {                                                        // <h1 title@="title">@{title}</h1>
      mode = DATA_BINDING_MODES.ONE_WAY;
    }

    var pieces = mode === DATA_BINDING_MODES.TWO_WAY 
                  || expression.indexOf(BINDING_OPERATORS.CONVERTER) < 0 ? 
                    [expression] : expression.split(BINDING_OPERATORS.CONVERTER); // EvaluatorParser.splitExpr(expression);

    var evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);

    collectPaths(evaluator, paths);
    
    var converters, converter, piece;
    if (pieces.length > 1) {
      // if (mode === DATA_BINDING_MODES.TWO_WAY) {
      //   if (pieces.length > 2) {
      //     logger.warn(('Only one two-way converter is supported in two-way binding expression, but ' + (pieces.length - 1) + ' converters are detected in `' + expression + '`'))
      //     throw new Error('Invalid two-way binding expression `' + expression + '`');
      //   }
      //   piece = pieces[1].trim();
      //   if (!piece) {
      //     logger.warn('There is an empty converter in the expression `' + expression + '`');
      //     throw new Error('Converter must not be empty!');
      //   }
      //   if (!/[\$\_\w]+\.exec\(?/.test(piece)) {
      //     logger.warn('`' + piece + '` is not a valid two-way converter expression in `' + expression + '`');
      //     throw new Error('Invalid two-way binding converter `' + piece + '`');
      //   }
      //   index = piece.indexOf('.exec');
      //   var conv = piece.slice(0, index);
      //   index = piece.indexOf('(', index+5);
      //   var exec, back;
      //   if (index < 0) {
      //     conv = piece;
      //     exec = piece + '.exec($_0)';
      //     back = piece + '.back($_0)';
      //   } else {
      //     conv = piece;
      //     exec = piece + '.exec($_0,' + piece.slice(index + 1);
      //     back = piece + '.back($_0,' + piece.slice(index + 1);
      //   }
      //   converter = Path.search(conv, prototype.constructor.resources);
      //   if (!converter) {
      //     logger.warn('Cannot find this converter named `' + conv + '`');
      //     throw new Error('Unknown converter named ' + conv);
      //   } else if (!converter.exec || !converter.back) {
      //     logger.warn('`' + conv + '` is not a valid two-way converter');
      //     throw new Error('Invalid two-way converter named `' + conv + '`');
      //   }
      //   converters = [ 
      //     EvaluatorParser.parse(exec, prototype, identifiers),
      //     EvaluatorParser.parse(back, prototype, identifiers)
      //   ];
      //   collectPaths(converters[0], paths);
      // } else {
        for (i = 1; i < pieces.length; ++i) {
          piece = pieces[i].trim();
          if (!piece) {
            logger.warn('There is an empty converter in the expression `' + expression + '`');
            throw new Error('Converter must not be empty!');
          }
          var index = piece.indexOf('(');
          if (index > 0) {
            piece = piece.slice(0, index) + '($_0,' + piece.slice(index + 1);
          } else {
            piece = piece + '($_0)';
          }
          converter = EvaluatorParser.parse(piece, prototype, identifiers);
          collectPaths(converter, paths);
          converters = converters || [];
          converters.push(converter);
        }
      // }
    }

    return {
      mode: mode,
      paths: paths,
      evaluator: evaluator,
      converters: converters,
      identifiers: identifiers
    }
  }
};
  