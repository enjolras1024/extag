// src/core/shells/Portal.js

import { defineClass, throwError } from 'src/share/functions'
import Component from 'src/core/shells/Component'
import Fragment from 'src/core/shells/Fragment'

export default function Portal() {
  Component.apply(this, arguments);
}

var name2pool = {};

defineClass({
  constructor: Portal,
  extends: Component,
  setup: function() {
    var portal = this;
    portal.on('contents', function(contents) {
      if (!portal.fragment) {
        portal.fragment = new Fragment();
      }
      portal.fragment.accept(contents, contents.scopes);
    });
    portal.on('started', function() {
      var pool = portal.getPool();
      if (pool.target) {
        pool.target.append(portal);
      } else {
        pool.portals.push(portal);
      }
    });
    portal.on('destroy', function() {
      var pool = portal.getPool();
      if (pool.target) {
        pool.target.remove(portal);
      }
      if (portal.fragment) {
        portal.fragment.setChildren([]);
      }
    });
  },

  getPool: function getPool() {
    var target = this.get('target');
    var pool = name2pool[target];
    if (!pool) {
      pool = name2pool[target] = {
        portals: []
      }
    }
    return pool;
  }
});

Portal.Target = defineClass({
  extends: Component,
  statics:{
    fullname: 'Portal.Target'
  },
  setup: function setup() {
    var target = this;
    target.on('started', function() {
      var name = target.get('name');
      var pool = name2pool[name];
      if (!pool) {
        name2pool[name] = {
          target: target,
          portals: []
        };
      } else if (!pool.target && pool.portals.length) {
        for (var i = 0; i < pool.portals.length; ++i) {
          if (pool.portals[i].fragment) {
            target.append(pool.portals[i]);
          }
        }
        pool.portals.length = 0;
      } else {
        throwError('A portal target with the same name="' + name + '" already exists')
      }
    });
    target.on('destroy', function() {
      var name = target.get('name');
      delete name2pool[name];
    });
  },
  append: function append(portal) {
    if (!portal.fragment) {
      portal.fragment = new Fragment();
    }
    this.appendChild(portal.fragment);
  },
  remove: function remove(portal) {
    if (!portal.fragment) {
      return
    }
    this.removeChild(portal.fragment);
  }
})