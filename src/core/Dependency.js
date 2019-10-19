// src/core/Dependency.js

// refer to Vue (http://vuejs.org/)
var current = null;
var newDeps = null;
var oldDeps = null;

var Dependency = {
  binding: function() {
    return current != null;
  },
  begin: function begin(binding) {
    oldDeps = binding.deps || {};
    current = binding;
    newDeps = {};
  },
  end: function end() {
    if (current == null) { return; }
    var oldUID, oldDep;
    for (oldUID in oldDeps) {
      if (!(oldUID in newDeps)) {
        oldDep = oldDeps[oldUID];
        oldDep.src.off('changed.' + oldDep.key, current.invalidate);
      }
    }
    current.deps = newDeps;
    current = null;
  },
  add: function(src, key, chr) {
    if (current == null) { return; }
    var newUID = src.$guid + '.' + key;
    if (newUID in oldDeps) {
      newDeps[newUID] = oldDeps[newUID];
    } else {
      src.on('changed.' + key, current.invalidate);
      newDeps[newUID] = {
        src: src, 
        key: key
      };
    }
  },
  clean: function(binding) {
    var deps = binding.deps;
    if (!deps) { return; }
    var uid, dep;
    for (uid in deps) {
      dep = deps[uid];
      dep.src.off('changed.' + dep.key, binding.invalidate);
    }
  },
}

export default Dependency;


