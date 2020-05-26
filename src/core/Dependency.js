// src/core/Dependency.js

// refer to Vue (https://vuejs.org/)
var _binding;
var _bindingStack = [];

var Dependency = {
  // binding: function() {
  //   return _binding != null;
  // },
  begin: function begin(binding) {
    _binding = binding;
    _binding.depsCountNew = 0;
    _binding.depsCountOld = 0;
    _binding.executeTimes = _binding.executeTimes ? _binding.executeTimes + 1 : 1;
    _bindingStack.push(binding);
  },
  end: function end() {
    if (_binding == null) { return; }
    // remove old dep
    if (_binding.depsCountOld < _binding.depsCount) {
      var i, dep, deps = _binding.deps;
      for (i = deps.length - 1; i >= 0; --i) {
        dep = deps[i];
        if (dep.times !== _binding.executeTimes) {
          dep.src.off('changed', _binding.invalidate);
          deps.splice(i, 1);
        }
      }
    }
    _binding.depsCount = _binding.depsCountOld + _binding.depsCountNew;
    //
    _bindingStack.pop();
    if (_bindingStack.length) {
      _binding = _bindingStack[_bindingStack.length - 1];
    }
  },
  add: function(src, key) {
    if (_binding == null) { return; }
    // collect keys
    var keys = _binding.keys;
    if (keys) {
      if (keys.indexOf(key) < 0) {
        keys.push(key);
      }
    } else {
      _binding.keys = [key];
    }
    // collect or update deps
    var i, dep, deps = _binding.deps;
    if (deps) {
      for (i = 0; i < deps.length; ++i) {
        dep = deps[i];
        if (dep.src === src) {
          if (dep.times < _binding.executeTimes) {
            dep.times = _binding.executeTimes;
            _binding.depsCountOld++;
          }
          return;
        }
      }
    } else {
      deps = _binding.deps = [];
    }
    // add new dep
    _binding.depsCountNew++;
    src.on('changed', _binding.invalidate);
    deps.push({
      src: src,
      times: _binding.executeTimes
    })
  },
  clean: function(binding) {
    var deps = binding.deps;
    if (!deps) { return; }
    for (var i = 0; i < deps.length; ++i) {
      deps[i].src.off('changed', binding.invalidate);
    }
    binding.deps = null;
    binding.keys = null;
  }
};

export default Dependency;


