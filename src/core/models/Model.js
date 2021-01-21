// src/core/models/Model.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Dependency from 'src/core/Dependency'
import { EMPTY_OBJECT } from 'src/share/constants'
import { 
  getOwnPropDesc,
  hasOwnProp, 
  defineProp, 
  defineClass
} from 'src/share/functions'

function assignProps(model, props) {
  var key, desc;
  for (key in props) {
    if (hasOwnProp.call(props, key)) {
      if (Accessor.getAttrDesc(model, key)) {
        model.set(key, props[key]);
      } else {
        desc = getOwnPropDesc(props, key);
        if (!desc.get && !desc.set) {
          Accessor.defineGetterSetter(model, key);
          model.set(key, desc.value);
        } else {
          defineProp(model, key, desc);
        }
      }
    }
  }
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
      var constructor = model.constructor, defaults;
      if (constructor !== Model && constructor.attributes) {
        Accessor.applyAttributeDescriptors(
          constructor.prototype, 
          constructor.attributes
        ); 
        defaults = Accessor.getAttributeDefaultValues(model);
        defineProp(model, '_props', {
          value: defaults, writable: false, enumerable: false, configurable: true
        });
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          Validator.validate0(model, props);
        }
      } else {
        defineProp(model, '_props', {
          value: {}, writable: false, enumerable: false, configurable: true
        });
      }
      if (props) {
        assignProps(model, props);
      }
    }
  },

  keys: function keys() {
    return Object.keys(this._props || EMPTY_OBJECT);
  },

  /**
   * Get custom attribute
   * @param {string} key
   */
  get: function get(key) {
    Dependency.add(this, key);
    var desc = Accessor.getAttrDesc(this, key);
    return !desc || !desc.get ? 
                this._props[key] : 
                  desc.get.call(this, this._props);
  },

  /**
   * Set custom attribute
   * @param {string} key
   * @param {*} val
   */
  set: function set(key, val) {
    var desc = Accessor.getAttrDesc(this, key);
    // validation in development 
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate(this, key, val, true);
    }
    // Custom attribute in _props
    var props = this._props, old;
    if (!desc || !desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
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