// src/core/shells/Block.js

import Model from 'src/core/models/Model'
import Component from 'src/core/shells/Component'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { assign, defineClass } from 'src/share/functions'
import { applyEvaluator } from 'src/core/bindings/DataBinding'

/**
 * Block for x:if and x:for
 * @param {Object} props 
 * @param {Array} scopes 
 * @param {Object} template 
 */
export default function Block(vnode, scopes) {
  Block.initialize(this, vnode, scopes);
}

defineClass({
  constructor: Block, extends: Component,

  statics: {
    initialize: function initialize(block, vnode, scopes) {
      Component.initialize(block);

      block.mode = 0;

      if (!vnode) {
        return;
      }

      block.scopes = scopes;
      var template = assign({}, vnode);
      block.template = template;
      delete template.xtype;
      delete template.xkey;
      delete template.xfor;
      delete template.xif;

      block.set('condition', true);

      var expression;

      if (vnode.xif) {
        block.mode = 1;
        expression = template.xif;
        expression.connect('condition', block, scopes);
      }

      if (vnode.xfor) {
        block.mode = 2;
        block.varaibles = vnode.xfor[0];
        expression = vnode.xfor[1];
        expression.connect('iterable', block, scopes);
        if (vnode.xkey) {
          block.keyExpr = vnode.xkey;//.evaluator;
        }
      }

      if (vnode.xtype) {
        block.mode = block.mode || 1;
        block.xtype = true;
        expression = vnode.xtype;
        expression.connect('component', block, scopes);
      }

      block.refresh();

      scopes[0].on('updating', function() {
        block.refresh();
      });
    },
    template: '<x:frag></x:frag>'
  },

  refresh: function refresh() {
    if (!this.mode) {
      return;
    }

    if (!this.hasDirty('condintion') && 
        !this.hasDirty('component') &&
        !this.hasDirty('iterable') &&
        !this.hasDirty('xtype')) {
      return;
    }

    var condition = this.get('condition');
    var component = this.get('component');
    var template = this.template;
    var scopes = this.scopes;
    var contents = [];

    if (!condition) {
      this.setChildren(contents);
      return;
    }

    if (this.xtype) {
      if (!component || !component.__extag_component_class__) {
        this.setChildren(contents);
        return;
      }
      template = assign({}, template, {type: component});
    }

    if (this.mode === 1) {
      content = HTMXEngine.createContent(template, scopes, true);
      if (content) {
        contents.push(content);
      }
      this.setChildren(contents);
      return;
    }

    var indices = {}, index, content, item, key, n, i;
    var iterable = this.get('iterable') || [];
    var children = this._children || [];
    var varaibles = this.varaibles;
    var keyExpr = this.keyExpr;
    var newScopes;

    for (i = 0, n = children.length; i < n; ++i) {
      if ('__extag_key__' in children[i]) {
        key = children[i].__extag_key__;
        indices[key] = i;
      }
    }

    for (i = 0, n = iterable.length; i < n; ++i) {
      key = null;
      content = null;
      item = iterable[i];
      // newScopes = scopes.concat([item]);

      var data = {}, model;
      data[varaibles[0]] = item;
      if (varaibles[1]) {
        data[varaibles[1]] = i;
      }
      newScopes = scopes.concat([data]);

      if (keyExpr) {
        key = applyEvaluator(keyExpr.pattern, newScopes);
        index = indices[key];
        if (index != null) {
          content = children[index];
        }
      }
  
      if (!content) {
        model = new Model(data);
        newScopes[newScopes.length - 1] = model;
        content = HTMXEngine.createContent(template, newScopes);
        content.__extag_key__ = key;
        content.__extag_scopes__ = newScopes;
      } else {
        // replaceScopes(content, newScopes);
        newScopes = content.__extag_scopes__;
        model = newScopes[newScopes.length - 1];
        model.assign(data);
      }
  
      contents.push(content);
    }

    this.setChildren(contents);
  }
});