import {
  query,
  invoke,
  hasNameSpace
} from './utils'

import { 
  mayDispatchEvent,
  addEventListener,
  removeEventListener
 } from "./events";

import {
  attachShell,
  detachShell,
  renderShell
} from './shell'


var ExtagDOM = {
  query: query,
  invoke: invoke,
  attachShell: attachShell,
  detachShell: detachShell,
  renderShell: renderShell,
  hasNameSpace: hasNameSpace,
  mayDispatchEvent: mayDispatchEvent,
  addEventListener: addEventListener,
  removeEventListener: removeEventListener
}

if (window.Extag) {
  window.Extag.conf('view-engine', ExtagDOM);
}

export default ExtagDOM;