// src/core/template/drivers/driveProps.js

import Accessor from 'src/base/Accessor'
import Validator from 'src/base/Validator'
import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'

function driveProps(target, scopes, newProps, useExpr, first) {
  var oldProps = target._props;
  var name, desc, value;

  // eslint-disable-next-line no-undef
  if (__ENV__ === 'development') {
    if (target instanceof Component) {
      Validator.validate0(target, newProps);
    }
  }

  // remove redundant properties, or reset default property values.
  if (oldProps && !first) { 
    if (target instanceof Component) {
      for (name in oldProps) {
        if (!newProps || !(name in newProps)) {
          desc = Accessor.getAttrDesc(target, name);
          if (desc) {
            target.set(name, Accessor.getAttributeDefaultValue(desc));
          } else {
            target.set(name, null);
          }
        }
      }
    } else {
      for (name in oldProps) {
        if (!newProps || !(name in newProps)) {
          target.set(name, null);
        }
      }
    }
  }
  // assign new property values
  if (newProps) {
    if (useExpr) {
      for (name in newProps) {
        value = newProps[name];
        if (value instanceof Expression) {
          value.connect(name, target, scopes);
        } else {
          target.set(name, value);
        }
      }
    } else {
      for (name in newProps) {
        target.set(name, newProps[name]);
      }
    }
  }
}

export default driveProps;