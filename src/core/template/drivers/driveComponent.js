// src/core/template/drivers/driveComponent.js

import Cache from 'src/core/models/Cache'
import driveChildren from './driveChildren'
import driveClasses from './driveClasses';
import driveEvents from "./driveEvents";
import driveProps from './driveProps'

export default function driveComponent(target, template, first) {
  var scopes = [target];

  var useExpr = template.useExpr;

  if (template.events) {
    driveEvents(target, scopes, template.events, useExpr);
  }
  if (template.attrs) {
    target.$props = new Cache(target);
    driveProps(target.$props, scopes, template.attrs, useExpr, first);
  }
  if (useExpr) {
    if (template.style) {
      target.$style = new Cache(target);
      driveProps(target.$style, scopes, template.style, useExpr, first);
    }
    if (template.classes) {
      target.$props = target.$props || new Cache(target);
      driveClasses(target.$props, scopes, template.classes, useExpr);
    }
  }
  if (template.contents) {
    driveChildren(target, scopes, template.contents, useExpr);
  }
}