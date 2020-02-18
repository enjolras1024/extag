// src/core/Dependency.js

// refer to Vue (https://vuejs.org/)
var _binding;
var _bindingStack = [];

var Dependency = {
  binding: function() {
    return _binding != null;
  },
  begin: function begin(binding) {
    _binding = binding;
    _binding.execTimes = _binding.execTimes ? _binding.execTimes + 1 : 1;
    _binding.depsCountNew = 0;
    _binding.depsCountOld = 0;
    if (!_binding.deps) {
      _binding.deps = {};
    }
    _bindingStack.unshift(binding);
  },
  end: function end() {
    if (_binding == null) { return; }
    if (_binding.depsCountOld < _binding.depsCount) {
      var uid, dep;
      for (uid in _binding.deps) {
        dep = _binding.deps[uid];
        if (dep.cnt !== _binding.execTimes) {
          delete _binding.deps[uid];
          dep.src.off('changed.' + dep.key, _binding.invalidate);
        }
      }
    }
    _binding.depsCount = _binding.depsCountOld + _binding.depsCountNew;
    //
    _bindingStack.shift();
    _binding = _bindingStack[0];
  },
  add: function(src, key) {
    if (_binding == null) { return; }
    var uid = src.$guid + '.' + key;
    var dep = _binding.deps[uid];
    if (dep) {
      dep.cnt = _binding.execTimes;
      _binding.depsCountOld++;
    } else {
      src.on('changed.' + key, _binding.invalidate);
      _binding.depsCountNew++;
      _binding.deps[uid] = {
        src: src,
        key: key,
        cnt: _binding.execTimes
      }
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
    binding.deps = null;
  },
}

// var current = null;
// var newDeps = null;
// var oldDeps = null;
// var Dependency = {
//   binding: function() {
//     return current != null;
//   },
//   begin: function begin(binding) {
//     _bindingStack.unshift(binding);
//     oldDeps = binding.deps || {};
//     current = binding;
//     newDeps = {};
//   },
//   end: function end() {
//     if (current == null) { return; }
//     var oldUID, oldDep;
//     for (oldUID in oldDeps) {
//       if (!(oldUID in newDeps)) {
//         oldDep = oldDeps[oldUID];
//         oldDep.src.off('changed.' + oldDep.key, current.invalidate);
//       }
//     }
//     current.deps = newDeps;
//     current = null;
//     _bindingStack.shift();
//     current = _bindingStack[0];
//   },
//   add: function(src, key, chr) {
//     if (current == null) { return; }
//     var newUID = src.$guid + '.' + key;
//     if (newUID in oldDeps) {
//       newDeps[newUID] = oldDeps[newUID];
//     } else {
//       src.on('changed.' + key, current.invalidate);
//       newDeps[newUID] = {
//         src: src, 
//         key: key
//       };
//     }
//   },
//   clean: function(binding) {
//     var deps = binding.deps;
//     if (!deps) { return; }
//     var uid, dep;
//     for (uid in deps) {
//       dep = deps[uid];
//       dep.src.off('changed.' + dep.key, binding.invalidate);
//     }
//   },
// }

export default Dependency;


