// src/share/config.js 

var _custom = {};

export default {
  JS_ENV: '',
  JSXEngine: null,
  HTMEngine: null,
  HTMXParser: null,
  // EVENT_SYMBOL: 'event',
  // CAPTURE_SYMBOL: '!',
  // CONTEXT_SYMBOL: 'this',
  // ONE_WAY_BINDING_BRACKETS: '{}',
  // TWO_WAY_BINDING_BRACKETS: '[]',
  // BINDING_OPERATORS: {
  //   DATA: '@', TEXT: '#', EVENT: '+', CONVERTER: '::', SCOPE_EVENT: '@', TWO_WAY: '@',  ANY_WAY: '^', ONE_TIME: '?', ASSIGN: '!'
  // },
  get: function get(name) {
    return _custom[name];
  },
  set: function set(name, value) {
    _custom[name] = value;
  }
}