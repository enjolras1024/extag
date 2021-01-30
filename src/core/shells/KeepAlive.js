// src/core/shells/KeepAlive.js

import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
import { defineClass, throwError } from 'src/share/functions'

function findFragementByKey(key, fragments) {
  for (var i = 0; i < fragments.length; ++i) {
    if (fragments[i] && fragments[i].xkey === key) {
      return fragments[i];
    }
  }
}

function findContentByKey(key, contents) {
  for (var i = 0; i < contents.length; ++i) {
    if (contents[i] && contents[i].xkey === key) {
      return contents[i];
    }
  }
}

function checkContents(contents, keepAlive) {
  var keys = [];
  for (var i = 0; i < contents.length; ++i) {
    var content = contents[i];
    if (content == null || content.xkey == null) {
      continue;
    }
    // if (content.xkey == null) {
    //   throwError('xkey is required for all contents of ', keepAlive);
    // }
    if (keys.indexOf(content.xkey) >= 0) {
      throwError('duplicated xkey `' + content.xkey + '` for all contents of ', keepAlive);
    }
    keys.push(content.xkey); // xkey can be number, string, symbol, function...
  }
}

export default function KeepAlive() {
  Component.apply(this, arguments);
}

defineClass({
  constructor: KeepAlive, extends: Component,
  setup: function setup() {
    this.fragments = [];
    this.recyclebin = new Fragment();
    this.on('contents', this.onContents.bind(this));
    this.on('destroying', this.onDestroying.bind(this));
  },
  onContents: function onContents(contents) {
    var children, content, fragment, i;

    checkContents(contents, this);

    children = this.getChildren();
    for (i = children.length - 1; i >=0; --i) {
      fragment = children[i];
      if (fragment.xkey == null) {
        continue;
      }
      content = findContentByKey(fragment.xkey, contents);
      if (!content) {
        // recycle to avoid destroying removed fragment
        this.removeChild(fragment);
        this.recyclebin.appendChild(fragment);
      }
    }

    children = [];
    for (i = 0; i < contents.length; ++i) {
      content = contents[i];
      if (content == null) {
        continue;
      }
      if (content.xkey != null) {
        fragment = findFragementByKey(content.xkey, this.fragments);
        if (!fragment) {
          fragment = new Fragment();
          fragment.xkey = content.xkey;
          this.fragments.push(fragment);
        } 
      } else {
        fragment = new Fragment();
      }
      // update the only child of the fragment
      fragment.accept([content], contents.scopes);
      children.push(fragment);
    }
    this.setChildren(children);
  },
  onDestroying: function onDestroying() {
    this.recyclebin.detach(); // destroying fragments in recyclebin
  }
})