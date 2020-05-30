// src/core/bindings/TextBinding.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import Expression from 'src/core/template/Expression'
import { defineClass, slice } from 'src/share/functions'

export default function TextBinding(pattern) {
  var pieces = this.pieces = [];
  for (var i = 0; i < pattern.length; ++i) {
    if (typeof pattern[i] === 'object') {
      pieces.push(new Expression(DataBinding, pattern[i]));
    } else {
      pieces.push(pattern[i]);
    }
  }
}

defineClass({
  /**
   * TextBinding is composed of strings and data-binding expressions.
   * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
   */
  constructor: TextBinding,

  statics: {
    create: function(pattern) {
      return new TextBinding(pattern);
    }
  },

  connect: function connect(property, target, scopes) {
    var i, n, piece, pieces = this.pieces;

    this.scopes = scopes;
    this.target = target;
    this.property = property;

    var cache = this.cache = new Cache(scopes[0]);

    for (i = 0, n = pieces.length; i < n; ++i) {
      piece = pieces[i];
      if (piece instanceof Expression) {
        piece.connect(i, cache, scopes);
      } else {
        cache.set(i, piece);
      } 
    }

    cache.set('length', n);

    this.execute();

    this.execute = this.execute.bind(this);

    scopes[0].on('updating', this.execute);

    Binding.record(target, this);
  },

  replace: function replace(scopes) {
    var bindings = this.cache._bindings;
    if (bindings) {
      for (var i = 0; i < bindings.length; ++i) {
        bindings[i].replace(scopes);
      }
    }
  },

  destroy: function destroy() {
    this.scopes[0].off('updating', this.execute);

    var bindings = this.cache._bindings;

    if (bindings) {
      for (var i = bindings.length - 1; i >= 0; --i) {
        bindings[i].destroy();
      }
      bindings.length = 0;
    }
    
    // Binding.remove(this.target, binding);
  },

  execute: function execute() {
    var cache = this.cache;

    if (!cache.hasDirty()) { return; }

    var value = slice.call(cache._props, 0);

    this.target.set(this.property, value.join(''));

    DirtyMarker.clean(cache);
  }
});