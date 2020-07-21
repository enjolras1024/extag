// src/core/template/drivers/driveComponent.js

import Cache from 'src/core/models/Cache'
import Validator from 'src/base/Validator'
import { assign } from 'src/share/functions'
import driveChildren from './driveChildren'
import driveEvents from "./driveEvents";
import driveProps from './driveProps'

function driveComponent(target, scopes, vnode, props, template) {
  var useExpr;

  if (vnode && scopes) {
    useExpr = vnode.useExpr;
    if (props && vnode.props) {
      props = assign({}, vnode.props, props);
    } else if (!props && vnode.props) {
      props = vnode.props;
    }
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate0(target, props);
    }
    driveProps(target, scopes, props, useExpr);

    if (vnode.events) {
      driveEvents(target, scopes, vnode.events, useExpr);
    }
    if (useExpr) {
      // if (vnode.attrs) {
      //   driveProps(target.attrs, scopes, vnode.attrs, useExpr);
      // }
      if (vnode.style) {
        driveProps(target.style, scopes, vnode.style, useExpr);
      }
      if (vnode.classes) {
        driveProps(target.classes, scopes, vnode.classes, useExpr);
      }
    }
    if (vnode.children) {
      driveChildren(target, scopes, vnode.children, useExpr);
    }
  } else if (props) {
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      Validator.validate0(target, props);
    }
    driveProps(target, scopes, props);
  }
  
  if (!template) { return; }

  var _scopes = [target];

  useExpr = template.useExpr;

  if (template.events) {
    driveEvents(target, _scopes, template.events, useExpr);
  }
  if (template.props) {
    target.__props = new Cache(target);
    driveProps(target.__props, _scopes, template.props, useExpr);
  }
  if (useExpr) {
    // if (template.attrs) {
    //   target.__attrs = new Cache(target);
    //   driveProps(target.__attrs, _scopes, template.attrs, useExpr);
    // }
    if (template.style) {
      target.__style = new Cache(target);
      driveProps(target.__style, _scopes, template.style, useExpr);
    }
    if (template.classes) {
      target.__classes = new Cache(target);
      driveProps(target.__classes, _scopes, template.classes, useExpr);
    }
  }
  if (template.children) {
    driveChildren(target, _scopes, template.children, useExpr);
    // TODO: check for <x:frag children@="render(_props)"></x:frag>
  }
}

export default driveComponent;