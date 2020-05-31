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
    this.execute = this.execute.bind(this);
    this.collect = collect;
    this.flag = 1;
    this.execute();
    
    if (this.keys && this.keys.length) {
      Binding.record(target, this);
      this.scope.on('updating', this.execute);
    }

    if (typeof reflect === 'function') {
      this.reflect = reflect;
      this.backward = this.backward.bind(this);
      target.on('changed', this.backward);
    }
  }
}

defineClass({
  constructor: Binding,

  statics: {
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
        target.off('changed', binding.backward);
      }
      
      if (typeof binding.collect === 'function' && binding.keys) {
        scope.off('updating', binding.execute);
      }

      Dependency.clean(binding);

      // Binding.remove(scope, binding);
    }
  },

  destroy: function() {
    var target = this.target, scope = this.scope;

    if (typeof this.reflect === 'function') {
      target.off('changed', this.backward);
    }
    
    if (typeof this.collect === 'function' && this.keys) {
      scope.off('updating', this.execute);
    }

    Dependency.clean(this);

    // Binding.remove(scope, binding);
  },

  execute: function() {
    if (this.flag === 0) {
      return;
    }
    Dependency.begin(this);
    var value = this.collect.call(this.scope);
    Dependency.end();
    this.target.set(this.property, value);
    this.flag = 0;
  },

  backward: function(key) {
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
  