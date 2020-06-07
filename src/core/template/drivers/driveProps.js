// src/core/template/drivers/driveProps.js

import Accessor from 'src/base/Accessor'
import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'

function driveProps(target, scopes, newProps, useExpr) {
  var oldProps = target._props;
  var name, desc, value;
  // firstly, remove redundant properties, or reset default property values.
  if (oldProps) { 
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
    for (name in newProps) {
      value = newProps[name];
      if (useExpr && value instanceof Expression) {
        value.connect(name, target, scopes);
      } else {
        target.set(name, value);
      }
    }
  }
}

export default driveProps;