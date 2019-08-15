// src/core/bindings/Binding.js

import  { defineProp, defineClass } from 'src/share/functions'

export default defineClass({
  constructor: function Binding() {},

  statics: {
    // assign: function assign(target, key, val, binding) {
    //   if (binding.locked) {
    //     return;
    //   }
    //   binding.locked = true;
    //   if (target.set) {
    //     target.set(key, val);
    //   } else {
    //     target[key] = val;
    //   }
    //   binding.locked = false;
    // },

    record: function record(target, binding) {
      var _bindings = target._bindings;

      if (_bindings) {
        _bindings.push(binding);
      } else {
        defineProp(target, '_bindings', {
          value: [binding], writable: false, enumerable: false, configurable: true
        });
      }
    },

    remove: function remove(target, binding) {
      var _bindings = target._bindings;

      if (_bindings && _bindings.length) {
        _bindings.splice(_bindings.lastIndexOf(binding), 1);
      }
    }
  }
});
  