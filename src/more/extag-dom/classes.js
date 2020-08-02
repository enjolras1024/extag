import {
  hasOwnProp
} from 'src/share/functions'

function renderClasses($skin, classes, dirty) {
  var key, classList = $skin.classList;
  // if (!dirty) { return; }
  if (classList) {
    for (key in dirty) {
      if (hasOwnProp.call(dirty, key)) {
        if (classes[key]) {
          classList.add(key);
        } else {
          classList.remove(key);
        }
      }
    }
  } else {
    var names = [];
    for (key in classes) {
      if (hasOwnProp.call(classes, key) && classes[key]) {
        names.push(key);
      }
    }
    $skin.setAttribute('class', names.join(' '));
  }
}

export {
  renderClasses
}