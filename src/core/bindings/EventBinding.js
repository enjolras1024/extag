// src/core/bindings/EventBinding.js

import { append } from 'src/share/functions'
import logger from 'src/share/logger'

function concatOptions(args, modifiers) {
  if (modifiers.indexOf('once') >= 0) {
    args.push('once')
  }
  if (modifiers.indexOf('capture') >= 0) {
    args.push('capture')
  }
  if (modifiers.indexOf('passive') >= 0) {
    args.push('passive')
  }
}

function processModifiers(modifiers, event) {
  if ((typeof event === 'object') && event && modifiers && modifiers.length) {
    if (modifiers.indexOf('stop') >= 0 && event.stopPropagation) {
      event.stopPropagation();
    }
    if (modifiers.indexOf('prev') >= 0 && event.preventDefault) {
      event.preventDefault();
    }
  }
}

export default {
  evaluate: function evaluate(pattern, scopes) {
    var args = [];
    var handler = pattern.handler;
    var evaluator = pattern.evaluator;
    var modifiers = pattern.modifiers;

    if (handler) {
      var func = scopes[0][handler];
      
      if (!func) {
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          logger.warn('No such handler method named `' + handler + '` in ' + scopes[0], scopes[0]);
        }
        return;
      }

      if (!modifiers || !modifiers.length) {
        // this.handler = func;
        args.push(func);
      } else if (modifiers[0] === 'bind' && modifiers.length === 1) {
        // this.handler = func.bind(scopes[0]);
        args.push(func.bind(scopes[0]))
      } else {
        args.push(function(event) {
          processModifiers(modifiers, event);
          if (modifiers.indexOf('bind') >= 0) {
            func.apply(scopes[0], arguments);
          } else {
            func.apply(null, arguments);
          }
          
        });
        // this.options = extractOptions(modifiers);
        concatOptions(args, modifiers);
      }
    } else if (scopes.length <= 1) {
      if (!modifiers || !modifiers.length) {
        args.push(function(event) {
          evaluator.apply(scopes[0], append(scopes, event));
        });
      } else {
        args.push(function(event) {
          processModifiers(modifiers, event);
          evaluator.apply(scopes[0], append(scopes, event));
        });
        // this.options = extractOptions(modifiers);
        concatOptions(args, modifiers);
      }
      
    } else {
      this.scopes = scopes; // the 2nd scope may be replaced later in x:for loop.
      if (!modifiers || !modifiers.length) {
        args.push((function(event) {
          evaluator.apply(scopes[0], append(scopes, event));
        }).bind(this));
      } else {
        args.push((function(event) {
          processModifiers(modifiers, event);
          evaluator.apply(scopes[0], append(scopes, event));
        }).bind(this));
        // this.options = extractOptions(modifiers);
        concatOptions(args, modifiers);
      }
    }
  }
}