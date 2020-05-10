// src/core/models/Store.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import config from 'src/share/config'
import { defineProp, defineClass } from 'src/share/functions'

var storeGuid = -1;

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
      var prototype = store.constructor.prototype;
      var attributes = store.constructor.attributes;

      // if (!prototype.hasOwnProperty('__extag_descriptors__')) {
        Accessor.applyAttributeDescriptors(prototype, attributes, true); 
      // }

      // if (props) {
      //   Accessor.applyAttributeDescriptors(store, props, false); 
      // }

      var defaults = Accessor.getAttributeDefaultValues(store);

      defineProp(store, '$props', {
        value: defaults, writable: false, enumerable: false, configurable: true
      });

      defineProp(store, '$guid', {
        value: storeGuid--, writable: false, enumerable: false, configurable: true
      });

      if (this.setup) {
        this.setup();
      }

      if (__ENV__ === 'development') {
        Validator.validate0(store, props);
      }
  
      if (props) {
        Accessor.applyAttributeDescriptors(store, props, false);
        store.assign(props);
      }
    }
  },

  /**
   * Get property stored in $props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);
    if (desc && desc.bindable) {
      // if (Dep.binding && !desc.compute) {
      //   Dep.add(this, key);
      // }
      if (Dependency.binding()) {
        Dependency.add(this, key);
      }
      return !desc.get ? 
                this.$props[key] : 
                  desc.get.call(this, this.$props, key);
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
      // old = this[key];
      // if (old !== val) {
      //   this[key] = val;
      //   this.emit('changed.' + key, key, val, old);
      // }
      this[key] = val;
      return;
    }
    // validation in development 
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // Unbindable custom prpoerty
    if (!desc.bindable) {
      this[key] = val;
      return;
    }
    // Custom attribute, stored in $props
    var props = this.$props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.emit('changed.' + key, key);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props, key);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props, key);
      if (old !== val) {
        this.emit('changed.' + key, key);
      }
    }

    return;
  }
});