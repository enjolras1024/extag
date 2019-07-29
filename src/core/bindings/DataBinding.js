// src/core/bindings/DataBinding.js

// import Dep from 'src/core/Dep'
// import RES from 'src/base/RES'
import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Store from 'src/core/models/Store'
import Binding from 'src/core/bindings/Binding'
import { defineClass } from 'src/share/functions'
import { CONTEXT_SYMBOL, FLAG_CHANGED } from 'src/share/constants'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

export default function DataBinding(pattern) {
  this.pattern = pattern;
  // this.id = Binding.guid(8);
  this.flag = 0;
  // this.active = true;
  // this.mode = pattern.mode;
  // this.paths = pattern.paths;
  // this.event = pattern.event;
  // this.evaluator = pattern.evaluator;
  // this.converters = pattern.converters;
}

defineClass({
  constructor: DataBinding,
  statics: {
    MODES: MODES,

    create: function(pattern) {
      return new DataBinding(pattern);
    },

    compile: function(pattern, property, target, scopes) {
      return DataBinding.create(pattern).link(property, target, scopes);
    },

    destroy: function(binding) {
      var pattern = binding.pattern,
        source = binding.source,
        target = binding.target,
        scopes = binding.scopes;

      //if (mode === MODES.ONE_TIME) { return; }

      if (pattern.mode === MODES.TWO_WAY)  {
        // target.off && target.off('changed.' + binding.targetProp, binding.back);
        if (isBindable(binding.target, binding.targetProp)) {
          binding.target.off('changed.' + binding.targetProp, binding.back);
        }
      }

      scopes[0].off(binding.event ? binding.event : 'update', binding.exec);
      
      Binding.remove(target, binding);

      delDeps(binding);
    }
  },

  link: function(property, target, scopes) {
    var pattern = this.pattern;

    this.flag = 0;
    this.scopes = scopes;
    this.target = target;
    this.targetProp = property;

    // this.exec();

    if (pattern.mode === MODES.ASSIGN) {
      // this.invalidate(1);
      Binding.assign(this.target, this.targetProp, this.eval(), this);
      return;
    }

    // this.invalidate = this.invalidate.bind(this);

    this.exec = this.exec.bind(this); // TODO: use different exec in different mode

    var event = pattern.event;
    if (event) {
      // Binding.record(target, this);
      // this.scopes[0].on(event, this.exec);
    } else {
      addDeps(this);
      if (this.deps) { // TODO: on different event according to deps
        Binding.record(target, this);
        this.scopes[0].on('update', this.exec);
      }
    }

    if (pattern.mode === MODES.TWO_WAY) {
      this.back = this.back.bind(this);
      var path = Path.parse(pattern.paths[0]);
      var from = pattern.identifiers.indexOf(path[0]);
      if (from < 0) {

      }
      this.sourceProp = path[path.length - 1];
      this.source = Path.search(path.slice(1, path.length - 1), scopes[from], true);

      if (isBindable(this.target, this.targetProp)) {
        this.target.on('changed.' + this.targetProp, this.back);
      }
    }

    // this.exec();
    // this.invalidate(1);
    Binding.assign(this.target, this.targetProp, this.eval(), this);
  },

  eval: function(back) {
    var pattern = this.pattern;
    var converters = pattern.converters;

    if (pattern.mode === MODES.TWO_WAY) {
      if (converters && converters.length) {
        if (back) {
          return converters[1].compile(this.scopes, this.target[this.targetProp]);
        } else {
          return converters[0].compile(this.scopes, this.source[this.sourceProp]);
        }
      } else {
        if (back) {
          return this.target[this.targetProp];
        } else {
          return this.source[this.sourceProp];
        }
      }
    } 

    if (converters && converters.length) {
      return applyConverters(converters, this.scopes, pattern.evaluator.compile(this.scopes));
    } else {
      return pattern.evaluator.compile(this.scopes);
    }
  },

  exec: function exec() {
    // console.log('exec', this.flag, this.targetProp, this.target.toString(), this.pattern.event)
    if (!this.pattern.event && !this.flag) {
      return;
    }
    
    

    if (this.flag > 1) {
      DataBinding.destroy(this);
      DataBinding.compile(this.pattern, this.targetProp, this.target, this.scopes);
    } else {
      Binding.assign(this.target, this.targetProp, this.eval(), this);
    }
    // console.log(this.target, this.targetProp, this.target[this.targetProp]);
    // if (this.flag > 1) {
      this.flag = 0;
    // }

    if (this.pattern.mode === MODES.ONE_TIME) {
      this.scopes[0].off('update', this.exec);
    }
  },

  back: function back() {
    Binding.assign(this.source, this.sourceProp, this.eval(true), this);
  },

  invalidate: function(flag) {
    // console.log('invalidate', flag, this.targetProp, this.target.toString())
    this.scopes[0].invalidate(FLAG_CHANGED);
    if (this.flag < flag) {
      this.flag = flag;
    }
  }
});

function depend(i, prop, paths, source, origin) {
  // var descriptors = source.__extag_descriptors__;

  var desc = Accessor.getAttrDesc(source, prop); //descriptors && descriptors[prop];

  if (desc && desc.depends) {
    var j, n, path, depends = desc.depends;

    for (j = 0, n = depends.length; j < n; ++j) {
      // path = Path.parse(depends[j]); 
      // path.unshift(origin);
      // paths.push(path);
      paths.push(CONTEXT_SYMBOL + '.' + depends[j]);
    }

    paths[i] = null;

    return true;
  }
}

function isBindable(src, prop) {
  var desc = Accessor.getAttrDesc(src, prop);
  return (desc && desc.bindable) || src instanceof Store;
}

function addDeps(binding) {
  var pattern = binding.pattern;
  var identifiers = pattern.identifiers;
  var paths = pattern.paths;
  var scopes =  binding.scopes;
  if (!scopes || !paths || !paths.length) { return; }
  // Dep.begin(binding);
  var i, j, k, path, temp, deps, desc, scope;
  paths = paths.slice(0);
  for (i = 0; i < paths.length; ++i) {
    // path = paths[i];
    // if (!path) {
    //   continue;
    // }

    if (paths[i] == null) {
      continue;
    }

    path = Path.parse(paths[i]);
    k = identifiers.indexOf(path[0]);
    if (k < 0) { continue; }
    
    deps = [];
    scope = scopes[k];
    // console.log('path', path)
    for (j = 1; j < path.length; ++j) {
      if (!(scope instanceof Object)) {
        break;
      }
      var dep = null;
      temp = path[j];
      if (isBindable(scope, temp)) {
        dep = {
          src: scope,
          prop: temp,
          index: j
        };
      }

      if (dep && depend(i, dep.prop, paths, dep.src, path[0])) {
        paths[i] = null;
        dep = null;
      }
      if (dep) {
        deps.push(dep);
      }
      scope = scope[temp];
    }

    for (j = 0; j < deps.length; ++j) {
      dep = deps[j];
      dep.func = 
        (j === deps.length - 1) ? 
        function() {
          binding.invalidate(1);
        } : 
        function() {
          binding.invalidate(2);
        }
      dep.src.on('changed.' + dep.prop, dep.func);
    }

    if (deps.length > 0) {
      if (!binding.deps) {
        binding.deps = [];
      }
      binding.deps.push.apply(binding.deps, deps);
    }
  }
  // Dep.end();
  // return flag;
}

function delDeps(binding) {
  var i, dep, deps = binding.deps;
  for (i = 0; i < deps.length; ++i) {
    dep = deps[i];
    dep.src.off('changed.' + dep.prop, dep.func);
  }
  deps.length = 0;
  delete binding.deps;
}

function applyConverters(converters, scopes, value) {
  if (!converters || !converters.length) { return value; }
  for (var i = 0; i < converters.length; ++i) {
    value = converters[i].compile(scopes, value);
  }
  return value;
}