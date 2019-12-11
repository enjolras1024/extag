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
   * @param {Object} prototype - component prototype, for checking if a variable name belongs it or its resources.
   * @param {Array} identifiers - like ['this', 'item'], 'item' is from x:for expression.
   */
  parse: function parse(expr, prototype, identifiers) {
    var pieces = expr.indexOf(BINDING_OPERATORS.MODIFIER) < 0 ? 
                  [expr] : expr.split(BINDING_OPERATORS.MODIFIER);

    pieces[0] = pieces[0].trim();

    var template = {};

    if (HANDLER_REGEXP.test(pieces[0])) {
      template.handler = pieces[0].replace(CONTEXT_REGEXP, ''); 
    }  else {
      template.evaluator = EvaluatorParser.parse(pieces[0], prototype, identifiers);
    }

    if (pieces.length > 1) {
      var modifiers = [];
      for (var i = 1; i < pieces.length; ++i) {
        modifiers.push(pieces[i].trim());
      }
      template.modifiers = modifiers;
    }

    return template;
  }
};