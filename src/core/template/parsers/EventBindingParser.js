// src/core/template/parsers/EventBindingParser.js

import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import { 
  CONTEXT_REGEXP,
  HANDLER_REGEXP,
  BINDING_OPERATORS 
} from 'src/share/constants'

export default {
  /**
   * e.g. click+="close() ::once::stop" change+="this.onClick"
   * @param {string} expr - event handler expression
   * @param {Object} resources - static resources included in expression.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   */
  parse: function parse(expr, resources, identifiers) {
    var pattern = {};
    var evaluator;
    var index = expr.indexOf(BINDING_OPERATORS.MODIFIER);
    if (index < 0) {
      evaluator = expr.trim();
    } else {
      evaluator = expr.slice(0, index).trim();
      pattern.modifiers = expr.slice(index);
    }

    if (HANDLER_REGEXP.test(evaluator)) {
      pattern.evaluator = evaluator.replace(CONTEXT_REGEXP, ''); 
    }  else {
      identifiers = identifiers.slice(0);
      identifiers.push('$event');
      pattern.evaluator = EvaluatorParser.parse(evaluator, resources, identifiers);
    }

    return pattern;
  }
};