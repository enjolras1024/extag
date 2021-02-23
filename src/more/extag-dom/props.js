import { 
  hasOwnProp
} from 'src/share/functions'

import {
  DOM_PROPERTY_DESCRIPTORS,
  namespaceURIs
} from './config'
import { renderStyle } from "./style";
import { renderClassName } from "./classes";


(function() {
  var desc;

  desc = DOM_PROPERTY_DESCRIPTORS.className;
  desc.render = renderClassName;

  desc = DOM_PROPERTY_DESCRIPTORS['class'];
  desc.render = renderClassName;

  desc = DOM_PROPERTY_DESCRIPTORS.style;
  desc.render = renderStyle;
})();

function renderProps($skin, props, dirty) {
  var key, desc, index, value, nsURI;
  //if (!dirty) { return; }
  for (key in dirty) {
    if (hasOwnProp.call(dirty, key)) { 
      value = props[key];
      desc = DOM_PROPERTY_DESCRIPTORS[key];
      if (desc) {
        if (desc.render) {
          desc.render($skin, value, dirty[key]);
        } else if (desc.mustUseProperty) {
          $skin[desc.propertyName] = value;
        } else if (value != null) {
          $skin.setAttribute(desc.attributeName, value);
        } else {
          $skin.removeAttribute(desc.attributeName);
        }
      } else {
        index = key.indexOf(':');
        nsURI = index <= 0 ? null : 
                namespaceURIs[key.slice(0, index)];
        if (nsURI) {
          // xlink:href ...
          key = key.slice(index + 1);
          if (value != null) {
            $skin.setAttributeNS(nsURI, key, value);
          } else {
            $skin.removeAttributeNS(nsURI, key);
          }
        } else if (index <= 0 || key.slice(0, index) !== 'x') {
          // data-sth, aria-sth, svg attributes ...
          if (value != null) {
            $skin.setAttribute(key, value);
          } else {
            $skin.removeAttribute(key);
          }
        }
      }
    }
  }
}

export {
  renderProps
}