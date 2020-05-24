// src/core/models/Model.js

import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Dependency from 'src/core/Dependency'
import { 
  hasOwnProp, 
  defineProp, 
  defineClass, 
  getOwnPropDesc 
} from 'src/share/functions'

function getPropDescriptors(props) {
  var descriptors = {};
  for (var key in props) {
    if (hasOwnProp.call(props, key)) {
      descriptors[key] = getOwnPropDesc(props, key);
    }
  }
  return descriptors;
}

/**
 * Model for storing data an sending property-changed event with declaration.
 * It is like Component, but there is nothing to do with view, just the model.
 * @class
 * @constructor
 * @param {Object} props 
 */
export default function Model(props, watcher) {
  Model.initialize(this, props, watcher);
}

defineClass({
  constructor: Model,

  mixins: [Accessor.prototype],

  statics: {
    create: function create(props, watcher) {
      return new Model(props, watcher);
    },

    initialize: function initialize(model, props, watcher) {
      if (!watcher) {
        watcher = new Watcher();
      }
      defineProp(model, '_watcher', {
        value : watcher, writable: false, enumerable: false, configurable: true
      })
      var constructor = model.constructor;
      if (constructor === Model) {
        defineProp(model, '_props', {
          value: {}, writable: false, enumerable: false, configurable: true
        });
        if (props) {
          var descriptors = getPropDescriptors(props);
          Accessor.applyAttributeDescriptors(model, descriptors, false);
          Accessor.assign(model, props);
        }
      } else {
        Accessor.applyAttributeDescriptors(
          constructor.prototype, 
          constructor.attributes, 
          true
        ); 
        var defaults = Accessor.getAttributeDefaultValues(model);

        defineProp(model, '_props', {
          value: defaults, writable: false, enumerable: false, configurable: true
        });
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          Validator.validate0(model, props);
        }
        if (props) {
          Accessor.assign(model, props);
        }
      }
    }
  },

  /**
   * Get property in _props.
   * @param {string} key
   */
  get: function get(key) {
    var desc = Accessor.getAttrDesc(this, key);
    if (desc && desc.bindable) {
      if (Dependency.binding()) {
        Dependency.add(this._watcher, key);
      }
      return !desc.get ? 
                this._props[key] : 
                  desc.get.call(this, this._props);
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
    // Custom attribute in _props
    var props = this._props, old;

    if (!desc.get) { // usually, no custom `get` and `set`, checking if the property value is changed firstly.
      old = props[key];
      if (old !== val) {
        props[key] = val;
        this._watcher.emit('changed', key, val);
      }
    } else if (desc.set) { // else, `get`, `set` and `get` again, then check if the property value is changed.
      old = desc.get.call(this, props);
      desc.set.call(this, val, props);
      val = desc.get.call(this, props);
      if (old !== val) {
        this._watcher.emit('changed', key, val);
      }
    }

    return;
  }
});