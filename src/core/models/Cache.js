// src/core/models/Cache.js

import Accessor from 'src/base/Accessor'
import DirtyMarker from 'src/base/DirtyMarker'
import { FLAG_CHANGED } from 'src/share/constants'
import { defineProp, defineClass } from 'src/share/functions'

var EMPTY_OWNER = {
  invalidate: function() {}
}

/**
 * @class
 * @constructor
 * @param {Object} owner 
 */
export default function Cache(owner) { // internal class
  defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
  defineProp(this, '_props', {value: {}/*, configurable: true*/});
}

defineClass({
  constructor: Cache, mixins: [Accessor.prototype, DirtyMarker.prototype],

  get: function(key) {
    return this._props[key];
  },

  set: function set(key, val) {
    var props = this._props;
    var old = props[key];
    if (val !== old) {
      props[key] = val;
      this._owner.invalidate(FLAG_CHANGED);
      DirtyMarker.check(this, key, val, old);
    }
  },

  reset: function(props) {
    var _props = this._props, key;
    if (_props) {
      for (key in _props) {
        if (!props || !(key in props)) {
          this.set(key, null);
        }
      }
    }
    if (props) {
      this.assign(props);
    }
  }
});