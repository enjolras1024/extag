// src/base/Accessor.js

import { 
  assign, 
  throwError, 
  hasOwnProp, 
  defineProp, 
  defineClass 
} from 'src/share/functions'
import Generator from 'src/base/Generator'
import logger from 'src/share/logger'

var EMPTY_DESC = {};

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

function getDefaultGetter(key) {
  return function(props) {
    return props[key];
  }
}

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
  var defaults = {}, descriptors = target.__extag_descriptors__;
  if (descriptors) {
    for (var key in descriptors) {
      if (hasOwnProp.call(descriptors, key)) {
        var desc = descriptors[key];
        var type = typeof desc.value;
        if (type === 'undefined') {
          continue;
        }
        if (type !== 'object') {
          defaults[key] = desc.value;
        } else if (desc.value != null) {
          if (!(desc.value instanceof Generator)) {
            defaults[key] = desc.value;
          } else {
            defaults[key] = desc.value.gen && desc.value.gen();
          }
        }
      }
    }
  }
  return defaults;
}

function applyAttributeDescriptors(target, descriptors) {
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
  // extend descriptors
  var _descriptors = assign({}, target.__extag_descriptors__);

  var key, desc;

  for (key in descriptors) { // define getter/setter for each key
    if (hasOwnProp.call(descriptors, key)) {
      if (key in target) {
        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          logger.warn('`' + key + '` is already defined in the target of ' + target.constructor);
        }
        continue;
      }
      desc = descriptors[key];
      if (typeof desc !== 'object') {
        _descriptors[key] = {value: desc};
      } else if (desc instanceof Generator) {
        _descriptors[key] = {value: desc};
      } else {
        if (desc) {
          if (desc.get && !desc.set) {
            // desc.set = EMPTY_FUNC; // readonly
          } else if (desc.set && !desc.get) {
            desc.get = getDefaultGetter(key);
          }
          _descriptors[key] = desc;
        } else {
          _descriptors[key] = EMPTY_DESC;
        }
      }
      // desc = _descriptors[key];
      // if (!('bindable' in  desc)) {
      //   desc.bindable = true; // will dispatch `changed` event, default true
      // }
      // if (desc.bindable) {
        defineGetterSetter(target, key);
      // }
    }
  }

  defineProp(target, '__extag_descriptors__', {
    value: _descriptors,
    configurable: true,
    enumerable: false,
    writable: false
  });
}

/**
 * Get the descriptor of the attribute.
 * @param {Object} target 
 * @param {string} attrName 
 */
function getAttrDesc(target, attrName) {
  return target.__extag_descriptors__ ? target.__extag_descriptors__[attrName] : null;
}

export default function Accessor() {
  throwError('Accessor is a partial class for mixins and can not be instantiated');
}

defineClass({
  constructor: Accessor,

  statics: {
    getAttrDesc: getAttrDesc,
    defineGetterSetter: defineGetterSetter,
    getAttributeDefaultValue: getAttributeDefaultValue,
    getAttributeDefaultValues: getAttributeDefaultValues,
    applyAttributeDescriptors: applyAttributeDescriptors
  },

  // eslint-disable-next-line no-unused-vars
  get: function get(key) {
    throwError('Method `get` must be implemented by sub-class');
  },

  // eslint-disable-next-line no-unused-vars
  set: function set(key, value) {
    throwError('Method `set` must be implemented by sub-class');
  },

  assign: function assign(props) {
    for (var key in props) {
      if (hasOwnProp.call(props, key)) {
        this.set(key, props[key]);
      }
    }
  }
});