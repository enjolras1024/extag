// src/core/models/Model.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Dependency from 'src/core/Dependency'
import { 
  hasOwnProp, 
  defineProp, 
  defineClass
} from 'src/share/functions'

function getMorePropDescriptors(model, props) {
  var descriptors = [];
  for (var key in props) {
    if (!Accessor.getAttrDesc(model, key)
        && hasOwnProp.call(props, key)) {
          descriptors.push(key);
    }
  }
  return descriptors;
}

/**
 * Model for storing data and emit `changed` event with declaration.
 * It is like Component, but there is nothing to do with view, just the model.
 * @class
 * @constructor
 * @param {Object} props 
 */
export default function Model(props) {
  Model.initialize(this, props);
}

defineClass({
  constructor: Model,

  mixins: [Accessor.prototype, Watcher.prototype],

  statics: {
    create: function create(props) {
      return new Model(props);
    },

    initialize: function initialize(model, props) {
      var constructor = model.constructor;
      if (constructor !== Model && constructor.attributes) {
        Accessor.applyAttributeDescriptors(
          constructor.prototype, 
          constructor.attributes
        ); 
      }
      var defaults = Accessor.getAttributeDefaultValues(model);
      defineProp(model, '_props', {
        value: defaults, writable: false, enumerable: false, configurable: true
      });
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        Validator.validate0(model, props);
      }
      if (props) {
        var descriptors = getMorePropDescriptors(model, props);
        if (descriptors.length) {
          Accessor.applyAttributeDescriptors(model, descriptors);
        }
        model.assign(props);
      }
    }
  },

  /**
   * Get custom attribute declared in attributes.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);
    if (desc/* && desc.bindable*/) {
      // if (Dependency.binding()) {
        Dependency.add(this, key);
      // }
      return !desc.get ? 
                this._props[key] : 
                  desc.get.call(this, this._props);
    }
    return this[key];
  },

  /**
   * Set custom attribute declared in attributes.
   * @param {string} key
   * @param {*} val
   */
  set: function set(key, val) {
    var desc = Accessor.getAttrDesc(this, key);
    // normal property
    if (!desc) {
      this[key] = val;
      return;
    }
    // validation in development 
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // // Unbindable custom prpoerty
    // if (!desc.bindable) {
    //   this[key] = val;
    //   return;
    // }
    // Custom attribute in _props
    var props = this._props, old;
    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this.emit('changed', key, val);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props);
      if (old !== val) {
        this.emit('changed', key, val);
      }
    }
  }
});