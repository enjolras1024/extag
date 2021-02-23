// src/core/template/parsers/DataBindingParser.js

import Path from 'src/base/Path'
import { throwError } from 'src/share/functions'
import { BINDING_OPERATORS } from 'src/share/constants'
import DataBinding from 'src/core/bindings/DataBinding'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'

export default {
  /**
   * Parse data-binding expression
   * @param {string} expr - e.g. "text |=upper" in @{text |=upper} or value@="text |=upper".
   * @param {Object} resources - static resources included in expression.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is an iterator from x:for expression.
   * @returns {*}
   */
  parse: function parse(expr, resources, identifiers) {
    var mode, index, modifiers, evaluator;

    if (expr[0] === BINDING_OPERATORS.TWO_WAY) {              // <text-box model@="@text"/>
      mode = DataBinding.MODES.TWO_WAY;
      if (!Path.test(expr.slice(1).trim())) {
        throwError('Invalid two-way binding expression!', {
          code: 1001,
          expr: expr,
          desc: '`' + expr + '` is not a valid two-way binding expression. Must be a property name or path.'
        });
      }
      evaluator = EvaluatorParser.parse(expr.slice(1), resources, identifiers, expr);
    } else {
      mode = DataBinding.MODES.ONE_WAY;
      index = expr.indexOf(BINDING_OPERATORS.MODIFIER);
      if (index < 0) {
        evaluator = expr;
      } else {
        evaluator = expr.slice(0, index);
        modifiers = expr.slice(index);
      }
      evaluator = EvaluatorParser.parse(expr, resources, identifiers, expr);
    }

    var pattern = {
      mode: mode,
      evaluator: evaluator
    };

    if (modifiers) {
      pattern.modifiers = modifiers;
    }
    
    return pattern;
  }
};
  