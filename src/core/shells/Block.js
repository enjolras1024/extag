// src/core/shells/Block.js

// import RES from 'src/base/RES'
// import List from 'src/core/models/List'
// import Shell from 'src/core/shells/Shell'
// import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
// import Expression from 'src/core/template/Expression'
// import HTMXEngine from 'src/core/template/HTMXEngine'
import { assign, defineClass } from 'src/share/functions'
import config from 'src/share/config'


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
      delete block.template.xkey;
      delete block.template.xfor;
      delete block.template.xif;
      
      block.set('condition', true);

      // var ctrls = template.ctrls || {};
      var expression;

      if (template.xif) {
        block.mode = 1;
        expression = template.xif;
        expression.compile('condition', block, scopes);
      }

      if (template.xfor) {
        block.mode = 2;
        expression = template.xfor[1];
        expression.compile('iterable', block, scopes);
        if (template.xkey) {
          block.keyEval = template.xkey;//.evaluator;
        }
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
    var template = this.template;
    var scopes = this.scopes;
    var fragment = [];

    if (!condition) {
      this.setChildren(fragment);
      return;
    }

    var HTMXEngine = config.HTMXEngine;

    if (this.mode === 1) {
      content = HTMXEngine.makeContent(template, scopes);
      if (content) {
        fragment.push(content);
      }
      this.setChildren(fragment);
      return;
    }

    var indices = {}, index, content, item, key, n, i;
    var iterable = this.get('iterable') || [];
    var children = this._children || [];
    var keyEval = this.keyEval;
    var newScopes;
  
    for (i = 0, n = children.length; i < n; ++i) {
      key = children[i].__key__;
      if (key) {
        indices[key] = i;
      }
    }

    for (i = 0, n = iterable.length; i < n; ++i) {
      key = null;
      content = null;
      item = iterable[i];
      newScopes = scopes.concat([item]);

      if (keyEval) {
        key = keyEval.execute(newScopes);
        index = indices[key];
        if (index != null) {
          content = children[index];

        }
      }
  
      if (!content) {
        content = HTMXEngine.makeContent(template, newScopes);
        content.__key__ = key;
      }
  
      fragment.push(content);
    }

    this.setChildren(fragment);
  }
});