// src/core/bindings/DataBinding.js

import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import { defineClass, append } from 'src/share/functions'
import logger from 'src/share/logger'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

var _applyEvaluator;
if (__ENV__ === 'development') { 
  _applyEvaluator = function _applyEvaluator(evaluator, scopes) {
    try {
      return evaluator.apply(scopes[0], scopes);
    } catch (e) {
      var constructor = scopes[0].constructor;
      logger.error('The expression `' + (evaluator.expr || evaluator.toString()) + 
                  '` failed in the template of component ' + (constructor.fullname || constructor.name));
      throw e;
    }
  }
} else {
  _applyEvaluator = function _applyEvaluator(evaluator, scopes) {
    return evaluator.apply(scopes[0], scopes);
  }
}

export function applyConverters(converters, scopes, value) {
  for (var i = 0; i < converters.length; ++i) {
    value = _applyEvaluator(converters[i], append(scopes, value));
  }
  return value;
}

export function applyEvaluator(pattern, scopes) {
  if (pattern.converters && pattern.converters.length) {
    return applyConverters(
      pattern.converters, 
      scopes, 
      _applyEvaluator(pattern.evaluator, scopes)
    );
  } else {
    return _applyEvaluator(pattern.evaluator, scopes) ;//pattern.evaluator.apply(scopes[0], scopes);
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
      var value = applyEvaluator(pattern, scopes);
      this.target.set(this.targetProp, value);
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

    this.flag = 1;
    this.execute();
    if ((this.deps && this.deps.length) || 
        pattern.mode === MODES.ANY_WAY) {
      scopes[0].on('updating', this.execute);
      Binding.record(target, this);
    }
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

  execute: function execute() {
    var pattern = this.pattern;
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