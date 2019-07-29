// src/core/shells/View.js

import Expression from 'src/base/Expression'
import Shell from 'src/core/shells/Shell'
import Component from 'src/core/shells/Component'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { FLAG_CHANGED } from 'src/share/constants'
import { assign, defineClass } from 'src/share/functions'

export default function View(props, scopes, template) {
  View.initialize(this, props, scopes, template);
}

defineClass({
  constructor: View, extends: Component,
  statics: {
    initialize: function initialize(view, props, scopes, template) {
      var xtype = template && template.attrs && template.attrs['x:type'];

      Component.initialize(view, props, scopes, {
        props: {
          xtype: xtype
        }
      });

      view.template = assign({}, template);
      view.template.attrs = assign({}, template.attrs);
      delete view.template.attrs['x:type'];

      view.scopes = scopes;
      
      // var directs = template.directs;
      // delete template.directs;
      // delete template.dynamic;
      // if (directs) {
      //   view.assign(directs);
      //   if (scope && locals && directs.expressions) {
      //     Expression.compile(directs.expressions, view, scope, locals);
      //   }
      // }
      view.invalidate(FLAG_CHANGED);
    },
    template: '<x:frag></x:frag>'
  },

  onUpdating: function onUpdating() {
    // TODO: x:cache
    var type = this.get('xtype');//this.attrs.get('x:type');
    var fragment = [], content, ctor;
    var template = this.template, scopes = this.scopes;

    if (typeof type === 'function') {
      ctor = type;
    } else if (typeof type === 'string') {
      if (/^url\(.*\)$/.test(type)) {
        // TODO: check `require`
        require([type], (function(ctor) {
          // this.attrs.set('x:type', ctor);
          this.set('xtype', ctor);
        }).bind(this));
        return;
      } else {
        ctor = scope.res(type);//RES.search(xType, scope.constructor.resources);
      }
    } else if (typeof type === 'object' && typeof Promise === 'function' && type instanceof Promise) {
      type.then((function(ctor) {
        // this.attrs.set('x:type', ctor);
        this.set('xtype', ctor);
      }).bind(this))
    }

    if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
      // throw new Error('No such component type `' + xType + '`');
      return;
    }
    
    template.tag = '?';
    template.type = ctor;
    content = HTMXEngine.build(template, scopes);
    fragment.push(content);

    this.setChildren(fragment);
  }
});