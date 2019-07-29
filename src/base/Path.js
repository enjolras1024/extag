// src/base/Path.js

// var PATH_DELIMITER = /\[|\]?\./;
var PATH_DELIMITER_1 = /\./;
var PATH_DELIMITER_2 = /(\]\.)|\.|\[|\]/g;
var PATH_REGEXP_1 = /^[\$_A-Z][\$_A-Z0-9]*(\.[\$_A-Z0-9]+)*$/i;
var PATH_REGEXP_2 = /^[\$_A-Z][\$_A-Z0-9]*((\[\d+\])|(\.[\$_A-Z0-9]+))*$/i;

/**
 * Find the resource in the scope
 *
 * @param {Array} path
 * @param {Object} scope
 * @returns {*}
 */
function find(path, scope) {
  var i = -1, n = path.length, value = scope;

  while (++i < n) {
    value = value[path[i]];
    if (value == null) {
      return value;
    }
  }

  return value;
}

export default {
  /**
   * Parse property path from a string.
   * @param {string} text - like 'a.b.c' or 'a[0].c'...
   */
  parse: function parse(text) {
    var path = null;
    if (PATH_REGEXP_1.test(text)) {
      path = text.split(PATH_DELIMITER_1);
      // path.text = text;
    } else if (PATH_REGEXP_2.test(text)) {
      path = text.replace(PATH_DELIMITER_2, ' ').trim().split(' ');
      // path.text = text;
    }
    return path;
  },

  /**
   * Find the resource in local, then in RES if necessary.
   *
   * @param {Array|string} path
   * @param {Object} local
   * @param {boolean} stop
   * @returns {*}
   */
  search: function(path, local, stop) {
    var res;

    if (typeof path === 'string') {
      path = this.parse(path);
    }

    if (!path) {
      return;
    }

    if (local) {
      res = find(path, local);
    }

    if (res == null && !stop) {
      if (typeof window !== 'undefined') {
        res = find(path, window);
      } else if (typeof global !== 'undefined') {
        res = find(path, global);
      }
    }

    return res;
  },
};