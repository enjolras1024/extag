// src/base/Event.js

export default {
  /**
   * Parse event from a string, or just return the event object passed in.
   * @param {Object|string} expr  - event object or a string can be parsed.
   */
  parse: function parse(expr) {
    var event;

    if (expr.type) {
      event = expr;
    } else {
      event = {};

      var i = expr.indexOf('.');
      
      if (expr.charCodeAt(0) === EXCLAMATION_CODE) { // if expr starts width '!', then use capture.
        event.capture = true;
        expr = expr.slice(1);
      }

      if (i > 0) {
        event.type = expr.slice(0, i);
        event.name = expr.slice(i + 1);
      } else {
        event.type = expr;
      }
    }

    return event;
  }
}