// src/core/template/drivers/driveContent.js

import Component from "src/core/shells/Component";
import driveChildren from "./driveChildren";
import driveClasses from "./driveClasses";
import driveEvents from "./driveEvents";
import driveProps from './driveProps'

export default function driveContent(content, scopes, vnode) {
  var useExpr = vnode.useExpr;
  if (vnode.events) {
    driveEvents(content, scopes, vnode.events, useExpr);
  }
  if (vnode.props) {
    driveProps(content, scopes, vnode.props, useExpr)
  }
  if (vnode.style) {
    driveProps(content.style, scopes, vnode.style, useExpr);
  }
  if (vnode.classes) {
    driveClasses(content, scopes, vnode.classes, useExpr);
  }
  if (vnode.children) {
    driveChildren(content, scopes, vnode.children, useExpr, content instanceof Component);
  }
}