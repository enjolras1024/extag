import {
  hasOwnProp
} from 'src/share/functions'

import { 
  toCamelCase,
  // toKebabCase
 } from "./utils";

 
var cssVendorPrefix, cssVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

function checkCssVendorPrefix(name, $style) {
  for (var i = 0; i < cssVendorPrefixes.length; ++i) {
    if ((cssVendorPrefixes[i] + name) in $style) {
      return cssVendorPrefixes[i];
    }
  }
}

var stylePropNameMap = {
  'float': 'cssFloat'
};

function getStylePropName(key, $style) {
  if (key in stylePropNameMap) {
    return stylePropNameMap[key];
  }

  var name = toCamelCase(key);
  if (name in $style) {
    stylePropNameMap[key] = name;
    return name;
  }

  name = name.charAt(0).toUpperCase() + name.slice(1); // capitalize
  if (!cssVendorPrefix) {
    cssVendorPrefix = checkCssVendorPrefix(name, $style);
  }
  if (cssVendorPrefix) {
    name = cssVendorPrefix + name;
    if (name in $style) {
      stylePropNameMap[key] = name;
      return name;
    }
  }
}

function renderStyle($skin, style, dirty) {
  var key, name, $style = $skin.style;
  for (key in dirty) {
    if (hasOwnProp.call(dirty, key)) {
      if (key.slice(0, 2) === '--') {
        $style.setProperty(key, style[key]);
      } else {
        name = getStylePropName(key, $style);
        if (name) {
          $style[name] = style[key];
        }
      }
    }
  }
}

export {
  renderStyle
}