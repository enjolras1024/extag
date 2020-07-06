// src/base/DirtyMarker.js

import { hasOwnProp, defineClass } from 'src/share/functions'

export default function DirtyMarker() {
  throw new Error('DirtyMarker is a partial class for mixins and can not be instantiated');
}

defineClass({

  constructor: DirtyMarker,

  statics: {
    /**
     * Check and mark the changed property dirty
     *
     * @param {Object} object
     * @param {string} key
     * @param {*} val
     * @param {*} old
     * @returns {boolean}
     */
    check: function check(object, key, val, old) {
      var dirty = object._dirty;

      if (!dirty) {
        dirty = {};
        object._dirty = dirty;
        // defineProp(object, '_dirty', {
        //     value: dirty, enumerable: false, writable: true, configurable: true}
        // );
      }

      if (!(key in dirty)) {
        dirty[key] = old;
      } else if (dirty[key] === val) {
        delete dirty[key];
      }
    },

    /**
     * Clean all or make dirty property clean
     *
     * @param {Object} object
     * @param {string} key
     */
    clean: function clean(object, key) {
      if (object._dirty) {
        if (!key) {
          object._dirty = null;
        } else {
          delete object._dirty[key];
        }
      }
    }
  },

  /**
   * Check if some property is dirty.
   *
   * @param {string} key
   * @returns {boolean}
   */
  hasDirty: function hasDirty(key) {
    var _dirty = this._dirty;
    return _dirty ? (key == null || hasOwnProp.call(_dirty, key)) : false;
  }
});