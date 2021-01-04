// src/core/bindings/Binding.js

import  { defineClass } from 'src/share/functions'
import Dependency from 'src/core/Dependency'

function Binding(scope, produce, consume) {
  this.scope = scope;
  this.produce = produce;
  this.consume = consume;
  this.execute = this.execute.bind(this);
  this.invalidate = this.invalidate.bind(this);
  this.flag = 1;
  this.execute();
  this.scope.on('updating', this.execute);
}

defineClass({
  constructor: Binding,

  statics: {
     record: function record(target, binding) {
      var _bindings = target._bindings;

      if (_bindings) {
        _bindings.push(binding);
      } else {
        target._bindings = [binding];
        // defineProp(target, '_bindings', {
        //   value: [binding], writable: false, enumerable: false, configurable: true
        // });
      }
    },

    remove: function remove(target, binding) {
      var _bindings = target._bindings;

      if (_bindings && _bindings.length) {
        _bindings.splice(_bindings.lastIndexOf(binding), 1);
      }
    },

    create: function(scope, produce, consume) {
      return new Binding(scope, produce, consume);
    }
  },

  destroy: function() {
    this.scope.off('updating', this.execute);
    Dependency.clean(this);
  },

  execute: function() {
    if (this.flag === 0) {
      return;
    }
    Dependency.begin(this);
    var value = this.produce.call(this.scope);
    Dependency.end();
    this.consume.call(this.scope, value);
    this.flag = 0;
  },

  invalidate: function(key) {
    if (this.keys.indexOf(key) >= 0) {
      this.scope.invalidate();
      this.flag = 1;
    }
  }
});

export default Binding
  