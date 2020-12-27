// src/core/template/drivers/driveComponent.js

import ClassBinding from 'src/core/bindings/ClassBinding'
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
      if (vnode.style) {
        driveProps(target.style, scopes, vnode.style, useExpr);
      }
      if (vnode.classes) {
        ClassBinding.create(vnode.classes).connect('class', target, scopes);
      }
    }
    if (vnode.children) {
      driveChildren(target, scopes, vnode.children, useExpr, true);
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
    target.$props = new Cache(target);
    driveProps(target.$props, _scopes, template.props, useExpr);
  }
  if (useExpr) {
    if (template.style) {
      target.$style = new Cache(target);
      driveProps(target.$style, _scopes, template.style, useExpr);
    }
  }
  if (template.children) {
    driveChildren(target, _scopes, template.children, useExpr);
  }
}

export default driveComponent;