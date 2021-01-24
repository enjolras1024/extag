// src/core/shells/Text.js

import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import Parent from 'src/core/shells/Parent'
import { throwError, defineClass } from 'src/share/functions'
import {
  TYPE_TEXT,
  FLAG_MOUNTED,
  FLAG_CHANGED_CACHE,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_DIGESTING,
  FLAG_SHOULD_RENDER_TO_VIEW
} from 'src/share/constants'



export default function Text(content) {
  Text.initialize(this, content);
}

defineClass({
  constructor: Text, extends: Shell,

  statics: {
    // /**
    //  * Create a text.
    //  * @param {string} content - as text content
    //  */
    // create: function(content) {
    //   return new Text(content);
    // },

    /**
     * initialize the text with content.
     * @param {Text} text
     * @param {string} content
     */
    initialize: function(text, content) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (text.constructor !== Text) {
          throwError('Text is final class and can not be extended');
        }
      }
      Shell.initialize(text, TYPE_TEXT, '', '');
      text.set('content', content != null ? content : '');
    }
  },

  get: function(key) {
    if (key === 'content') {
      return this._content;
    }
  },

  set: function(key, value) {
    if (key === 'content' && value !== this._content) {
      this._dirty = true;
      this._content = value;
      this.invalidate(FLAG_CHANGED_CACHE);
    }
  },

  /**
   * Update this shell and append it to the schedule for rendering.
   * @param {boolean} force - If true, update this shell anyway.
   */
  update: function update() {
    if ((this.$flag & FLAG_WAITING_UPDATING) === 0) {
      return false;
    }
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      this.$flag |= FLAG_WAITING_DIGESTING;
      Schedule.insertDigestQueue(this);
    }
    // this.$flag ^= FLAG_WAITING_UPDATING;
    // this.digest();
  },

  /**
   * Render the dirty parts of this shell to the attached skin 
   */
  digest: function digest() {
    if ((this.$flag & FLAG_WAITING_DIGESTING) === 0) {
      return false;
    }

    if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
      var viewEngine = Shell.getViewEngine(this);
      // if (!viewEngine) { return this; }
      viewEngine.renderShell(this.$skin, this);
      // DirtyMarker.clean(this);
      this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
      this._dirty = false;
    }

    if (this.$skin && (this.$flag & FLAG_MOUNTED === 0)) {
      this.$flag |= FLAG_MOUNTED;
    }

    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_DIGESTING);
  },

  getParent: Parent.prototype.getParent,

  /**
   * return text content snapshot and its guid.
   * @override
   */
  toString: function() {
    var content = this._content;
    content = content == null ? '' : content.toString();
    return '"' + (content.length < 24 ? content : (content.slice(0, 21) + '...'))  + '"(' + this.$meta.guid +')';
  }
});
