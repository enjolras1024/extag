var tag2events = {};

var supportsPassiveOption = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      return (supportsPassiveOption = true);
    }
  });
  window.addEventListener('test-passive', null, opts);
// eslint-disable-next-line no-empty
} catch (e) {}

function mayDispatchEvent($skin, type) {
  var tagName = $skin.tagName;
  if (!tagName) {
    return false;
  }
  
  var events = tag2events[tagName] || {};
  if (type in events) {
    return events[type];
  }
  events[type] = false;
  tag2events[tagName] = events;

  var eventHook = 'on' + type, value;
  if (eventHook in $skin) {
    if (typeof $skin[eventHook] === 'function') {
      events[type] = true;
    } else {
      value = $skin.getAttribute(eventHook);
      try {
        $skin.setAttribute(eventHook, 'void 0');
        if (typeof $skin[eventHook] === 'function') {
          $skin[eventHook] = null;
          events[type] = true;
        }
      } catch (e) {
        events[type] = false;
      }
      if (value) {
        $skin.setAttribute(eventHook, value);
      } else {
        $skin.removeAttribute(eventHook);
      }
    }
  }
  return events[type];
}

function addEventListener($skin, type, func, opts) {
  if (!opts) {
    $skin.addEventListener(type, func);
  } else if (!opts.passive) {
    $skin.addEventListener(type, func, !!opts.capture);
  } else {
    $skin.addEventListener(type, func, supportsPassiveOption ? opts : !!opts.capture);
  }
}

function removeEventListener($skin, type, func, opts) {
  $skin.removeEventListener(type, func, opts ? !!opts.capture : false);
}

export {
  mayDispatchEvent,
  addEventListener,
  removeEventListener
}