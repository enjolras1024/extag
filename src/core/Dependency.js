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
      _binding.deps = [];
    }
    _bindingStack.unshift(binding);
  },
  end: function end() {
    if (_binding == null) { return; }
    if (_binding.depsCountOld < _binding.depsCount) {
      var i, dep, deps = _binding.deps;
      for (i = deps.length - 1; i >= 0; --i) {
        dep = deps[i];
        if (dep.cnt !== _binding.execTimes) {
          deps.splice(i, 1);
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
    var i, dep, oldDep;
    var deps = _binding.deps;
    if (deps.length) {
      for (i = 0; i < deps.length; ++i) {
        dep = deps[i];
        if (dep.key === key 
            && dep.src === src) {
          oldDep = dep;
          break;
        }
      }
    }
    if (oldDep) {
      _binding.depsCountOld++;
      oldDep.cnt = _binding.execTimes;
    } else {
      _binding.depsCountNew++;
      src.on('changed.' + key, _binding.invalidate);
      deps.push({
        src: src,
        key: key,
        cnt: _binding.execTimes
      })
    }
  },
  clean: function(binding) {
    var deps = binding.deps;
    if (!deps) { return; }
    var i, dep;
    for (i = 0; i < deps.length; ++i) {
      dep = deps[i];
      dep.src.off('changed.' + dep.key, binding.invalidate);
    }
    binding.deps.length = 0;
  }
};

export default Dependency;


