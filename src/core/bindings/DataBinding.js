// src/core/bindings/DataBinding.js
import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Dependency from 'src/core/Dependency'
import Binding from 'src/core/bindings/Binding'
import { defineClass } from 'src/share/functions'
import { FLAG_CHANGED } from 'src/share/constants'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

function applyConverters(converters, scopes, value) {
  for (var i = 0; i < converters.length; ++i) {
    value = converters[i].execute(scopes, value);
  }
  return value;
}

function isBindable(src, prop) {
  var desc = Accessor.getAttrDesc(src, prop);
  return desc && desc.bindable;
}

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

    // create: function(pattern) {
    //   return new DataBinding(pattern);
    // },

    compile: function(pattern, property, target, scopes) {
      return (new DataBinding(pattern)).link(property, target, scopes);
    },

    destroy: function(binding) {
      var target = binding.target, scopes = binding.scopes;

      if (binding.mode === MODES.TWO_WAY)  {
        if (isBindable(binding.target, binding.targetProp)) {
          binding.target.off('changed.' + binding.targetProp, binding.back);
        }
      }

      if (!binding.sync) {
        scopes[0].off('updating', binding.exec);
      }

      Binding.remove(target, binding);

      Dependency.clean(binding);
    }
  },

  link: function(property, target, scopes) {
    this.flag = 0;
    this.sync = true;
    this.scopes = scopes;
    this.target = target;
    this.targetProp = property;

    if (this.mode === MODES.ASSIGN) {
      this.target.set(this.targetProp, this.eval());
      return;
    }

    this.exec = this.exec.bind(this);
    this.invalidate = this.invalidate.bind(this);

    if (this.mode === MODES.TWO_WAY) {
      this.back = this.back.bind(this);
      var path = this.path;//Path.parse(this.path);
      var from = this.identifiers.indexOf(path[0]);
      this.sourceProp = path[path.length - 1];
      if (from >= 0) {
        this.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);
      } else {
        this.source = Path.search(path.slice(1, path.length - 1), scopes[0].constructor.resources, true);
      }
      
      if (isBindable(this.target, this.targetProp)) {
        this.target.on('changed.' + this.targetProp, this.back);
      }
    }

    if (this.mode === MODES.ANY_WAY) {
      this.sync = false;
      this.scopes[0].on('updating', this.exec);
      this.target.set(this.targetProp, this.eval());
    } else {
      this.sync = true;
      this.flag = 1;
      this.exec();
      if (this.depsCount > 0) {
        Binding.record(target, this);
      }
    }
  },

  eval: function(back) {
    if (this.mode === MODES.TWO_WAY) {
      if (back) {
        return this.target[this.targetProp];
      } else {
        return this.source[this.sourceProp];
      }
    } 

    var converters = this.converters;
    if (converters && converters.length) {
      return applyConverters(converters, this.scopes, this.evaluator.execute(this.scopes));
    } else {
      return this.evaluator.execute(this.scopes);
    }
  },

  exec: function exec() {
    if (this.mode === MODES.ANY_WAY) {
      this.target.set(this.targetProp, this.eval());
      return;
    }
    if (this.flag === 0) {
      return;
    }

    Dependency.begin(this);
    var value = this.eval();
    Dependency.end();
    this.target.set(this.targetProp, value);

    this.flag = 0;
    if (this.mode === MODES.ONE_TIME) {
      DataBinding.destroy(this);
    } else if (this.depsCount > 1 && this.sync) {
      this.scopes[0].on('updating', this.exec);
      this.sync = false;
    }
  },

  back: function back() {
    this.source.set(this.sourceProp, this.eval(true));
  },

  invalidate: function() {
    this.flag = 1;
    if (this.sync) {
      this.exec();
    } else {
      this.scopes[0].invalidate(FLAG_CHANGED);
    }
  }
});

export default DataBinding