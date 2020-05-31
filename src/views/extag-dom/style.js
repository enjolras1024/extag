import {
  hasOwnProp
} from 'src/share/functions'

import { 
  toKebabCase
 } from "./utils";

 
var CSSVendorPrefix, CSSVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

function checkCSSVendorPrefix($style, keyCapitalized) {
  for (var i = 0; i < CSSVendorPrefixes.length; ++i) {
    if ((CSSVendorPrefixes[i] + keyCapitalized) in $style) {
      return CSSVendorPrefixes[i];
    }
  }
}

var IMPORTANT_REGEXP = /\s*!important$/;

function renderStyle($skin, style, dirty) {
  var key, value, $style = $skin.style;
  //if (!dirty) { return; }
  for (key in dirty) {
    if (!hasOwnProp.call(dirty, key)) { continue; }

    if (key in $style) {
      $style[key] = style[key];
    } else if (key.slice(0, 2) === '--') { // css var
      $style.setProperty(key, style[key]);
    } else {
      value = style[key];
      if (IMPORTANT_REGEXP.test(value)) {
        $style.setProperty(toKebabCase(key), value.replace(IMPORTANT_REGEXP, ''), 'important')
      } else {
        var keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1);
        if (!CSSVendorPrefix) {
          CSSVendorPrefix = checkCSSVendorPrefix($style, keyCapitalized);
        }
        if (CSSVendorPrefix) {
          $style[CSSVendorPrefix + keyCapitalized] = value;
        }
      }
    }
  }
}

export {
  renderStyle
}