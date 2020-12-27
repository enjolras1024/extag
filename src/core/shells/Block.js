// src/core/shells/Block.js

// import RES from 'src/base/RES'
// import List from 'src/core/models/List'
// import Shell from 'src/core/shells/Shell'
// import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
// import Expression from 'src/core/template/Expression'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { assign, defineClass } from 'src/share/functions'
import { applyEvaluator } from 'src/core/bindings/DataBinding'
// import config from 'src/share/config'

function replaceScopes(content, newScopes) {
  var bindings = content._bindings;
  var numScopes = newScopes.length;
  if (bindings) {
    for (var i = 0; i < bindings.length; ++i) {
      var binding = bindings[i];
      var oldScopes = binding.scopes;
      if (oldScopes && oldScopes.length === numScopes && 
          oldScopes[numScopes - 1] !== newScopes[numScopes - 1]) {
        binding.replace(newScopes);
      }
    }
  }
}

/**
 * Block for x:if and x:for
 * @param {Object} props 
 * @param {Array} scopes 
 * @param {Object} template 
 */
export default function Block(props, scopes, template) {
  Block.initialize(this, props, scopes, template);
}

defineClass({
  constructor: Block, extends: Component,

  statics: {
    initialize: function initialize(block, props, scopes, template) {
      Component.initialize(block, props);

      block.mode = 0;

      if (!template) {
        return;
      }

      block.scopes = scopes;
      block.template = assign({}, template);
      delete block.template.xtype;
      delete block.template.xkey;
      delete block.template.xfor;
      delete block.template.xif;
      
      block.set('condition', true);

      // var ctrls = template.ctrls || {};
      var expression;

      if (template.xif) {
        block.mode = 1;
        expression = template.xif;
        expression.connect('condition', block, scopes);
      }

      if (template.xfor) {
        block.mode = 2;
        expression = template.xfor[1];
        expression.connect('iterable', block, scopes);
        if (template.xkey) {
          block.keyExpr = template.xkey;//.evaluator;
        }
      }

      if (template.xtype) {
        block.mode = block.mode || 1;
        block.xtype = true;
        expression = template.xtype;
        expression.connect('component', block, scopes);
      }

      block.on('updating', block.onUpdating.bind(block));
    },
    template: '<x:frag></x:frag>'
  },

  onUpdating: function onUpdating() {
    if (!this.mode) {
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
    var keyExpr = this.keyExpr;
    var newScopes;
  
    for (i = 0, n = children.length; i < n; ++i) {
      key = children[i].__extag_key__;
      if (key) {
        indices[key] = i;
      }
    }

    for (i = 0, n = iterable.length; i < n; ++i) {
      key = null;
      content = null;
      item = iterable[i];
      newScopes = scopes.concat([item]);

      if (keyExpr) {
        key = applyEvaluator(keyExpr.pattern, newScopes);
        index = indices[key];
        if (index != null) {
          content = children[index];
        }
      }
  
      if (!content) {
        content = HTMXEngine.makeContent(template, newScopes);
        content.__extag_key__ = key;
      } else {
        replaceScopes(content, newScopes);
        // content.__extag_key__ = key;
      }
  
      contents.push(content);
    }

    this.setChildren(contents);
  }
});