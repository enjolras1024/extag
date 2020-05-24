// src/core/bindings/FragmentBinding.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import Binding from 'src/core/bindings/Binding'
import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import { defineClass, slice } from 'src/share/functions'

// var Array$join = Array.prototype.join;

export default function FragmentBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  /**
   * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
   */
  constructor: FragmentBinding,

  statics: {
    // create: function(pattern) {
    //   return new FragmentBinding(pattern);
    // },

    compile: function(pattern, property, target, scopes) {
      (new FragmentBinding(pattern)).link(property, target, scopes);
    },

    destroy: function(binding) {
      binding.scopes[0].off('updating', binding.exec);

      var bindings = binding.cache._bindings;

      if (bindings) {
        for (var i = bindings.length - 1; i >= 0; --i) {
          DataBinding.destroy(bindings[i]);
        }
      }

      Binding.remove(binding.target, binding);
    }
  },

  link: function(property, target, scopes) {
    var i, n, piece, pattern = this.pattern;

    this.scopes = scopes;
    this.target = target;
    this.property = property;

    var cache = this.cache = new Cache(scopes[0]);

    for (i = 0, n = pattern.length; i < n; ++i) {
      piece = pattern[i];
      if (piece instanceof Expression) {
        piece.compile(i, cache, scopes);
      } else {
        cache.set(i, piece);
      } 
    }

    cache.set('length', n);

    Binding.record(target, this);

    this.exec();

    this.exec = this.exec.bind(this);

    scopes[0].on('updating', this.exec);
  },

  exec: function() {
    var cache = this.cache;

    if (!cache.hasDirty()) { return; }

    var value = slice.call(cache._props, 0);

    if (this.pattern.asStr) {
      value = value.join('');
    }

    this.target.set(this.property, value);

    DirtyMarker.clean(cache);
  }
});