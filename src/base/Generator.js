// src/base/Generator.js

import { slice, defineClass } from 'src/share/functions'
import logger from 'src/share/logger'

/**
 * Generating a value for the property declared in component attributes.
 * @class
 * @constructor
 */
export default function Generator() {
  if (arguments.length > 1) {
    this.ctor = arguments[0];
    this.args = arguments[1];
  } else {
    this.gen = arguments[0];
  }
}

defineClass({
  constructor: Generator,
  statics: {
    /**
     * Get a new object
     * @param {Class} ctor
     */
    anew: function(ctor) {
      return new Generator(ctor, slice(arguments, 1));
    },
    /**
     * Get an instance
     * @param {Function} gen
     */
    inst: function(gen) {
      return new Generator(gen);
    }
  },
  /**
   * Default generator function for `anew`
   */
  gen: function() {
    var ctor = this.ctor;
    var args = this.args;
    if (!args) {
      return new ctor();
    } else {
      switch (args.length) {
        case 0:
          return new ctor();
          break;
        case 1:
          return new ctor(args[0]);
          break;
        case 2:
          return new ctor(args[0], args[1]);
          break;
        case 3:
          return new ctor(args[0], args[1], args[2]);
          break;
        case 4:
          return new ctor(args[0], args[1], args[2], args[3]);
          break;
        case 5:
          return new ctor(args[0], args[1], args[2], args[3], args[4]);
          break;
        default:
          if (__ENV__ === 'development') {
            logger.warn('Sorry but `anew` only supports 6 argumnets at most. Using `inst` instead.');
          }
          throw new Error('`anew` arguments length must not exceed 6.');
          // break;
      }
    }
  }
})