// src/core/template/drivers/ContentDriver.js

import Component from "src/core/shells/Component";
import ChidlrenDriver from "./ChildrenDriver";
import EventsDriver from "./EventsDriver";
import PropsDriver from './PropsDriver'

// export function driveContent(content, scopes, vnode, first) {
//   EventsDriver.drive(content, scopes, vnode, first);
//   PropsDriver.drive(content, scopes, vnode, first)
//   ChidlrenDriver.drive(content, scopes, vnode, first, content instanceof Component);
// }

export default {
  drive: function drive(content, scopes, vnode, first) {
    if (vnode.scopes) {
      scopes = vnode.scopes;
    }
    EventsDriver.drive(content, scopes, vnode, first);
    PropsDriver.drive(content, scopes, vnode, first)
    ChidlrenDriver.drive(content, scopes, vnode, first, content instanceof Component);
    // if (isVNode(vnode)) {
    //   if (vnode.scopes) {
    //     scopes = vnode.scopes;
    //   }
    //   PropsDriver.drive(target, scopes, vnode.attrs, first);
    //   EventsDriver.drive(target, scopes, vnode.events, first);
    //   ChidlrenDriver.drive(target, scopes, vnode.contents, first, target instanceof Component);
    // } else /*if (target instanceof Text)*/ {
    //   target.set('content', vnode);
    // }
  }
}