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
var digestQueue = [];
var callbackStack = [];
var updateQueueCursor = 0;
var digestQueueCursor = 0;
var waiting = false;
var turn = 0;

function flushQueues() {
  try {
    turn++;
    updateQueueCursor = 0;

    var shell, i;
  
    // quene may be lengthen if the method `invalidate` is called when updating
    while (updateQueueCursor < updateQueue.length) {
      shell = updateQueue[updateQueueCursor];
      shell.update();
      ++updateQueueCursor;
    }
  
    updateQueue.length = 0;
    updateQueueCursor = -1;

    digestQueueCursor = 0;
    while (digestQueueCursor < digestQueue.length) {
      shell = digestQueue[digestQueueCursor];
      shell.digest();
      ++digestQueueCursor;
    }

    digestQueue.length = 0;
    digestQueueCursor = -1;

    waiting = false;
  
    for (i = callbackStack.length - 1; i >= 0; --i) {
        callbackStack[i]();
    }

    callbackStack.length = 0;
  } catch (e) {
    updateQueueCursor = -1;
    digestQueueCursor = -1;
    updateQueue.length = 0;
    digestQueue.length = 0;
    callbackStack.length = 0;
    waiting = false;
    throw e;
  }
}

function binarySearch(id, i, j, queue) {
  var m, guid;
  while (i <= j) {
    m = (i + j) >> 1;
    guid = queue[m].$meta.guid;
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

  if (n > 0 && id > updateQueue[n-1].$meta.guid) {
    i = n;
  } /*else if (n === 0) {
    i = n;
  }*/ else {
    var index = binarySearch(id, updateQueueCursor + 1, updateQueue.length - 1, updateQueue);
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
   * Insert a shell into the digestQueue.
   * @param {Shell} shell 
   */
  function insertDigestQueue(shell) {
    var i, n = digestQueue.length, id = shell.$meta.guid;

    if (n > 0 && id > digestQueue[n-1].$meta.guid) {
      i = n;
    } /*else if (n === 0) {
      i = n;
    }*/ else {
      var index = binarySearch(id, digestQueueCursor + 1, digestQueue.length - 1, digestQueue);
      if (index < 0) {
        i = - index - 1;
      } else {
        return;
      }
    }

    if (i === n) {
      digestQueue.push(shell);
    } else {
      digestQueue.splice(i, 0, shell);
    }

    if (!waiting) {
      waiting = true;
      setImmediate(flushQueues);
    }
  }


/**
 * Push a callback function into callbackStack
 * @param {Function} func 
 */
function pushCallbackStack(callback) {
  callbackStack.push(callback);
}

export default {
  setImmediate: setImmediate,
  insertUpdateQueue: insertUpdateQueue,
  insertDigestQueue: insertDigestQueue,
  pushCallbackStack: pushCallbackStack
};