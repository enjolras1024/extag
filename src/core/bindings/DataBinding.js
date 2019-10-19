// src/core/bindings/DataBinding.js

// import Dep from 'src/core/Dep'
// import RES from 'src/base/RES'
import Path from 'src/base/Path'
import Accessor from 'src/base/Accessor'
import Dependency from 'src/core/Dependency'
import Store from 'src/core/models/Store'
import Binding from 'src/core/bindings/Binding'
import { defineClass } from 'src/share/functions'
import { CONTEXT_SYMBOL, FLAG_CHANGED } from 'src/share/constants'

var MODES = { ASSIGN: -1, ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2, ANY_WAY: 3 };

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
        scopes[0].off('update', binding.exec);
      }

      Dependency.clean(binding);
      
      Binding.remove(target, binding);

      // delDeps(binding);
    }
  },

  link: function(property, target, scopes) {
    this.flag = 0;
    this.sync = true;
    this.scopes = scopes;
    this.target = target;
    this.targetProp = property;

    if (this.mode === MODES.ASSIGN) {
      // Binding.assign(this.target, this.targetProp, this.eval(), this);
      this.target.set(this.targetProp, this.eval());
      return;
    }

    this.exec = this.exec.bind(this);
    this.invalidate = this.invalidate.bind(this);

    // if (this.mode === MODES.ANY_WAY) {
    //   this.sync = false;
    //   this.scopes[0].on('update', this.exec);
    // } else {
    //   addDeps(this);
    //   var deps = this.deps;
    //   if (deps && deps.length) {
    //     Binding.record(target, this);
    //     if (deps.length > 1) {
    //       this.sync = false;
    //       this.scopes[0].on('update', this.exec);
    //     }
    //   }
    // }

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

    // Binding.assign(this.target, this.targetProp, this.eval(), this);
    // this.target.set(this.targetProp, this.eval());
    
    if (this.mode === MODES.ANY_WAY) {
      this.sync = false;
      this.scopes[0].on('update', this.exec);
      this.target.set(this.targetProp, this.eval());
    } else {
      this.sync = true;
      this.flag = 1;
      this.exec();
      
      // Dependency.begin(this);
      // this.target.set(this.targetProp, this.eval());
      // Dependency.end();
      var deps = this.deps;
      var keys = Object.keys(deps);
      if (deps && keys.length) {
        Binding.record(target, this);
        if (keys.length > 1) {
          this.sync = false;
          this.scopes[0].on('update', this.exec);
        } //else if (this.paths.length == 1 && /0/.test(this.paths[0])) {
          // var desc = Accessor.getAttrDesc()
        //}
      }
    }
  },

  eval: function(back) {
    if (this.mode === MODES.TWO_WAY) {
      // if (converters && converters.length) {
      //   if (back) {
      //     return converters[1].execute(this.scopes, this.target[this.targetProp]);
      //   } else {
      //     return converters[0].execute(this.scopes, this.source[this.sourceProp]);
      //   }
      // } else {
        if (back) {
          return this.target[this.targetProp];
        } else {
          return this.source[this.sourceProp];
        }
      // }
    } 

    var converters = this.converters;
    if (converters && converters.length) {
      return applyConverters(converters, this.scopes, this.evaluator.execute(this.scopes));
    } else {
      return this.evaluator.execute(this.scopes);
    }
  },

  exec: function exec() {
    if (this.flag === 0) {
      return;
    }
    // if (this.flag === 1) {
      Dependency.begin(this);
      var value = this.eval();
      Dependency.end();
      this.target.set(this.targetProp, value);
      // Binding.assign(this.target, this.targetProp, this.eval(), this);
    // } else if (this.flag === 2) {
    //   DataBinding.destroy(this);
    //   DataBinding.compile(this.pattern, this.targetProp, this.target, this.scopes);
    // }

    // if (this.flag > 1) {
      this.flag = 0;
    // }

    if (this.mode === MODES.ONE_TIME) {
      DataBinding.destroy(this);
    }
  },

  back: function back() {
    // Binding.assign(this.source, this.sourceProp, this.eval(true), this);
    this.source.set(this.sourceProp, this.eval(true));
  },

  invalidate: function(flag) {
    // if (this.flag < flag) {
    //   this.flag = flag;
    // }
    this.flag = 1;
    // console.log('sync', this.sync, flag)
    if (this.sync) {
      this.exec();
    } else {
      this.scopes[0].invalidate(FLAG_CHANGED);
    }
  }
});

function depend(i, prop, paths, source) {
  var desc = Accessor.getAttrDesc(source, prop);

  if (desc && desc.depends) {
    var j, n, path, depends = desc.depends;

    for (j = 0, n = depends.length; j < n; ++j) {
      paths.push(CONTEXT_SYMBOL + '.' + depends[j]);
    }

    paths[i] = null;

    return true;
  }
}

function isBindable(src, prop) {
  var desc = Accessor.getAttrDesc(src, prop);
  return desc && desc.bindable;
}

// function isSingleBinding(binding) {
//   var paths = binding.paths;
//   if (paths.length !== 1) {
//     return false;
//   }
//   var path = Path.parse(paths[0]);
//   var index = binding.identifiers.indexOf(path[0]);
//   if (index < 0) {
//     return false;
//   }
//   var src = binding.scopes[index];
//   var count = 0;
//   for (var i = 1; i < path.length; ++i) {
//     if (!(src instanceof Object)) {
//       break;
//     }
//     var prop = path[i];
//     var desc = Accessor.getAttrDesc(src, prop);
//     if (desc && desc.bindable) {
//       if (desc.depends) {
//         return false;
//       }
//       ++count;
//       if (count > 1) {
//         return false;
//       }
//     }
//     src = src[prop];
//   }
//   return true;
// }

// function addDeps(binding) {
//   var identifiers = binding.identifiers;
//   var scopes =  binding.scopes;
//   var paths = binding.paths;
//   if (!scopes || !paths || !paths.length) { return; }

//   var i, j, k, path, temp, deps, desc, scope;
//   paths = paths.slice(0);
//   for (i = 0; i < paths.length; ++i) {
//     // path = paths[i];
//     // if (!path) {
//     //   continue;
//     // }

//     if (paths[i] == null) {
//       continue;
//     }

//     path = Path.parse(paths[i]);
//     k = identifiers.indexOf(path[0]);
//     if (k < 0) { continue; }
    
//     deps = [];
//     scope = scopes[k];

//     for (j = 1; j < path.length; ++j) {
//       if (!(scope instanceof Object)) {
//         break;
//       }
//       var dep = null;
//       temp = path[j];
//       if (isBindable(scope, temp)) {
//         dep = {
//           src: scope,
//           prop: temp,
//           index: j
//         };
//       }

//       if (dep && depend(i, dep.prop, paths, dep.src, path[0])) {
//         paths[i] = null;
//         dep = null;
//       }
//       if (dep) {
//         deps.push(dep);
//       }
//       scope = scope[temp];
//     }

//     for (j = 0; j < deps.length; ++j) {
//       dep = deps[j];
//       dep.func = 
//         (j === deps.length - 1) ? 
//         function() {
//           binding.invalidate(1);
//         } : 
//         function() {
//           binding.invalidate(2);
//         }
//       dep.src.on('changed.' + dep.prop, dep.func);
//     }

//     if (deps.length > 0) {
//       if (!binding.deps) {
//         binding.deps = [];
//       }
//       binding.deps.push.apply(binding.deps, deps);
//     }
//   }
// }

// function delDeps(binding) {
//   return;
//   var i, dep, deps = binding.deps;
//   if (deps) {
//     for (i = 0; i < deps.length; ++i) {
//       dep = deps[i];
//       dep.src.off('changed.' + dep.prop, dep.func);
//     }
//     deps.length = 0;
//     delete binding.deps;
//   }
// }

function applyConverters(converters, scopes, value) {
  for (var i = 0; i < converters.length; ++i) {
    value = converters[i].execute(scopes, value);
  }
  return value;
}

export default DataBinding