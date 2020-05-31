import { 
  hasOwnProp
} from 'src/share/functions'

import {
  DOM_PROPERTY_DESCRIPTORS
} from './config'

import {
  toKebabCase
} from './utils'

function renderProps($skin, props, dirty) {
  var key, desc, value;
  //if (!dirty) { return; }
  for (key in dirty) {
    if (hasOwnProp.call(dirty, key)) { 
      desc = DOM_PROPERTY_DESCRIPTORS[key];
      value = props[key];
      if (desc) {
        if (desc.mustUseProperty) {
          $skin[desc.propertyName] = value;
        } else if (value != null) {
          $skin.setAttribute(desc.attributeName, value);
        } else {
          $skin.removeAttribute(desc.attributeName);
        }
      } else if (value != null) {
        $skin.setAttribute(toKebabCase(key), value);
      } else {
        $skin.removeAttribute(toKebabCase(key));
      }
    }
  }
}

export {
  renderProps
}