// src/core/template/PathEvaluator.js

import logger from 'src/share/logger'

/**
 * @class
 * @constructor
 * @param {Function} func 
 * @param {string} expr
 */
export default function PathEvaluator(path, expr) {
  this.path = path;
  this.expr = expr;
}

function execute(scopes) {
  var path = this.path;
  var n = path.length;
  var i = path.from;
  var value;
  
  if (i >= 0) {
    value = scopes[i];
  } else {
    value = scopes[0].constructor.resources;
    value = value[path[0]];
  }

  if (n === 2) {
    return value[path[1]];
  } else {
    i = 0;
    while(++i < n) {
      value = value[path[i]];
    }
    return value;
  }
}

PathEvaluator.prototype.execute = execute;

// eslint-disable-next-line no-undef
if (__ENV__ === 'development') { 
  PathEvaluator.prototype.execute = function(scopes) {
    try {
      return execute.call(this, scopes);
    } catch (e) {
      var constructor = scopes[0].constructor;
      logger.warn('The expression `' + (this.expr || this.path.join('.')) + 
                  '` maybe illegal in the template of component ' + (constructor.fullname || constructor.name));
      throw e;
    }
  }
}