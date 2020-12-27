// src/core/models/Cache.js

import Accessor from 'src/base/Accessor'
import DirtyMarker from 'src/base/DirtyMarker'
import { FLAG_CHANGED_CACHE } from 'src/share/constants'
import { defineClass, hasOwnProp } from 'src/share/functions'

var EMPTY_OWNER = {
  invalidate: function() {}
}

/**
 * @class
 * @constructor
 * @param {Object} owner 
 */
export default function Cache(owner) { // internal class
  // defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
  // defineProp(this, '_props', {value: {}/*, configurable: true*/});
  this._owner = owner || EMPTY_OWNER;
  this._props = {};
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
      this._owner.invalidate(FLAG_CHANGED_CACHE);
      DirtyMarker.check(this, key, val, old);
    }
  },

  reset: function(props) {
    var _props = this._props, value, key;
    if (_props) {
      for (key in _props) {
        if (hasOwnProp.call(_props, key)) {
          if (!props || !hasOwnProp.call(props, key)) {
            DirtyMarker.check(this, key, null, _props[key]);
          }
        }
      }
    }
    if (props) {
      for (key in props) {
        if (hasOwnProp.call(props, key)) {
          value = props[key];
          if (value !== _props[key]) {
            DirtyMarker.check(this, key, value, _props[key]);
          }
        }
      }
      this._props = props;
    } else {
      this._props = {};
    }
  }
});