// src/base/Validator.js

import { hasOwnProp } from 'src/share/functions'
import Accessor from 'src/base/Accessor'
import logger from 'src/share/logger'

function getType(value) {
  if (value instanceof Object) {
    var constructor = value.constructor;
    return  constructor.fullName || constructor.name;
  }

  return typeof value;
}

function makeTypeError(constructorName, propertyName, expectedType, actualType) {
  return ('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
    '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
}

function makeTypesError(constructorName, propertyName, expectedTypes, actualType) {
  var types = [];
  for (var i = 0, n = expectedTypes.length; i < n; ++i) {
    types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
  }

  return ('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
    '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
}

/**
 * Validate the type of the value when the key is set in target.
 *
 * @param {Object} target
 * @param {string} key
 * @param {*} value
 * @param {string|Function} type
 * @returns {TypeError}
 */
function validateType(target, key, value, type) {
  var t = typeof type, error, constructor;

  if (t === 'string' && typeof value !== type) { //TODO: type can be array
    t = type;
    error = true;
  } else if (t === 'function' && !(value instanceof type)) {
    t = type.fullName || type.name;
    error = true;
  }

  if (error) {
    constructor = target.constructor;
    return makeTypeError(constructor.fullName || constructor.name, key, t, getType(value));
  } else if (Array.isArray(type)) {
    for (var i = 0, n = type.length; i < n; ++i) {
      t = typeof type[i];
      if ((t === 'string' && typeof value === type[i]) || (t === 'function' && value instanceof type[i])) {
        break;
      }
    }

    if (i === n) {
      constructor = target.constructor;
      return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
    }
  }
}

/**
 * Validate if the value matches the pattern.
 *
 * @param {Object} target
 * @param {string} key
 * @param {*} value
 * @param {RegExp} pattern
 * @returns {Error}
 */
function validatePattern(target, key, value, pattern) {
  if (!pattern.test(value)) {
    return (value + ' does not match the pattern ' + pattern.toString() + 
            ' of the property `' + key + '` in ' +  target.toString());
  }
}

/**
   * Check if there is a throuble when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {boolean} warn
   * @returns {boolean}
   */
function troubleShoot(target, key, value, warn) {
  var desc = Accessor.getAttrDesc(target, key);//target.__extag_descriptors__[key];

  if (!desc || !desc.type && !desc.test) { return; }

  var trouble, test, type;

  type = desc.type;
  //required = desc.required;
  if (/*!trouble && */type) {
    trouble = validateType(target, key, value, type);
  }

  if (trouble) {
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      warn && logger.warn('Attribute Validation:', trouble);
    }
    return trouble;
  }

  test = desc.test; // TODO: desc.test
  if (test) {
    if (typeof test === 'function') {
      trouble = test.call(target, value, key);
    } else {
      trouble = validatePattern(target, key, value, test);
    }
  }

  if (trouble) {
    // eslint-disable-next-line no-undef
    if ( __ENV__ === 'development') {
      warn && logger.warn('Attribute Validation:', trouble);
    }
    return trouble;
  }
}

/**
 * Validator provides the `validate()` method.
 *
 * @example A constructor has attributes:
 *
 *  {
 *    name: 'string',
 *    list: Array,
 *    date: {
 *      type: [Date, 'number', 'string']
 *    },
 *    phone: {
 *      test: /\d{13}/
 *    },
 *    price: {
 *      type: 'number',
 *      test: function() {...} // returns error or not
 *    }
 *  }
 *
 *
 */
export default {
  validate0: function(target, props) {
    var key, desc;
    var descriptors = target.__extag_descriptors__;
    for (key in descriptors) {
      desc = descriptors[key];
      if (desc.required && (!props || !hasOwnProp.call(props, key))) {
        logger.warn('Attribute Validation:', 'required `' + key + '` for ' + (target.constructor.fullName || target.constructor.name));
      }
    }
  },
  /**
   * Validate the value when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {boolean} warn
   * @returns {boolean}
   */
  validate: function validate(target, key, value, warn) {
    return !troubleShoot(target, key, value, warn);
  },
  /**
   * Check if there is a throuble when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  troubleShoot: troubleShoot
};