// src/core/bindings/Binding.js

import  { defineProp, defineClass } from 'src/share/functions'
import { FLAG_CHANGED } from 'src/share/constants'
import Dependency from 'src/core/Dependency'

function Binding(scope, target, property, collect, reflect) {
  this.scope = scope;
  this.target = target;
  this.property = property;

  if (typeof collect === 'function') {
    this.invalidate = this.invalidate.bind(this);
    this.exec = this.exec.bind(this);
    this.collect = collect;
    this.flag = 1;
    this.exec();
    
    if (this.keys && this.keys.length) {
      Binding.record(target, this);
      this.scope.on('updating', this.exec);
    }

    if (typeof reflect === 'function') {
      this.reflect = reflect;
      this.back = this.back.bind(this);
      target.on('changed', this.back);
    }
  }
}

defineClass({
  constructor: Binding,

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
        // target._bindings = [binding];
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

    create: function(scope, target, property, collect, reflect) {
      return new Binding(scope, target, property, collect, reflect);
    },

    destroy: function(binding) {
      var target = binding.target, scope = binding.scope;

      if (typeof binding.reflect === 'function') {
        target.off('changed', binding.back);
      }
      
      if (typeof binding.collect === 'function' && binding.keys) {
        scope.off('updating', binding.exec);
      }

      Dependency.clean(binding);

      // Binding.remove(scope, binding);
    }
  },

  exec: function() {
    if (this.flag === 0) {
      return;
    }
    Dependency.begin(this);
    var value = this.collect.call(this.scope);
    Dependency.end();
    this.target.set(this.property, value);
    this.flag = 0;
  },

  back: function(key) {
    if (key === this.property) {
      this.reflect.call(this.scope, this.target[this.property]);
    }
  },

  invalidate: function(key) {
    if (this.keys.indexOf(key) >= 0) {
      this.scope.invalidate(FLAG_CHANGED);
      this.flag = 1;
    }
  }
});

export default Binding
  