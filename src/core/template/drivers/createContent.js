// src/core/template/drivers/createContent.js

import { isVNode } from 'src/share/functions'
import Text from 'src/core/shells/Text'
import Block from 'src/core/shells/Block'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'

export default function createContent(vnode, scopes) {
  if (!isVNode(vnode)) {
    return new Text(vnode);
  }  

  var ctor, expr, content;
  var useExpr = vnode.useExpr;

  if (vnode.xif || vnode.xfor || vnode.xtype) {
    content = new Block(vnode, scopes);
  } else if (useExpr && vnode.type === Expression) {
    expr = vnode.expr;
    if (expr.pattern.target === 'frag') {
      content = new Fragment(null, scopes);
      expr.connect('accept', content, scopes);
    } else {
      content = new Text('');
      expr.connect('content', content, scopes);
    }
  } else {
    ctor = vnode.type;
    if (ctor && ctor !== Element) {
      content = new ctor(vnode, scopes);
    } else {
      content = new Element(vnode, scopes);
    }
    if (vnode.name) {
      content.$owner = scopes[0];
      scopes[0].addNamedPart(vnode.name, content); // TODO: removeNamedPart
    }
  }

  return content;
}