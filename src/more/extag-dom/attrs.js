import { 
  hasOwnProp
} from 'src/share/functions'

import {
  namespaceURIs
} from './config'

function renderAttrs($skin, attrs, dirty) {
  var key, value, index, nsURI;
  // if (!dirty) {  return; }
  for (key in dirty) {
    if (!hasOwnProp.call(dirty, key)) { continue; }

    value = attrs[key];
    index = key.indexOf(':');

    if (index > 0) {
      nsURI = namespaceURIs[key.slice(0, index)];
    }

    if (!nsURI) {
      if (value != null) {
        $skin.setAttribute(key, value);
      } else {
        $skin.removeAttribute(key);
      }
    } else {
      key = key.slice(index + 1);
      if (value != null) {
        $skin.setAttributeNS(nsURI, key, value);
      } else {
        $skin.removeAttributeNS(nsURI, key);
      }
    }
  }
}

export {
  renderAttrs
};