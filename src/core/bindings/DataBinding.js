// src/core/bindings/DataBinding.js

import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import { defineClass } from 'src/share/functions'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

export function applyConverters(converters, scopes, value) {
  for (var i = 0; i < converters.length; ++i) {
    value = converters[i].execute(scopes, value);
  }
  return value;
}

export function applyEvaluator(pattern, scopes) {
  if (pattern.converters && pattern.converters.length) {
    return applyConverters(
      pattern.converters, 
      scopes, 
      pattern.evaluator.execute(scopes)
    );
  } else {
    return pattern.evaluator.execute(scopes);
  }
}

function DataBinding(pattern) {
  this.pattern = pattern;
  // this.mode = pattern.mode;
  // this.evaluator = pattern.evaluator;
  // this.converters = pattern.converters;
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

    var pattern = this.pattern;

    if (pattern.mode === MODES.ASSIGN) {
      this.target.set(this.targetProp, applyEvaluator(pattern, scopes));
      return;
    }

    this.execute = this.execute.bind(this);
    this.invalidate = this.invalidate.bind(this);

    if (pattern.mode === MODES.TWO_WAY) {
      this.backward = this.backward.bind(this);
      if (Accessor.getAttrDesc(this.target, this.targetProp)) {
        this.target.on('changed', this.backward);
      }
    }

    // if (pattern.mode === MODES.ANY_WAY) {
    //   this.scopes[0].on('updating', this.execute);
    //   this.target.set(this.targetProp, applyEvaluator(pattern, scopes));
    // } else {
    //   this.flag = 1;
    //   this.execute();
    //   if (this.keys && this.keys.length) {
    //     scopes[0].on('updating', this.execute);
    //   }
    // }
    this.flag = 1;
    this.execute();
    scopes[0].on('updating', this.execute);

    Binding.record(target, this);
  },

  replace: function replace(scopes) {
    if (scopes.length > 1 && scopes.length === this.scopes.length) {
      var diff;
      for (var i = scopes.length - 1; i >= 0; --i) {
        if (scopes[i] !== this.scopes[i]) {
          diff = true;
          break;
        }
      }
      if (diff) {
        this.scopes = scopes;
        this.flag = 1;
        this.execute();
      }
    }
  },

  destroy: function destroy() {
    var scopes = this.scopes;

    if (this.pattern.mode === MODES.TWO_WAY)  {
      if (Accessor.getAttrDesc(this.target, this.targetProp)) {
        this.target.off('changed', this.backward);
      }
    }

    // if (this.keys && this.keys.length) {
      scopes[0].off('updating', this.execute);
    // }
    
    Dependency.clean(this);
  },

  // evaluate: function() {
  //   if (this.converters && this.converters.length) {
  //     return applyConverters(
  //       this.converters, 
  //       this.scopes, 
  //       this.evaluator.execute(this.scopes)
  //     );
  //   } else {
  //     return this.evaluator.execute(this.scopes);
  //   }
  // },

  execute: function execute() {
    var pattern = this.pattern;
    // if (pattern.mode === MODES.ANY_WAY) {
    //   this.target.set(this.targetProp, applyEvaluator(pattern, this.scopes));
    //   return;
    // }
    if (this.flag === 0 && pattern.mode !== MODES.ANY_WAY) {
      return;
    }

    Dependency.begin(this);
    var value = applyEvaluator(pattern, this.scopes);
    Dependency.end();
    this.target.set(this.targetProp, value);

    this.flag = 0;
    if (pattern.mode === MODES.ONE_TIME) {
      this.destroy();
    }
  },

  backward: function backward(key) {
    if (key === this.targetProp) {
      var value = this.target[this.targetProp];

      var path = this.pattern.evaluator.path;
      var from = path.from;
      var n = path.length;
      var scopes = this.scopes;
      var source;
      if (n === 2) {
        if (from >= 0) {
          source = scopes[from];
        } else {
          source = scopes[0].constructor.resources;
        }
        source.set(path[1], value);
      } else if (n > 2) {
        if (from >= 0) {
          source = Path.search(path.slice(1, n - 1), scopes[from], true);
        } else {
          source = Path.search(path.slice(1, n - 1), scopes[0].constructor.resources, true);
        }
        source.set(path[n - 1], value);
      }
    }
  },

  invalidate: function invalidate(key) {
    if (this.keys && this.keys.indexOf(key) >= 0) {
      this.scopes[0].invalidate();
      this.flag = 1;
    }
  }
});

export default DataBinding