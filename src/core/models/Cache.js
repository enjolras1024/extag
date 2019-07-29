// src/core/models/Cache.js

import Accessor from 'src/base/Accessor'
import DirtyMarker from 'src/base/DirtyMarker'
import { FLAG_CHANGED } from 'src/share/constants'
import { assign, defineProp, defineClass } from 'src/share/functions'

var EMPTY_OWNER = {
  invalidate: function() {}
}

/**
 * @class
 * @constructor
 * @param {Object} owner 
 */
export default function Cache(owner) { // internal class
  // defineProp(this, '_props', {value: props ? assign({}, props) : {}/*, configurable: true*/});
  defineProp(this, '_owner', {value: owner || EMPTY_OWNER/*, configurable: true*/});
  defineProp(this, '_props', {value: {}/*, configurable: true*/});
  // this._owner = owner || EMPTY_OWNER;
}

defineClass({
  constructor: Cache, mixins: [Accessor.prototype, DirtyMarker.prototype],

  get: function(key) {
    return this._props[key];
  },

  set: function set(key, val) {
    // if (arguments.length === 1) {
    //   var opts = key;
    //   for (key in opts) {
    //     this.set(key, opts[key]);
    //   }
    //   return this;
    // }
    var props = this._props;
    var old = props[key];
    if (val !== old) {
      props[key] = val;
      this._owner.invalidate(FLAG_CHANGED);
      DirtyMarker.check(this, key, val, old);
    }
  }
});
  