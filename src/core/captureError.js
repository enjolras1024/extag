// src/core/captureError.js
import logger from 'src/share/logger'

function getParentComponent(component) {
  var parent = component.getParent();
  while (parent) {
    if (parent.constructor.__extag_component_class__) {
      return parent;
    }
    parent = parent.getParent();
  }
}

export default function captureError(error, component, phase) {
  var _stop;
  function stop() {
    _stop = true;
  }
  var solver = null;
  var target = component;
  var targets = [target];
  while (component) {
    if (!_stop) {
      component.emit('captured', {
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
    var parent = getParentComponent(component);
    if (parent) {
      component = parent;
      targets.push(parent);
    } else {
      component.emit('error', {
        targets: targets.slice(0),
        target: target,
        solver: solver,
        phase: phase,
        error: error
      });
      if (!solver) {
        logger.error('Unsolved error in phase `' + phase + '` from ' + target.toString(), target);
        throw error;
      }
      break;
    }
  }
}
