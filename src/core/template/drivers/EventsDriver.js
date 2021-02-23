// src/core/template/drivers/EventsDriver.js

import { append } from 'src/share/functions'

function createEventOptions(modifiers) {
  var options = {};
  modifiers = modifiers.split('//');
  for (var i = 0; i < modifiers.length; ++i) {
    if (modifiers[i]) {
      options[modifiers[i]] = true;
    }
  }
  return options;
}

export function patchEvents(target, scopes, vnode, first) {
  var name, oldValue, newValue;
  var newEvents = vnode.events;
  var oldEvents = target._events;
  if (oldEvents) {
    for (name in oldEvents) {
      oldValue = oldEvents[name];
      if (typeof oldValue === 'function') {
        if (!newEvents || oldValue !== newEvents[name]) {
          target.off(name, oldValue);
        }
      } else if (Array.isArray(oldValue)) {
        target.off(name, oldValue[0], createEventOptions(oldValue[1]));
      }
    }
    target._events = null;
  }
  if (newEvents) {
    for (name in newEvents) {
      newValue = newEvents[name];
      if (typeof newValue === 'function') {
        if (!oldEvents || newValue !== oldEvents[name]) {
          target.on(name, newValue);
        }
      } else if (Array.isArray(newValue)) {
        // TODO: how about //once
        target.on(name, newValue[0], createEventOptions(newValue[1]));
      }
    }
    target._events = newEvents
  }
}

function createScopedHandler(evaluator, scopes, target) {
  return function(event) {
    var _scopes = target.__extag_scopes__;
    if (!_scopes || scopes[0] === target) {
      _scopes = scopes;
    }
    evaluator.apply(_scopes[0], append(_scopes, event));
  }
}

export function driveEvents(target, scopes, vnode, first) {
  var type, expr, pattern, handler, evaluator, modifiers, newEvents;
  // if (vnode.xflag) {
    if (vnode.scopes) {
      scopes = vnode.scopes;
    }
    if (first) {
      newEvents = vnode.events;
      for (type in newEvents) {
        expr = newEvents[type];
        // if (!(expr instanceof Expression)) {
        //   continue;
        // }
        pattern = expr.pattern;
        evaluator = pattern.evaluator;
        modifiers = pattern.modifiers;
        if (typeof evaluator === 'string') {
          handler = scopes[0][evaluator];
          if (modifiers && 
              modifiers.indexOf('//bind') >= 0) {
            handler = handler.bind(scopes[0]);
          }
        } else {
          handler = createScopedHandler(evaluator, scopes, target);
        }
        
        if (!modifiers) {
          target.on(type, handler);
        } else {
          target.on(type, handler, createEventOptions(pattern.modifiers));
        }
      }
    }
  // }
}

export default {
  drive: function drive(target, scopes, vnode, first) {
    if ('xflag' in vnode) {
      driveEvents(target, scopes, vnode, first);
    } else {
      patchEvents(target, scopes, vnode, first);
    }
  }
}