// src/core/shells/Text.js
import Parent from 'src/base/Parent'
import Schedule from 'src/core/Schedule'
import Shell from 'src/core/shells/Shell'
import { defineClass } from 'src/share/functions'
import {
  TYPE_TEXT,
  FLAG_CHANGED_CACHE,
  FLAG_WAITING_UPDATING,
  FLAG_WAITING_RENDERING,
  FLAG_SHOULD_RENDER_TO_VIEW
} from 'src/share/constants'



export default function Text(data) {
  Text.initialize(this, data);
}

defineClass({
  constructor: Text, extends: Shell,

  statics: {
    /**
     * Create a text.
     * @param {string} data - as text data
     */
    create: function(data) {
      return new Text(data);
    },

    /**
     * initialize the text with data.
     * @param {Text} text
     * @param {string} data
     */
    initialize: function(text, data) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (text.constructor !== Text) {
          throw new TypeError('Text is final class and can not be extended');
        }
      }
      Shell.initialize(text, TYPE_TEXT, '', '');
      text.set('data', data || '');
    }
  },

  get: function(key) {
    if (key === 'data') {
      return this._data;
    }
  },

  set: function(key, value) {
    if (key === 'data' && value !== this._data) {
      this._data = value;
      this._dirty = true;
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
    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      this.$flag |= FLAG_WAITING_RENDERING;
      Schedule.insertRenderQueue(this);
    }
    // this.$flag ^= FLAG_WAITING_UPDATING;
    // this.render();
    return true;
  },

  /**
   * Render the dirty parts of this shell to the attached skin 
   */
  render: function render() {
    if ((this.$flag & FLAG_WAITING_RENDERING) === 0) {
      return false;
    }
    // if (this.$flag === FLAG_NORMAL) {
    //   return false;
    // }

    if (this.$skin && (this.$flag & FLAG_SHOULD_RENDER_TO_VIEW)) {
      var viewEngine = Shell.getViewEngine(this);
      // if (!viewEngine) { return this; }
      viewEngine.renderShell(this.$skin, this);
      // DirtyMarker.clean(this);
      this.$flag &= ~FLAG_SHOULD_RENDER_TO_VIEW;
      this._dirty = false;
    }

    this.$flag &= ~(FLAG_WAITING_UPDATING | FLAG_WAITING_RENDERING);
    // this.$flag = FLAG_NORMAL;

    return true;
  },

  getParent: Parent.prototype.getParent,

  /**
   * return text data snapshot and its guid.
   * @override
   */
  toString: function() {
    var data = this.get('data');
    data = data == null ? '' : data.toString();
    return '"' + (data.length < 24 ? data : (data.slice(0, 21) + '...'))  + '"(' + this.$meta.guid +')';
  }
});
