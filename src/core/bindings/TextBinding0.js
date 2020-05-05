//##############################################################################
// src/core/bindings/TextBinding.js
//##############################################################################
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import Cache from 'src/core/models/Cache'
import Expression from 'src/base/Expression'
import DirtyMarker from 'src/base/DirtyMarker'
import { defineClass } from 'src/share/functions'

var Array$join = Array.prototype.join;

export default function TextBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  /**
   * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
   */
  constructor: TextBinding,

  statics: {
    create: function(pattern) {
      return new TextBinding(pattern);
    },

    compile: function(pattern, property, target, scopes) {
      TextBinding.create(pattern).link(property, target, scopes);
    },

    destroy: function(binding) {
      binding.scopes[0].off('update', binding.exec);

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
    // cache.owner = scopes[0];

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

    scopes[0].on('update', this.exec);
  },

  exec: function() {
    var cache = this.cache;

    if (!cache.hasDirty()) { return; }

    Binding.assign(this.target, this.property, Array$join.call(cache._props, ''), this);

    DirtyMarker.clean(cache);
  }
});