// src/core/bindings/ClassBinding.js

import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import { applyEvaluator } from 'src/core/bindings/DataBinding'
import Expression from 'src/core/template/Expression'
import { defineClass, throwError } from 'src/share/functions'

var DATA_BINDING_MODES = DataBinding.MODES;

export default function ClassBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  /**
   * ClassBinding is composed of strings and data-binding expressions.
   * e.g. <a href#="https://www.abc.com/@{page}">Goto @{page}</a>
   */
  constructor: ClassBinding,

  statics: {
    create: function(pattern) {
      return new ClassBinding(pattern);
    }
  },

  connect: function connect(property, target, scopes) {
    this.scopes = scopes;
    this.target = target;
    this.property = property;

    this.flag = 1;

    var pattern = this.pattern;

    var name, expr;
    for (name in pattern) {
      expr = pattern[name];
      if (expr instanceof Expression) {
        if (this.mode != null && this.mode !== expr.pattern.mode) {
          throwError('all embedded expressions must have same data-binding mode for ClassBinding');
        }
        this.mode = expr.pattern.mode;
      }
    }

    if (this.mode == null || this.mode === DATA_BINDING_MODES.ASSIGN) {
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

    var name, expr, cache = {}, pattern = this.pattern;

    for (name in pattern) {
      expr = pattern[name];
      if (expr instanceof Expression) {
        expr = applyEvaluator(expr.pattern, this.scopes);
      }
      cache[name] = expr;
    }

    Dependency.end();

    this.target.set(this.property, cache);

    this.flag = 0;
    if (this.mode === DATA_BINDING_MODES.ONE_TIME) {
      this.destroy();
    }
  },

  invalidate: function invalidate(key) {
    if (this.keys && this.keys.indexOf(key) >= 0) {
      this.scopes[0].invalidate();
      this.flag = 1;
    }
  }
});