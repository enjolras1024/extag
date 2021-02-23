// src/core/bindings/DataBinding.js

import logger from 'src/share/logger'
import Expression from 'src/core/template/Expression';

var DataBinding = {
  MODES: { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 }
};

if (__ENV__ === 'development') {
  DataBinding.evaluate = function evaluate(pattern, scopes) {
    try {
      return pattern.evaluator.apply(scopes[0], scopes);
    } catch (e) {
      var constructor = scopes[0].constructor;
      logger.error('The expression `' + (pattern.evaluator.expr || pattern.evaluator.toString()) + 
                  '` failed in the template of component ' + (constructor.fullname || constructor.name));
      throw e;
    }
  }
} else {
  DataBinding.evaluate = function evaluate(pattern, scopes) {
    return pattern.evaluator.apply(scopes[0], scopes);
  }
}

export default DataBinding;