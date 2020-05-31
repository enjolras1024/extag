/* eslint-disable no-unused-vars */
// src/core/Schedule.js

import { isNativeFunc } from 'src/share/functions'
import logger from 'src/share/logger';

var setImmediate = (function(Promise, MutationObserver, requestAnimationFrame) {
  if (Promise) {
    var p = Promise.resolve();
    return function(callback) {
      if (typeof callback === 'function') {
        p.then(callback);
      }
    }
  }

  if (MutationObserver) {
    var cbs = [];
    var flag = 0;
    var text = document.createTextNode('');
    var observer = new MutationObserver(function() {
      var callback;

      while ((callback = cbs.pop())) {
        callback();
      }

      flag = flag ? 0 : 1;
    });

    observer.observe(text, {
      characterData: true
    });

    return function(callback) {
      if (typeof callback === 'function') {
        cbs.unshift(callback);
        text.data = flag;
      }
    }
  }

  if (requestAnimationFrame) {
    return function(callback) {
      if (typeof callback === 'function') {
        var fired = false;
        var cb = function() {
          if (fired) return;
          fired = true;
          callback();
        }
        requestAnimationFrame(cb);
        // `requestAnimationFrame` does not run when the tab is in the background.
        // We use `setTimeout` as a fallback.
        setTimeout(cb);
      }
    }
  }

  return setTimeout;
})(
  typeof Promise !== 'undefined' && isNativeFunc(Promise) ? Promise : null,
  typeof MutationObserver !== 'undefined' && isNativeFunc(MutationObserver) ? MutationObserver : null,
  typeof requestAnimationFrame !== 'undefined' && isNativeFunc(requestAnimationFrame) ? requestAnimationFrame : null
);

var updateQueue = []; 
var renderQueue = [];
var callbackQueue = [];
var updateQueueCursor = 0;
var renderQueueCursor = 0;
var turn = 0;
// var 
var waiting = false;
var updating = false;
var rendering = false;

function flushQueues() {
  if (updating || !waiting) {
    return;
  }
  try {
    turn++;
    updating = true;
    updateQueueCursor = 0;

    var shell, i, n;
  
    // quene may be lengthen if the method `invalidate` is called when updating
    while (updateQueueCursor < updateQueue.length) {
      // if (updateQueueCursor > 999) {
      //   throw new Error('too much things to update');
      // }
      shell = updateQueue[updateQueueCursor];
      shell.update();
      ++updateQueueCursor;
    }
  
    
    updateQueue.length = 0;
    updateQueueCursor = 0;
    updating = false;
    waiting = false;
  
    rendering = true;
    renderQueueCursor = 0;
    while (renderQueueCursor < renderQueue.length) {
      // if (updateQueueCursor > 999) {
      //   throw new Error('too much things to update');
      // }
      shell = renderQueue[renderQueueCursor];
      shell.render();
      ++renderQueueCursor;
    }
  
    renderQueue.length = 0;
    renderQueueCursor = 0;
    rendering = false;
  
    for (i = callbackQueue.length - 1; i >= 0; --i) {
        callbackQueue[i]();
    }

    callbackQueue.length = 0;
  } catch (e) {
    updateQueueCursor = 0;
    renderQueueCursor = 0;
    updateQueue.length = 0;
    renderQueue.length = 0;
    callbackQueue.length = 0;
    rendering = false;
    updating = false;
    waiting = false;
    throw e;
  }
}

function binarySearch(id) {
  var i = 0, j = updateQueue.length - 1;
  while (i <= j) {
    var m = (i + j) >> 1;
    var guid = updateQueue[m].$meta.guid;
    if (id > guid) {
      i = m + 1;
    } else if (id < guid) {
      j = m - 1;
    } else {
      return i;
    }
  }
  return -i-1;
}

/**
 * Insert a shell into the updateQueue for updating accoring to its guid.
 * In order to rendering top-down (parent to child), 
 * parent's guid must be less than its children's. 
 * Indeed, component template engine obeys this rule. 
 * If you do not obey this rule when creating elements and component manually by yourself, 
 * rendering maybe wrong.
 * @param {Shell} shell
 */
function insertUpdateQueue(shell) {
  var i, n = updateQueue.length, id = shell.$meta.guid;

  if (n > updateQueueCursor && id > updateQueue[n-1].$meta.guid) {
    i = n;
  } else {
    var index = binarySearch(id);
    if (index < 0) {
      i = - index - 1;
    } else {
      return;
    }
  }

  if (i === n) {
    updateQueue.push(shell);
  } else {
    updateQueue.splice(i, 0, shell);
  }

  if (!waiting) {
    waiting = true;
    setImmediate(flushQueues);
  }
}

/**
   * Insert a shell into the renderQueue.
   * @param {Shell} shell 
   */
  function insertRenderQueue(shell) {
    var i, n = renderQueue.length, id = shell.$meta.guid;

    if (!rendering) {
      i = n - 1;
      while (i >= 0 && id < renderQueue[i].$meta.guid) {
        --i;
      }
      ++i;
    } else {
      i = renderQueueCursor + 1;
      while (i < n && id >= renderQueue[i].$meta.guid) {
        ++i;
      }
    }

    if (i === n) {
      renderQueue.push(shell);
    } else {
      renderQueue.splice(i, 0, shell);
    }
  }


/**
 * Push a callback function into callbackQueue
 * @param {Function} func 
 */
function pushCallbackQueue(callback) {
  callbackQueue.push(callback);
}

export default {
  setImmediate: setImmediate,
  insertUpdateQueue: insertUpdateQueue,
  insertRenderQueue: insertRenderQueue,
  pushCallbackQueue: pushCallbackQueue
};