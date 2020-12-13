// src/base/Path.js

var PATH_MATCHER = /^\s*[$_A-Z][$_A-Z0-9]*(\s*\.\s*[$_A-Z0-9]+)*\s*$/i;
var PATH_SPLITER = /\s*\.\s*/;

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

var Path = {
  test: function(expr) {
    return PATH_MATCHER.test(expr);
  },
  /**
   * Parse property path from a string.
   * @param {string} expr - like 'a.b.c'
   */
  parse: function parse(expr) {
    if (Path.test(expr)) {
      return expr.trim().split(PATH_SPLITER);
    }
  },

  /**
   * Search the resource in local, then in global if necessary.
   *
   * @param {Array|string} path
   * @param {Object} local
   * @param {boolean} stop
   * @returns {*}
   */
  search: function(path, local, stop) {
    var res;

    if (typeof path === 'string') {
      path = Path.parse(path);
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
        // eslint-disable-next-line no-undef
        res = find(path, global);
      }
    }

    return res;
  },
};

export default Path;