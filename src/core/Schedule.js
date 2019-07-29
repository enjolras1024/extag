// src/core/Schedule.js

import { setImmediate } from 'src/share/functions'
import logger from 'src/share/logger';


// var buffers = [[], []];
var updateQueue = []; 
var renderQueue = [];
var callbackQueue = [];
var updateQueueCursor = 0;
var renderQueueCursor = 0;
var turn = 0;
// var 
var waiting = false;
var updating = false;

function flushQueues() {
  // console.log('flushQueues', updating, waiting)
  if (updating || !waiting) {
    return;
  }
  try {
    turn++;
    updateQueueCursor = 0;
    updating = true;
    // console.log('>>>>>>>>>>>>>>>>>');
    var shell, i, n;
  
    // quene may be lengthen if the method `invalidate` is called when updating
    while (updateQueueCursor < updateQueue.length) {
      // if (updateQueueCursor > 999) {
      //   throw new Error('too much things to update');
      // }
      
      shell = updateQueue[updateQueueCursor];
      // console.log(turn, shell.$flag, shell.toString(), shell._children)
      shell.update();
      ++updateQueueCursor;
    }
  
    updateQueueCursor = 0;
    updateQueue.length = 0;
    updating = false;
    waiting = false;
  
    // renderQueue = buffers[index];
    
    // index = index ? 0 : 1;
  
    for (i = 0, n = renderQueue.length; i < n; ++i) {
      shell = renderQueue[i];
      shell.render();
    }
  
    renderQueue.length = 0;
  
    for (i = callbackQueue.length - 1; i >= 0; --i) {
      callbackQueue[i]();
    }

    callbackQueue.length = 0;
    // console.log('<<<<<<<<<<<<<<<<<');
  } catch (e) {
    updateQueueCursor = 0;
    updateQueue.length = 0;
    renderQueue.length = 0;
    callbackQueue.length = 0;
    updating = false;
    waiting = false;
    throw e;
  }
}

/**
 * Insert a shell into the updateQueue for updating accoring to its guid.
 * In order to rendering top-down  (parent to child), 
 * parent's guid must be less than its children's. 
 * Indeed, component template engine obeys this rule. 
 * If you do not obey this rule when creating elements and component manually by yourself, 
 * rendering maybe wrong.
 * @param {Shell} shell
 */
function insertUpdateQueue(shell) {
  var i, n = updateQueue.length, id = shell.guid;

  if (!updating) {
    i = n - 1;
    while (i >= 0 && id < updateQueue[i].guid) {
      --i;
    }
    ++i;
  } else { // the method `invalidate` maybe called when updating
    i = updateQueueCursor + 1;
    // if (id < updateQueue[updateQueueCursor].guid) {
    //   if (__ENV__ === 'development') {
    //     logger.warn('Do not change properties or emit event to parent component on updating.');
    //   }
    //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
    // }
    while (i < n && id >= updateQueue[i].guid) {
      ++i;
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
    // console.log('##########');
  }
}

/**
 * Insert a shell into the renderQueue.
 * @param {Shell} shell 
 */
function insertRenderQueue(shell) {
  var i, n = renderQueue.length, id = shell.guid;

  i = n - 1;
  while (i >= 0 && id < renderQueue[i].guid) {
    --i;
  }
  ++i;

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
  flushQueues: flushQueues,
  insertUpdateQueue: insertUpdateQueue,
  insertRenderQueue: insertRenderQueue,
  pushCallbackQueue: pushCallbackQueue,
  /**
   * Insert a shell into the updateQueue for updating accoring to its guid.
   * In order to rendering top-down  (parent to child), 
   * parent's guid must be less than its children's. 
   * Indeed, component template engine obeys this rule. 
   * If you do not obey this rule when creating elements and component manually by yourself, 
   * rendering maybe wrong.
   * @param {Shell} shell
   */
  insert: function(shell) {
    var i, n = updateQueue.length, id = shell.guid;

    if (!updating) {
      i = n - 1;
      while (i >= 0 && id < updateQueue[i].guid) {
        --i;
      }
      ++i;
    } else { // the method `invalidate` maybe called when updating
      i = updateQueueCursor + 1;
      // if (id < updateQueue[updateQueueCursor].guid) {
      //   if (__ENV__ === 'development') {
      //     logger.warn('Do not change properties or emit event to parent component on updating.');
      //   }
      //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
      // }
      while (i < n && id >= updateQueue[i].guid) {
        ++i;
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
      // console.log('##########');
    }

    // console.log(updateQueue.length, id)
  },

  /**
   * Append a shell into a renderQueue for rendering.
   * @param {Shell} shell
   */
  append: function(shell) {
    // var renderQueue = buffers[index];
    renderQueue.push(shell);
  },

  /**
   * Push a function into callbackQueue
   * @param {Function} func 
   */
  push: function(func) {
    callbackQueue.push(func);
  }
};