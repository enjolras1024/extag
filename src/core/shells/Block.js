// src/core/shells/Block.js

// import RES from 'src/base/RES'
// import List from 'src/core/models/List'
import Shell from 'src/core/shells/Shell'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
import Expression from 'src/core/template/Expression'
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

      // block.template = template;
      block.scopes = scopes;
      block.template = assign({}, template);
      delete block.template.ctrls;
      
      block.set('condition', true);

      var ctrls = template.ctrls || {};
      var expression;

      if (ctrls.xIf) {
        block.mode = 1;
        expression = ctrls.xIf;
        expression.compile('condition', block, scopes);
        // Expression.compile({condition: expressions.xIf}, block, scope, locals);
      }

      if (ctrls.xFor) {
        block.mode = 2;
        expression = ctrls.xFor;
        // var path = expression.template.evaluator.paths[0]; // $.items in x-for="item of $.items | filter"
  
        // if (Array.isArray(path)) { // TODO:
        //   var local = locals[path[0]];
        //   var prop = path[path.length - 1];
        //   var src = path.length < 2 ? local : RES.search(path.slice(1, path.length - 1), local, true);
    
        //   if (src && src.on && src.emit) {
        //     var dst = src[prop];
    
        //     var handler = function() {
        //       src.emit('changed.' + prop);
        //     }
    
        //     if (dst && dst instanceof List) {
        //       dst.on('changed', handler);
        //     }
    
        //     src.on('changed.' + prop, function(event) {
        //       if (dst === src[prop]) { return; }
        //       if (dst && dst instanceof List) {
        //         dst.off('changed', handler);
        //       }
        //       dst = src[prop];
        //       if (dst && dst instanceof List) {
        //         dst.on('changed', handler);
        //       }
        //     })
        //   }
        // }
  
        // Expression.compile({iterable: expression}, block, scope, locals);
        expression.compile('iterable', block, scopes);
  
        if (ctrls.xKey) {
          block.keyEval = ctrls.xKey;//.evaluator;
        }
      }

      

      // block.on('update', block.onUpdating.bind(block));
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
    var children;

    if (!condition) {
      this.setChildren(fragment);
      return;
    }

    var HTMXEngine = config.HTMXEngine;

    if (this.mode === 1) {
      if (template.tag === 'x:block') {
        children = template.children;
      } else {
        children = [template];
      }
      for (var i = 0, n = children.length; i < n; ++i) {
        content = HTMXEngine.makeContent(children[i], scopes);
        if (content) {
          fragment.push(content);
        }
      }
      this.setChildren(fragment);
      return;
    }

    var indices = {}, index, content, item, key, n, i;
    var iterable = this.get('iterable') || [];
    children = this._children || [];
    var keyEval = this.keyEval;
    var newScopes;
  
    // for (i = 0, n = children.size(); i < n; ++i) {
    //   key = children.get(i).__key__;
    for (i = 0, n = children.length; i < n; ++i) {
      key = children[i].__key__;
      if (key) {
        indices[key] = i;
      }
    }
  
    if (__ENV__ === 'development') {
      // if (Object.keys(indices).length < children.size()) {
      //   //console.warn('');
      // }
    }

    for (i = 0, n = iterable.length; i < n; ++i) {
      key = null;
      content = null;
      item = iterable[i];
      newScopes = scopes.concat([item]);
      // newScopes = scopes.concat([i, item]);
  
      if (keyEval) {
        key = keyEval.execute(newScopes);
        index = indices[key];
        if (index != null) {
          content = children[index];

        }
      }
  
      if (!content) {
        if (template.tag !== 'x:block') {
          content = HTMXEngine.makeContent(template, newScopes);
        } else if (template.children && template.children.length === 1) {
          content = HTMXEngine.makeContent(template.children[0], newScopes);
        } else {
          // content = new Fragment(); HTMXEngine.start(template, content, newScopes);
        }
        content.__key__ = key;
      }
  
      fragment.push(content);
    }

    // if (template.xName) {
    //   // scope[template.xName] = fragment;
    //   scope.addNamedPart(template.xName, fragment);
    // }

    this.setChildren(fragment);
  }
});