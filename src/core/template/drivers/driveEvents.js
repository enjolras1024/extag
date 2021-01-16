// src/core/template/drivers/driveEvents.js

import Expression from 'src/core/template/Expression'

function driveEvents(target, scopes, newEvents, useExpr) {
  var oldEvents = target._events;
  var type, value;
  // firstly, remove old event handlers
  if (oldEvents) {
    for (type in oldEvents) {
      value = oldEvents[type];
      if (typeof value === 'function') {
        target.off(type, value);
      } else if (Array.isArray(value)) {
        target.off(type, value[0], value[1]);
      }
    }
  }
  // add new event handlers
  if (newEvents) {
    for (type in newEvents) {
      value = newEvents[type];
      if (useExpr && value instanceof Expression) {
        value.connect(type, target, scopes);
      } else if (typeof value === 'function') {
        target.on(type, value);
      } else if (Array.isArray(value)) {
        target.on(type, value[0], value[1]);
      }
    }
  }
  if (!useExpr) {
    target._events = newEvents;
  }
}

export default driveEvents;