// src/core/bindings/EventBinding.js

import Binding from 'src/core/bindings/Binding'
import { append, defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

export default function EventBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  constructor: EventBinding,

  statics: {
    create: function create(pattern) {
      return new EventBinding(pattern);
    }
  },

  connect: function connect(type, target, scopes) {
    this.type = type;
    this.target = target;

    var pattern = this.pattern;
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
        this.handler = func;
      } else if (modifiers[0] === 'bind' && modifiers.length === 1) {
        this.handler = func.bind(scopes[0]);
      } else {
        this.handler = function(event) {
          processModifiers(modifiers, event);
          if (modifiers.indexOf('bind') >= 0) {
            func.apply(scopes[0], arguments);
          } else {
            func.apply(null, arguments);
          }
          
        };
        this.options = extractOptions(modifiers);
      }
    } else if (scopes.length <= 1) {
      if (!modifiers || !modifiers.length) {
        this.handler = function(event) {
          evaluator.apply(scopes[0], append(scopes, event));
        };
      } else {
        this.handler = function(event) {
          processModifiers(modifiers, event);
          evaluator.apply(scopes[0], append(scopes, event));
        };
        this.options = extractOptions(modifiers);
      }
      
    } else {
      this.scopes = scopes; // the 2nd scope may be replaced later in x:for loop.
      if (!modifiers || !modifiers.length) {
        this.handler = (function(event) {
          evaluator.apply(scopes[0], append(scopes, event));
        }).bind(this);
      } else {
        this.handler = (function(event) {
          processModifiers(modifiers, event);
          evaluator.apply(scopes[0], append(scopes, event));
        }).bind(this);
        this.options = extractOptions(modifiers);
      }
    }
    if (this.handler) {
      if (!this.options) {
        target.on(type, this.handler);
      } else {
        target.on(type, this.handler, this.options);
      }
      Binding.record(target, this);
    }
  },

  replace: function replace(scopes) {
    if (this.scopes && scopes.length > 1 
        && this.scopes.length === scopes.length) {
      // this.scopes = scopes;
      for (var i = 1; i < scopes.length; ++i) {
        this.scopes[i] = scopes[i];
      }
    }
  },

  destroy: function destroy() {
    var handler = this.handler;
    if (handler) {
      if (!this.options) {
        this.target.off(this.type, handler);
      } else {
        this.target.off(this.type, handler, this.options);
      }
    }
    // Binding.remove(binding);
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