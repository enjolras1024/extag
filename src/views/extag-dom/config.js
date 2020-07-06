
import {
  assign,
  hasOwnProp
} from 'src/share/functions'

// Refer to React (https://facebook.github.io/react/)
var DOM_PROPERTY_DESCRIPTORS = {
  /**
   * Standard Properties
   */
  accept: null,
  acceptCharset: {
    attributeName: 'accept-chartset'
  },
  accessKey: null,
  action: null,
  allowFullscreen: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  allowTransparency: null,
  alt: null,
  async: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  autocomplete: null,
  autofocus: {
    isBoolProperty: true
  },
  autoplay: {
    isBoolProperty: true
  },
  capture: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  cellPadding: null,
  cellSpacing: null,
  charset: null,
  challenge: null,
  checked: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  cite: null,
  classid: null,
  className: {
    attributeName: 'class'
  },
  cols: null,//HAS_POSITIVE_NUMERIC_VALUE,
  colSpan: null,
  content: null,
  contentEditable: null,
  contextMenu: null,
  controls: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  coords: null,
  crossOrigin: null,
  data: {
    mustUseProperty: true
  }, // For `<object />` acts as `src`, and text.
  dateTime: null,
  'default': {
    isBoolProperty: true,
    mustUseProperty: true
  },
  defer: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  dir: null,
  disabled: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  download: null,//HAS_OVERLOADED_BOOLEAN_VALUE,
  draggable: null,
  enctype: null,
  form: null,
  formAction: null,
  formEncType: null,
  formMethod: null,
  formNoValidate: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  formTarget: null,
  frameBorder: null,
  headers: null,
  height: null,
  hidden: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  high: null,
  href: null,
  hreflang: null,
  htmlFor: {
    attributeName: 'for'
  },
  httpEquiv: null,
  icon: null,
  id: null,
  innerHTML: {
    attributeName: 'inner-html',
    mustUseProperty: true
  },
  inputMode: null, // ? no support for now
  integrity: null,
  is: null,
  keyparams: null,
  keytype: null,
  kind: null,
  label: null,
  lang: null,
  list: null,
  loop: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  low: null,
  manifest: null,
  marginHeight: null,
  marginWidth: null,
  max: null,
  maxLength: null,
  media: null,
  mediaGroup: null,
  method: null,
  min: null,
  minLength: null,
  multiple: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  muted: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  name: null,
  nonce: null,
  noValidate: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  open: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  optimum: null,
  pattern: null,
  placeholder: null,
  poster: null,
  preload: null,
  profile: null,
  radiogroup: null,
  readOnly: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  referrerPolicy: null,
  rel: null,
  required: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  reversed: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  role: null,
  rows: null,//HAS_POSITIVE_NUMERIC_VALUE,
  rowSpan: null,//HAS_NUMERIC_VALUE,
  sandbox: null,
  scope: null,
  scoped: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  scrolling: null,
  seamless: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  selected: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  shape: null,
  size: null,//HAS_POSITIVE_NUMERIC_VALUE,
  sizes: null,
  span: null,//HAS_POSITIVE_NUMERIC_VALUE,
  spellcheck: null,
  src: null,
  srcdoc: null,
  srclang: null,
  srcset: null,
  start: null,//HAS_NUMERIC_VALUE,
  step: null,
  style: null,
  summary: null,
  tabIndex: null,
  target: null,
  title: null,
  type: null,
  useMap: null,
  value: {
    mustUseProperty: true
  },
  width: null,
  wmode: null,
  wrap: null,

  /**
   * RDFa Properties
   */
  about: null,
  datatype: null,
  inlist: null,
  prefix: null,
  property: null,
  resource: null,
  'typeof': null,
  vocab: null,

  /**
   * Non-standard Properties
   */
  autocapitalize: null,
  autocorrect: null,
  autosave: null,
  color: null,
  itemprop: null,
  itemscope: {
    isBoolProperty: true,
    mustUseProperty: true
  },
  itemtype: null,
  itemid: null,
  itemref: null,
  results: null,
  security: null,
  unselectable: null
};

(function() {
  var key, desc, map = {};
  for (key in DOM_PROPERTY_DESCRIPTORS) {
    desc = DOM_PROPERTY_DESCRIPTORS[key];
    if (!desc) {
      desc = DOM_PROPERTY_DESCRIPTORS[key] = {};
    }
    desc.propertyName = key;
    if (!desc.attributeName) {
      desc.attributeName = key.toLowerCase();
    }
    if (desc.attributeName !== key) {
      map[desc.attributeName] = desc;
    }
  }
  assign(DOM_PROPERTY_DESCRIPTORS, map);
})()

// var JS_TO_HTML = (function(map) {
//   var key, desc, cache = {};
//   for (key in map) {
//     desc = map[key];
//     if (!desc) {
//       desc = map[key] = {};
//     }
//     if (!desc.attributeName) {
//       desc.attributeName = key.toLowerCase();
//     }
//     cache[key] = desc.attributeName;
//   }
//   return cache;
// })(DOM_PROPERTY_DESCRIPTORS);

// JS_TO_HTML.cssFloat = 'float'; // TODO

// var HTML_TO_JS = (function(map) {
//   var key, cache = {};
//   for (key in map) {
//     if (hasOwnProp.call(map, key)){
//       cache[map[key]] = key;
//     }
//   }
//   return cache;
// })(JS_TO_HTML);

var namespaceURIs = {
  html: 'http://www.w3.org/1999/xhtml',
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
};

export {
  DOM_PROPERTY_DESCRIPTORS,
  namespaceURIs,
  // HTML_TO_JS,
  // JS_TO_HTML,
}
// export namespaceURIs;