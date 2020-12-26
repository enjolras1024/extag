import {
  hasOwnProp
} from 'src/share/functions'

function toClassName(classes) {
  if (classes) {
    var type = typeof classes;
    if (type === 'string') {
      return classes;
    }
    if (Array.isArray(classes)) {
      return classes.join(' ');
    }
    if (type === 'object') {
      var names = [];
      for (var name in classes) {
        if (classes[name] && 
            hasOwnProp.call(classes, name)) {
          names.push(name);
        }
      }
      return names.join(' ');
    }
  }
  return '';
}

function renderClassName($skin, newValue, oldValue) {
  newValue = toClassName(newValue);
  oldValue = toClassName(oldValue);
  if (newValue !== oldValue) {
    $skin.setAttribute('class', newValue);
  }
}

export {
  toClassName,
  renderClassName
}