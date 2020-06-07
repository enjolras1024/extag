
// src/core/shells/Output.js

import Cache from 'src/core/models/Cache'
import DirtyMarker from 'src/base/DirtyMarker'
import Component from 'src/core/shells/Component'
import HTMXEngine from 'src/core/template/HTMXEngine'
import { assign, defineClass } from 'src/share/functions'
// import config from 'src/share/config'
/**
 * Output dynamic component, <x:output x:type="Button"/>, just like <input type="button">
 * @param {Object} props 
 * @param {Array} scopes 
 * @param {Object} template 
 */
export default function Output(props, scopes, template) {
  Output.initialize(this, props, scopes, template);
}

defineClass({
    constructor: Output,
    extends: Component,
    statics: {
      template: '<x:frag></x:frag>',
      initialize: function initialize(output, props, scopes, template) {
        var xtype = template && template.props && template.props.xtype;

        Component.initialize(output, props, scopes, {
          props: {
            xtype: xtype
          }
        });

        output.cache = new Cache(output);

        output.template = assign({}, template);
        output.template.props = assign({}, template.props);
        delete output.template.props.xtype;

        output.scopes = scopes;
        
        output.invalidate();
        output.on('updating', output.onUpdating.bind(output));
      }
    },
    onUpdating: function onUpdating() {
      var child, ctor, type;
      var cache = this.cache;
      var scopes = this.scopes;
      var template = this.template;

      if (this.hasDirty('xtype')) {
        type = this.get('xtype');
        if (typeof type === 'function') {
          if (type.__extag_component_class__) {
            cache.set('xctor', ctor);
          } else {
            var output = this;
            var promise = type();
            if (typeof promise === 'object' && promise instanceof Promise) {
              // cache.set('sign', sign);
              promise.then(function(ctor) {
                cache.set('xctor', ctor);
              }).catch(function(error) {
                cache.set('xctor', null);
                output.emitError(error);
              });
            } else {
              cache.set('xctor', null);
              output.emitError();
            }
          }
        } else {
          cache.set('xctor', null);
          output.emitError();
        }
      }
      if (cache.hasDirty('xctor')) {
        ctor = cache.get('xctor');
        if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
          this.setChildren([]);
          return;
        }
        try {
          template.tag = '?';
          template.type = ctor;
          child = HTMXEngine.createContent(template, scopes);
          this.setChildren([child]);
        } catch (e) {
          this.setChildren([]);
          this.emitError(e);
        }
      }
      DirtyMarker.clean(cache);
    },
    emitError: function(error) {
      if (!error) {
        error = new TypeError('`' + this.get('xtype') + '` is not a component class, constructor or a function that returns promise!');
      }
      if (error instanceof Error) {
        this.emit('error', error);
      }
    }
})