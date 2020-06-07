// src/share/config.js 

var _configuration = {};

export default {
  get: function get(name) {
    return _configuration[name];
  },
  set: function set(name, value) {
    _configuration[name] = value;
  }
}