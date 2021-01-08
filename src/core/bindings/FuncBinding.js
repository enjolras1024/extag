// src/core/bindings/FuncBinding.js

import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import { applyEvaluator } from 'src/core/bindings/DataBinding'
import { defineClass } from 'src/share/functions'

var DATABIDING_MODES = DataBinding.MODES;

function FuncBinding(pattern) {
  this.pattern = pattern;
}

defineClass({
  constructor: FuncBinding,
  statics: {
    create: function create(pattern) {
      return new FuncBinding(pattern);
    }
  },

  connect: function connect(method, target, scopes) {
    this.flag = 0;
    this.scopes = scopes;
    this.target = target;
    this.method = typeof method === 'function' ? method : target[method];

    var pattern = this.pattern;

    if (pattern.mode === DATABIDING_MODES.ASSIGN) {
      this.target.set(this.targetProp, applyEvaluator(pattern, scopes));
      return;
    }

    this.execute = this.execute.bind(this);
    this.invalidate = this.invalidate.bind(this);

    this.flag = 1;
    this.execute();
    scopes[0].on('updating', this.execute);

    Binding.record(target, this);
  },

  destroy: function destroy() {
    // if (this.keys && this.keys.length) {
      this.scopes[0].off('updating', this.execute);
    // }
    
    Dependency.clean(this);
  },

  execute: function execute() {
    var pattern = this.pattern;
    if (this.flag === 0 && pattern.mode !== DATABIDING_MODES.ANY_WAY) {
      return;
    }

    Dependency.begin(this);
    var value = applyEvaluator(pattern, this.scopes);
    Dependency.end();
    this.method.call(this.target, value, this.scopes);

    this.flag = 0;
    if (pattern.mode === DATABIDING_MODES.ONE_TIME) {
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

export default FuncBinding