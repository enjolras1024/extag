// src/core/captureError.js

import logger from 'src/share/logger'
import {
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_DIGESTING
} from 'src/share/constants'

export default function captureError(error, shell, phase) {
  shell.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);

  var _stop;
  function stop() {
    _stop = true;
  }

  var scopes;
  var target = shell;
  var targets = [shell];

  while (shell) {
    if (shell.constructor.__extag_component_class__) {
      shell.emit('throwed', {
        targets: targets.slice(0),
        target: target,
        phase: phase,
        error: error,
        stop: stop
      });
      if (_stop) {
        break;
      }
    }
    scopes = shell.__extag_scopes__;
    if (scopes && scopes[0]) {
      shell = scopes[0];
      targets.push(shell);
    } else {
      logger.error('Unsolved error in phase `' + phase + '` from ', target);
      logger.error(error);
      break;
    }
  }
}
