//######################################################################################################################
// src/base/Schedule.js
//######################################################################################################################
//(function() {
  import { setImmediate } from 'src/share/functions'
  
  var buffers = [[], []], updaters = [], cursor = 0, index = 0, waiting = false, running = false;

  function run() {
    cursor = 0;
    running = true;

    var target;

    while (cursor < updaters.length) {
      target = updaters[cursor];
      target.update();
      ++cursor;
    } // updater.exec.apply(null, updater.args);

    cursor = 0;
    updaters.length = 0;  // updaters.splice(0);
    running = false;
    waiting = false;

    var renderers = buffers[index];
    
    index = index ? 0 : 1;

    for (var i = 0, n = renderers.length; i < n; ++i) {
      target = renderers[i];
      target.render();
    }

    // for (var i = renderers.length - 1; i >= 0; --i) {
    //   target = renderers[i];
    //   target.finish();
    // }

    for (var i = renderers.length - 1; i >= 0; --i) {
      target = renderers[i];
      if (target.onRendered && target.$skin) {
        target.onRendered(target.$skin);
      }
    }

    renderers.length = 0;   // renderers.splice(0);
  }

  export default {
    /**
     * target to be inserted must have `guid` and method `update`
     * @param {Object} target
     */
    insert: function(target) {
      //if (!target || !target.update) { return; }
      var i, n = updaters.length, id = target.guid;

      if (!running) {
        i = n - 1;
        while (i >= 0 && id < updaters[i].guid) {
          --i;
        }
        ++i;
      } else {
        i = cursor + 1;
        while (i < n && id >= updaters[i].guid) {
          ++i;
        }
      }

      updaters.splice(i, 0, target);

      if (!waiting) {
        waiting = true;
        setImmediate(run);
      }
    },

    /**
     * target to be appended must have method `render`
     * @param {Object} target
     */
    append: function(target) {
      //if (!target || !target.render) { return; }
      var renderers = buffers[index];
      renderers.push(target);
    }
  };
//})();
