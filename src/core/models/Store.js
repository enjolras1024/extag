// src/core/models/Store.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Dependency from 'src/core/Dependency'
import { defineProp, defineClass } from 'src/share/functions'

// var storeGuid = -1;

/**
 * Store for storing data an sending property-changed event with declaration.
 * It is like Component, but there is nothing to do with view, just the model.
 * @class
 * @constructor
 * @param {Object} props 
 */
export default function Store(props) {
  Store.initialize(this, props);
}

defineClass({
  constructor: Store,

  mixins: [Accessor.prototype, Watcher.prototype],

  statics: {
    create: function create(props) {
      return new Store(props);
    },

    initialize: function initialize(store, props) {
      var constructor = store.constructor;
      if (constructor === Store) {
        defineProp(store, '_props', {
          value: {}, writable: false, enumerable: false, configurable: true
        });
        if (props) {
          Accessor.applyAttributeDescriptors(store, Object.keys(props), false);
          store.assign(props);
        }
      } else {
        Accessor.applyAttributeDescriptors(
          constructor.prototype, 
          constructor.attributes, 
          true
        ); 
        var defaults = Accessor.getAttributeDefaultValues(store);

        defineProp(store, '_props', {
          value: defaults, writable: false, enumerable: false, configurable: true
        });

        // defineProp(store, '$guid', {
        //   value: storeGuid--, writable: false, enumerable: false, configurable: true
        // });
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          Validator.validate0(store, props);
        }
        if (props) {
          store.assign(props);
        }
      }
    }
  },

  /**
   * Get property stored in _props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);
    if (desc && desc.bindable) {
      if (Dependency.binding()) {
        Dependency.add(this, key);
      }
      return !desc.get ? 
                this._props[key] : 
                  desc.get.call(this, this._props, key);
    }
    return this[key];
  },

  /**
   * Set custom property declared in attributes.
   * @param {string} key
   * @param {*} val
   */
  set: function set(key, val) {
    var desc = Accessor.getAttrDesc(this, key);
    // usual property
    if (!desc) {
      this[key] = val;
      return;
    }
    // validation in development 
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // Unbindable custom prpoerty
    if (!desc.bindable) {
      this[key] = val;
      return;
    }
    // Custom attribute, stored in _props
    var props = this._props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.emit('changed', key, val);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props, key);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props, key);
      if (old !== val) {
        this.emit('changed', key, val);
      }
    }

    return;
  }
});