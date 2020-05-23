// src/base/Accessor.js

import { assign, hasOwnProp, defineProp, defineClass } from 'src/share/functions'
import Generator from 'src/base/Generator'
import logger from 'src/share/logger'

var descriptorShared = {
  configurable: true,
  enumerable: true
};

var getters = {}, setters = {};

function makeGetter(key) {
  if (!hasOwnProp.call(getters, key)) {
    getters[key] = function() {
      return this.get(key);
    };
  }
  return getters[key];
}

function makeSetter(key) {
  if (!hasOwnProp.call(setters, key)) {
    setters[key] = function(val) {
      this.set(key, val);
    };
  }
  return setters[key];
}

var EMPTY_DESC = {};
var SHARED_GET = function(key, props) { return props[key]; }

function defineGetterSetter(target, key) {
  descriptorShared.get = makeGetter(key);
  descriptorShared.set = makeSetter(key);
  defineProp(target, key, descriptorShared);
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
      if (hasOwnProp.call(descriptors, key)) {
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

function applyAttributeDescriptors(target, descriptors, override) {
  if (hasOwnProp.call(target, '__extag_descriptors__')) {
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
  descriptors = assign({}, target.__extag_descriptors__, descriptors);

  var key, desc;

  for (key in descriptors) { // define getter/setter for each key
    if (hasOwnProp.call(descriptors, key) /*&& !target.hasOwnProperty(key)*/) {
      if ((key in target) && !override) {
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          logger.warn('`' + key + '` is already defined in the target of ' + target.constructor);
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
        desc.bindable = true; // will dispatch `changed` event, default true
      }
      if (desc.bindable) {
        defineGetterSetter(target, key);
      }
    }
  }

  defineProp(target, '__extag_descriptors__', {
    value: descriptors,
    configurable: true,
    enumerable: false,
    writable: false
  });
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

  // eslint-disable-next-line no-unused-vars
  get: function get(key) {
    throw new Error('Method `get` must be implemented by sub-class');
  },

  // eslint-disable-next-line no-unused-vars
  set: function set(key, value) {
    throw new Error('Method `set` must be implemented by sub-class');
  },

  assign: function assign(props) {
    for (var key in props) {
      if (hasOwnProp.call(props, key)) {
        this.set(key, props[key]);
      }
    }
  }
});