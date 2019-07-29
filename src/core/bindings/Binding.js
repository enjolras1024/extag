// src/core/bindings/Binding.js

import  { defineProp, defineClass } from 'src/share/functions'

// var LETTERS = '0123456789ABCDEFGHIGKLMOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz';

export default defineClass({
  constructor: function Binding() {},

  statics: {
    // guid: function guid(length) {
    //   // var LETTERS = '0123456789ABCDEFGHIGKLMOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz';
    //   var r = Math.random() * Math.pow(10, length), i = Date.now() % 1000, s = '';
    //   while (s.length < length) {
    //     i += r % 10;
    //     s += LETTERS.charAt(i % LETTERS.length);
    //     r = (r - r % 10) / 10;
    //   }
    //   return s;
    // },
    assign: function assign(target, key, val, binding) {
      if (binding.locked) {
        return;
      }
      binding.locked = true;
      if (target.set) {
        target.set(key, val);
      } else {
        target[key] = val;
      }
      binding.locked = false;
    },

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
    },

    search: function search(target, targetProp) {
      var _bindings = target._bindings;
      
      if (_bindings && _bindings.length) {
        for (var i = _bindings.length - 1; i >= 0; --i) {
          if (_bindings[i].targetProp === targetProp) {
            return _bindings[i];
          }
        }
      }
    }
  }
});
  