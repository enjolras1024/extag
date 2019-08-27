// src/base/Accessor.js

import { assign, defineProp, defineClass } from 'src/share/functions'
import Generator from 'src/base/Generator'
import logger from 'src/share/logger'

var descriptorShared = {
  configurable: true,
  enumerable: true
};

var getters = {}, setters = {};

function makeGetter(key) {
  if (!getters.hasOwnProperty(key)) {
    getters[key] = function() {
      return this.get(key);
    };
  }
  return getters[key];
}

function makeSetter(key) {
  if (!setters.hasOwnProperty(key)) {
    setters[key] = function(val) {
      this.set(key, val);
    };
  }
  return setters[key];
}

var EMPTY_DESC = {};
var SHARED_GET = function(key, props) { return props[key]; }

function defineGetterSetter(prototype, key) {
  descriptorShared.get = makeGetter(key);
  descriptorShared.set = makeSetter(key);
  defineProp(prototype, key, descriptorShared);
}

function getAttributeDefaultValue(desc) {
  var type = typeof desc.value;
  if (type !== 'object') {
    return desc.value;
  } else if (desc.value != null) {
    if (!(desc.value instanceof Generator)) {
      return desc.value;
    } else {
      return desc.value.gen && desc.value.gen();
    }
  }
}

function getAttributeDefaultValues(target) {
  var defaultValues = {}, descriptors = target.__extag_descriptors__;
  if (descriptors) {
    for (var key in descriptors) {
      if (descriptors.hasOwnProperty(key)) {
        var desc = descriptors[key];
        var type = typeof desc.value;
        if (type === 'undefined') {
          continue;
        }
        if (type !== 'object') {
          defaultValues[key] = desc.value;
        } else if (desc.value != null) {
          if (!(desc.value instanceof Generator)) {
            defaultValues[key] = desc.value;
          } else {
            defaultValues[key] = desc.value.gen && desc.value.gen();
          }
        }
      }
    }
  }
  return defaultValues;
}

function applyAttributeDescriptors(prototype, descriptors, override) {
  if (prototype.hasOwnProperty('__extag_descriptors__')) {
    return;
  }
  if (Array.isArray(descriptors)) {
    // array to key-value descriptors
    var i, n, names = descriptors;
    descriptors = {};
    for (i = 0, n = names.length; i < n; ++i) {
      descriptors[names[i]] = EMPTY_DESC;
    }
  }
  // merge descriptors
  descriptors = assign({}, prototype.__extag_descriptors__, descriptors);

  var key, desc;

  for (key in descriptors) { // define getter/setter for each key
    if (descriptors.hasOwnProperty(key) /*&& !prototype.hasOwnProperty(key)*/) {
      if ((key in prototype) && !override) {
        if (__ENV__ === 'development') {
          logger.warn('`' + key + '` is already defined in the prototype of ' + prototype.constructor);
        }
        continue;
      }
      desc = descriptors[key];
      if (typeof desc !== 'object') {
        descriptors[key] = {value: desc};
      } else if (desc instanceof Generator) {
        descriptors[key] = {value: desc};
      } else {
        if (desc) {
          if (desc.get && !desc.set) {
            // desc.set = EMPTY_FUNC; // readonly
          } else if (desc.set && !desc.get) {
            desc.get = SHARED_GET;
          }
          descriptors[key] = desc;
        } else {
          descriptors[key] = EMPTY_DESC;
        }
      }
      desc = descriptors[key];
      if (!('bindable' in  desc)) {
        desc.bindable = true; // can dispatch `changed.${key}` event, default true
      }
      if (desc.bindable) {
        defineGetterSetter(prototype, key);
      }
    }
  }

  defineProp(prototype, '__extag_descriptors__', {value: descriptors});
}

/**
 * Get the descriptor of the attribute.
 * @param {Object} object 
 * @param {string} attrName 
 */
function getAttrDesc(object, attrName) {
  return object.__extag_descriptors__ ? object.__extag_descriptors__[attrName] : null;
}

export default function Accessor() {
  throw new Error('Accessor is a partial class for mixins and can not be instantiated');
}

defineClass({
  constructor: Accessor,

  statics: { // TODO: move to functions.js
    getAttrDesc: getAttrDesc,
    defineGetterSetter: defineGetterSetter,
    getAttributeDefaultValue: getAttributeDefaultValue,
    getAttributeDefaultValues: getAttributeDefaultValues,
    applyAttributeDescriptors: applyAttributeDescriptors
  },

  get: function get(key) {
    throw new Error('Method `get` must be implemented by sub-class');
  },

  set: function set(key, value) {
    throw new Error('Method `set` must be implemented by sub-class');
  },

  assign: function assign(props) {
    for (var key in props) {
      if (props.hasOwnProperty(key)) {
        this.set(key, props[key]);
      }
    }
    return this;
  }
});