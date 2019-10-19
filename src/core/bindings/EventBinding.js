// src/core/bindings/EventBinding.js

import { defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

export default function EventBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  constructor: EventBinding,

  statics: {
    // create: function(pattern) {
    //   return new EventBinding(pattern);
    // },

    compile: function(pattern, type, target, scopes) {
      (new EventBinding(pattern)).link(type, target, scopes);
    }
  },

  link: function(type, target, scopes) {
    var wrapper, pattern = this.pattern, handler = pattern.handler, evaluator = pattern.evaluator, modifiers = pattern.modifiers;

    if (handler) {
      var func = scopes[0][handler];

      
      if (!func) {
        if (__ENV__ === 'development') {
          logger.warn('No such handler method named ' + handler + ' in ' + scopes[0], scopes[0]);
        }
        return;
      }

      // var keys = type.split('.');
      // if (keys.length > 2) {
      //   type = keys.slice(0, 2).concat(keys.slice(2).sort()).join('.')
      // }
      
      //if (!func.__bound__to__) { // TODO: __exact__bound__
      //  func = func.bind(context);
      //  defineProp(func, '__bound__to__', {
      //    value: context, writable: false, enumerable: false, configurable: true
      //  });
      //  context[handler] = func;
      //}
      if (!modifiers || !modifiers.length) {
        target.on(type, func);
      } else if (modifiers[0] === 'bind' && modifiers.length === 1) {
        target.on(type, func.bind(scopes[0]));
      } else {
        wrapper = function(event) {
          // process(event, type, target, wrapper, modifiers);
          processModifiers(modifiers, event);
          if (modifiers.indexOf('bind') >= 0) {
            func.apply(scopes[0], arguments);
          } else {
            func.apply(null, arguments);
          }
          
        };
        target.on(type, wrapper, extractOptions(modifiers));
      }
    } else {
      if (!modifiers || !modifiers.length) {
        target.on(type, function(event) {
          // if (event) {
          //   evaluator.execute(scopes.concat([event]));
          // } else {
            evaluator.execute(scopes);
          // }
        });
      } else {
        wrapper = function(event) {
          // process(event, type, target, wrapper, modifiers);
          processModifiers(modifiers, event);
          // if (event) {
          //   evaluator.execute(scopes.concat([event]));
          // } else {
            evaluator.execute(scopes);
          // }
        };
        target.on(type, wrapper, extractOptions(modifiers));
      }
    }
    // target.on(type, wrapper);
  }
});

function extractOptions(modifiers) {
  var options = {
    once: modifiers.indexOf('once') >= 0,
    capture: modifiers.indexOf('capture') >= 0,
    passive: modifiers.indexOf('passive') >= 0
  };
  return options;
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

// function process(event, type, target, wrapper, modifiers) {
//   if (event && modifiers && modifiers.length) {
//     for (var i = 0, n = modifiers.length; i < n; ++i) {
//       switch (modifiers[i]) {
//         // case 'once':
//         //   target.off(type, wrapper);
//         //   break;
//         case 'prev':
//           event.preventDefault && event.preventDefault();
//           break;
//         case 'stop':
//           event.stopPropagation && event.stopPropagation();
//           break;
//       }
//     }
//   }
// }