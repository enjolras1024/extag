// src/core/Schedule.js

import { setImmediate } from 'src/share/functions'
import logger from 'src/share/logger';

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
        try {
          shell.update();
        } catch (e) {
          logger.error(e);
        }
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
        try {
          shell.render();
        } catch (e) {
          logger.error(e);
        }
        ++renderQueueCursor;
      }
    
      renderQueue.length = 0;
      renderQueueCursor = 0;
      rendering = false;
    
      for (i = callbackQueue.length - 1; i >= 0; --i) {
        try {
          callbackQueue[i]();
        } catch (e) {
          logger.error(e);
        }
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
  var i, n = updateQueue.length, id = shell.$guid;

  if (!updating) {
    i = n - 1;
    while (i >= 0 && id < updateQueue[i].$guid) {
      --i;
    }
    ++i;
  } else { // the method `invalidate` maybe called when updating
    i = updateQueueCursor + 1;
    // if (id < updateQueue[updateQueueCursor].$guid) {
    //   if (__ENV__ === 'development') {
    //     logger.warn('Do not change properties or emit event to parent component on updating.');
    //   }
    //   throw new Error(shell.toString() + ' should not update after some child component has updated.');
    // }
    while (i < n && id >= updateQueue[i].$guid) {
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
    var i, n = renderQueue.length, id = shell.$guid;

    if (!rendering) {
      i = n - 1;
      while (i >= 0 && id < renderQueue[i].$guid) {
        --i;
      }
      ++i;
    } else {
      i = renderQueueCursor + 1;
      while (i < n && id >= renderQueue[i].$guid) {
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
  insertUpdateQueue: insertUpdateQueue,
  insertRenderQueue: insertRenderQueue,
  pushCallbackQueue: pushCallbackQueue
};