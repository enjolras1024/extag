// src/core/bindings/DataBinding.js

import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import { defineClass } from 'src/share/functions'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

function applyConverters(converters, scopes, value) {
  for (var i = 0; i < converters.length; ++i) {
    value = converters[i].execute(scopes, value);
  }
  return value;
}

function resolveSource(binding, scopes, identifiers) {
  var path = binding.path;
  var from = identifiers.indexOf(path[0]);
  binding.sourceProp = path[path.length - 1];
  if (from >= 0) {
    binding.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);
  } else {
    binding.source = Path.search(path.slice(1, path.length - 1), scopes[0].constructor.resources, true);
  }
}

// function isBindable(src, prop) {
//   var desc = Accessor.getAttrDesc(src, prop);
//   return desc && desc.bindable;
// }

function DataBinding(pattern) {
  this.mode = pattern.mode;
  this.path = pattern.path;
  this.paths = pattern.paths;
  this.evaluator = pattern.evaluator;
  this.converters = pattern.converters;
  this.identifiers = pattern.identifiers;
}

defineClass({
  constructor: DataBinding,
  statics: {
    MODES: MODES,
    create: function create(pattern) {
      return new DataBinding(pattern);
    }
  },

  connect: function connect(property, target, scopes) {
    this.flag = 0;
    this.scopes = scopes;
    this.target = target;
    this.targetProp = property;

    if (this.mode === MODES.ASSIGN) {
      this.target.set(this.targetProp, this.evaluate());
      return;
    }

    this.execute = this.execute.bind(this);
    this.invalidate = this.invalidate.bind(this);

    if (this.mode === MODES.TWO_WAY) {
      this.backward = this.backward.bind(this);
      resolveSource(this, scopes, this.identifiers);
      if (Accessor.getAttrDesc(this.target, this.targetProp)) {
        this.target.on('changed', this.backward);
      }
    }

    if (this.mode === MODES.ANY_WAY) {
      this.scopes[0].on('updating', this.execute);
      this.target.set(this.targetProp, this.evaluate());
    } else {
      this.flag = 1;
      this.execute();
      if (this.keys && this.keys.length) {
        scopes[0].on('updating', this.execute);
      }
    }

    Binding.record(target, this);
  },

  replace: function replace(scopes) {
    if (scopes.length > 1 && scopes.length === this.scopes.length) {
      if (this.mode === MODES.TWO_WAY) {
        resolveSource(this, scopes, this.identifiers);
      }
      this.scopes = scopes;
      this.flag = 1;
      this.execute();
    }

  },

  destroy: function destroy() {
    var scopes = this.scopes;

    if (this.mode === MODES.TWO_WAY)  {
      if (Accessor.getAttrDesc(this.target, this.targetProp)) {
        this.target.off('changed', this.backward);
      }
    }

    if (this.keys && this.keys.length) {
      scopes[0].off('updating', this.execute);
    }

    // Binding.remove(binding.target, binding);

    Dependency.clean(this);
  },

  evaluate: function() {
    var converters = this.converters;
    if (converters && converters.length) {
      return applyConverters(converters, this.scopes, this.evaluator.execute(this.scopes));
    } else {
      return this.evaluator.execute(this.scopes);
    }
  },

  execute: function execute() {
    if (this.mode === MODES.ANY_WAY) {
      this.target.set(this.targetProp, this.evaluate());
      return;
    }
    if (this.flag === 0) {
      return;
    }

    Dependency.begin(this);
    var value = this.evaluate();
    Dependency.end();
    this.target.set(this.targetProp, value);

    this.flag = 0;
    if (this.mode === MODES.ONE_TIME) {
      this.destroy();
    }
  },

  backward: function backward(key) {
    if (key === this.targetProp) {
      var value = this.target[this.targetProp];
      this.source.set(this.sourceProp, value);
    }
  },

  invalidate: function invalidate(key) {
    if (this.keys.indexOf(key) >= 0) {
      this.scopes[0].invalidate();
      this.flag = 1;
    }
  }
});

export default DataBinding