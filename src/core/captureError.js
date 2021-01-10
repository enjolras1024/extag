// src/core/captureError.js
import logger from 'src/share/logger'

export default function captureError(error, component, phase) {
  var _stop;
  function stop() {
    _stop = true;
  }
  var scopes;
  var solver = null;
  var target = component;
  var targets = [component];
  while (component) {
    if (!_stop) {
      component.emit('throwed', {
        targets: targets.slice(0),
        target: target,
        phase: phase,
        error: error,
        stop: stop
      });
      if (_stop) {
        solver = component;
      }
    }
    scopes = component.__extag_scopes__;
    if (scopes && scopes[0]) {
      component = scopes[0];
      targets.push(component);
    } else {
      component.emit('error', {
        targets: targets.slice(0),
        target: target,
        solver: solver,
        phase: phase,
        error: error,
        stop: stop
      });
      if (!_stop) {
        logger.error('Unsolved error in phase `' + phase + '` from ', target);
        throw error;
      }
      break;
    }
  }
}
