// src/core/bindings/TextBinding.js

import Cache from 'src/core/models/Cache'
import Dependency from 'src/core/Dependency'
import DirtyMarker from 'src/base/DirtyMarker'
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import { applyEvaluator } from 'src/core/bindings/DataBinding'
import Expression from 'src/core/template/Expression'
import { defineClass, slice } from 'src/share/functions'

var DATA_BINDING_MODES = DataBinding.MODES;

export default function TextBinding(pattern) {
  this.pattern = pattern;
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
    this.scopes = scopes;
    this.target = target;
    this.property = property;

    this.flag = 1;
    this.mode = DATA_BINDING_MODES.ASSIGN;

    var i, n, piece, pattern = this.pattern;

    for (i = 0, n = pattern.length; i < n; ++i) {
      piece = pattern[i];
      if (piece instanceof Expression && 
          piece.pattern.mode !== DATA_BINDING_MODES.ASSIGN) {
        this.mode = piece.pattern.mode;
        if (this.mode === DATA_BINDING_MODES.ANY_WAY) {
          break;
        }
      }
    }

    if (this.mode === DATA_BINDING_MODES.ASSIGN) {
      this.execute();
      return;
    }

    this.invalidate = this.invalidate.bind(this);
    this.execute = this.execute.bind(this);
    
    this.execute();

    scopes[0].on('updating', this.execute);

    Binding.record(target, this);
  },

  replace: function replace(scopes) {
    if (scopes.length > 1 && scopes.length === this.scopes.length) {
      this.scopes = scopes;
      this.flag = 1;
      this.execute();
    }
  },

  destroy: function destroy() {
    this.scopes[0].off('updating', this.execute);
    Dependency.clean(this);
  },

  execute: function execute() {
    if (this.flag === 0 && this.mode !== DATA_BINDING_MODES.ANY_WAY) {
      return;
    }

    Dependency.begin(this);

    var i, n, piece, cache = [], pattern = this.pattern;

    for (i = 0, n = pattern.length; i < n; ++i) {
      piece = pattern[i];
      if (piece instanceof Expression) {
        piece = applyEvaluator(piece.pattern, this.scopes);
      }
      cache.push(piece);
    }

    Dependency.end();

    this.target.set(this.property, cache.join(''));

    this.flag = 0;
  },

  invalidate: function invalidate(key) {
    if (this.keys && this.keys.indexOf(key) >= 0) {
      this.scopes[0].invalidate();
      this.flag = 1;
    }
  }
});