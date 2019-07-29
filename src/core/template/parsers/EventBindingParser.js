// src/core/template/parsers/EventBindingParser.js

import config from 'src/share/config.js'
// import Expression from 'src/base/Expression'
// import EventBinding from 'src/core/bindings/EventBinding'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import { CONTEXT_SYMBOL, BINDING_OPERATORS, ONE_WAY_BINDING_BRACKETS } from 'src/share/constants'

// var CONVERTER_OPERATOR = BINDING_OPERATORS.CONVERTER;
var CONTEXT_REGEXP = new RegExp('^' + CONTEXT_SYMBOL + '\\.');
var HANDLER_REGEXP = new RegExp('^(' + CONTEXT_SYMBOL + '\\.)?[\\w\\$\\_]+$');
// var ONE_WAY_BINDING_BRACKETS = config.ONE_WAY_BINDING_BRACKETS;

export default {
  /**
   * e.g. click+="close() ::once::stop" change+="this.onClick"
   */
  parse: function parse(expression, prototype, identifiers) {
    var pieces = expression.indexOf(BINDING_OPERATORS.MODIFIER) < 0 ? 
                  [expression] : expression.split(BINDING_OPERATORS.MODIFIER); // EvaluatorParser.splitExpr(expression);

    pieces[0] = pieces[0].trim();

    var template = {};

    if (HANDLER_REGEXP.test(pieces[0])) {
      template.handler = pieces[0].replace(CONTEXT_REGEXP, ''); // TODO:
    }  else {
      template.identifiers = identifiers;//.concat(['event']);
      template.evaluator = EvaluatorParser.parse(pieces[0], prototype, template.identifiers);
    }

    if (pieces.length > 1) {
      var modifiers = [];
      for (var i = 1; i < pieces.length; ++i) {
        modifiers.push(pieces[i].trim());
      }
      template.modifiers = modifiers;
    }

    return template;//Expression.create(EventBinding, template);
  }
};