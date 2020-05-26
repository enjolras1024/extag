// src/base/Parent.js

import { defineClass, throwError } from 'src/share/functions'
import { TYPE_FRAG, FLAG_CHANGED_CHILDREN } from 'src/share/constants'

/**
 * Parent is in charge of its children.
 * @class
 * @constructor
 */
export default function Parent() {
  throwError('Parent is a base class and can not be instantiated!');
}

function findParent(shell) {
  var temp = shell._parent;
  while (temp && temp.$meta.type === TYPE_FRAG) {
    temp = temp._parent;
  }
  return temp;
}

function flattenChildren(shell, array) {
  var children = shell._children;
  var i, n = children.length, child;
  array = array || [];
  for (i = 0; i < n; ++i) {
    child = children[i];
    if (child.$meta.type === TYPE_FRAG) {
      flattenChildren(child, array);
    } else {
      array.push(child);
    }
  }
  return array;
}

defineClass({
  constructor: Parent, // mixins: [Watcher.prototype],

  statics: {
    /**
     * Clean the parent.
     * @param {Parent} parent
     */
    clean: function(parent) {
      if (parent._children) {
        parent._children.isInvalidated = false;
      }
    },

    // invalidate: function invalidate(parent) {
    //   if (parent._children) {
    //     parent._children.isInvalidated = true;
    //     parent.invalidate(FLAG_CHANGED_CHILDREN);
    //   }
    // },

    findParent: findParent,
    flattenChildren: flattenChildren
  },

  getParent: function (actual) {
    return actual ? findParent(this) : this._parent;
  },

  getChildren: function getChildren(actual) {
    if (actual) {
      return flattenChildren(this);
    }
    return this._children ? this._children.slice(0) : [];
  },

  /**
   * Reset this parent. Clear old items, push new items.
   * @param {Array} items
   */
  setChildren: function setChildren(children) {
    var i;
    var _children = this._children;
    var n = children ? children.length : 0;
    var m = _children ? _children.length : 0;

    if (m === n) {
      for (i = 0; i < n; ++i) {
        if (_children[i] !== children[i]) {
          break;
        }
      }
      if (i === n) { // nothing change
        return this;
      }
    }
 
    if (m) {
      for (i = 0; i < m; ++i) {
        _children[i]._parent = null;
      }
      _children.length = 0;
    }
    if (n) {
      for (i = 0; i < n; ++i) {
        this.insertChild(children[i], null);
      }
    } else if (m) {
      this.invalidate(FLAG_CHANGED_CHILDREN);
    }

    return this;
  },

  /**
   * Insert child before another one which must be in this parent or be null, 
   * like `insertBofore` and `appendChild`.
   * @param {Shell} child     - child to be inserted into this parent
   * @param {Shell} brefore  - child that already exists in this parent. If null, child is appended.
   */
  insertChild: function insertChild(child, before) {
    if (child == null) {
      throwError('The new child to be inserted into this parent must not be null!');
    }
    // if (child.$guid <= this.$guid) {
    //   throwError('The child must be created after its parent for rendering top-down (parent to child)!')
    // }
    var i, j, n, children = this._children;

    if (!children) {
      children = [];
      this._children = children;
      // defineProp(this, '_children', {
      //   value: children, writable: false, enumerable: false, configurable: true
      // });
    }

    n = children.length;

    if (before != null) {
      for (i = 0; i < n; ++i) {
        if (children[i] === before && this === before._parent) {
          break;
        }
      }
      if (i === n) {
        throwError('The child before which the new child is to be inserted is not a child of this parent!');
      }
      if (before === child) { 
        return this; 
      }
    } else {
      i = n;
    }

    // if (__ENV__ === 'development') {
    //   if (child.guid < this.guid) {
    //     logger.warn('Do not insert the child ' + child.toString() + ' into ' + this.toString() + '. The parent\'s guid should be less than the child\'s for ordered updating from parent to child.');
    //   }
    // }

    if (child._parent) {
      if (child._parent === this) {
        for (j = 0; j < n; ++j) {
          if (children[j] === child) {
            if (j === i) {
              return this;
            }
            children.splice(j, 1);
            i = j < i ? i - 1 : i;
            n = children.length;
            break;
          }
        }
      } else {
        child._parent.removeChild(child);
      }
    } 

    if (i < n) {
      children.splice(i, 0, child);
    } else {
      children.push(child);
    }

    child._parent = this;

    this.invalidate(FLAG_CHANGED_CHILDREN);

    return this;
  },

  appendChild: function appendChild(child) {
    this.insertChild(child, null);
  },

  /**
   * Revome an child from this parent, like `removeChild`.
   * @param {Shell} child - an child that already exists in this parent
   */
  removeChild: function removeChild(child) {
    if (child == null) {
      throwError('The new child to be removed from this parent must not be null!');
    }

    var i = 0, n = 0, children = this._children;

    if (children) {
      for (i = 0, n = children.length; i < n; ++i) {
        if (children[i] === child && this === child._parent) {
          break;
        }
      }
    }

    if (i === n) { 
      throwError('The child to be removed is not a child of this parent!');
    }

    if (i < n -1) {
      children.splice(i, 1);
    } else {
      children.pop();
    }

    child._parent = null;
    this.invalidate(FLAG_CHANGED_CHILDREN);

    return this;
  },

  /**
   * Replace the exsited child with new one, like `replaceChild`.
   * @param {Object} child     - a new child as replacement
   * @param {Object} existed  - the exsited child in this parent
   */
  replaceChild: function replaceChild(child, existed) {
    if (child == null) {
      throwError('The new child to be inserted into this parent must not be null!');
    }
    
    // if (child === existed) { return /*this*/; }

    var i = 0, j = 0, n = 0, children = this._children;

    if (children) {
      for (i = 0, n = children.length; i < n; ++i) {
        if (children[i] === existed && this === existed._parent) {
          break;
        }
      }
    }

    if (i === n) {
      throwError('The child to be replaced is not a child of this parent!');
    }

    if (child === existed) { 
      return this; 
    }

    if (child._parent) {
      if (child._parent === this) {
        for (j = 0; j < n; ++j) {
          if (children[j] === child) {
            children.splice(j, 1);
            i = j < i ? i - 1 : i;
            n = children.length;
            break;
          }
        }
      } else {
        child._parent.removeChild(child);
      }
    }

    existed._parent = null;
    child._parent = this;
    children[i] = child;

    this.invalidate(FLAG_CHANGED_CHILDREN);

    return this;
  }
});