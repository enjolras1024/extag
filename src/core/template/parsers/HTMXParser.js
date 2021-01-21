// src/core/template/parsers/HTMXParser.js

import { 
  HOOK_ENGINE,
  EXTAG_VNODE,
  BINDING_FORMAT,
  CAPITAL_REGEXP,
  BINDING_OPERATORS,
  WHITE_SPACE_REGEXP
} from 'src/share/constants'
import { 
  hasOwnProp,
  decodeHTML, 
  throwError
} from 'src/share/functions'
import config from 'src/share/config'
import logger from 'src/share/logger'
import Path from 'src/base/Path'
import Slot from 'src/core/shells/Slot'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
import TextBinding  from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import HTMXEngine from 'src/core/template/HTMXEngine'
import ClassStyleParser from 'src/core/template/parsers/ClassStyleParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import TextBindingParser from 'src/core/template/parsers/TextBindingParser'
import EventBindingParser from 'src/core/template/parsers/EventBindingParser'
import PrimitiveLiteralParser from 'src/core/template/parsers/PrimitiveLiteralParser'

var PARENTHESES_REGEXP = /^\(.+\)$/;
var FOR_OF_SPLITTER = /\s+of\s+/;
var COMMA_SPLITTER = /,/;
var VARNAME_REGEXP = /^[\w\$\_]+$/;
var LETTER_REGEXP = /[a-zA-Z]/;
var TAGNAME_STOP = /[\s/>]/;
var ATTRNAME_SPLITTER = /[\s\/]+/;
var X_TAG_REGEXP = /^x:/;

// var viewEngine = null;

var namespaceURIs = {
  html: 'http://www.w3.org/1999/xhtml',
  math: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
};

function toNameSpace(xmlns) {
  if (!xmlns || xmlns === namespaceURIs.html) {
    return '';
  } else if (xmlns === namespaceURIs.svg) {
    return 'svg';
  } else if (xmlns === namespaceURIs.math) {
    return 'math';
  } else if (xmlns === namespaceURIs.xlink) {
    return 'xlink';
  }
  return null;
}

var SELF_CLOSING_TAGS = {
  '!': true,
  br: true,
  hr: true,
  area: true,
  base: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  basefont: true,
  param: true,
  col: true,
  frame: true,
  embed: true,
  keygen: true,
  source: true,
  command: true,
  track: true,
  wbr: true
};

var DIRECTIVES = {
  'x:ns': true,
  'x:if': true,
  'x:for': true,
  'x:key': true,
  'x:name': true,
  'x:slot': true,
  'x:type': true,
  'x:class': true,
  'x:style': true
}

function getGroup(node, name) {
  var group = node[name];
  if (group == null) {
    node[name] = group = {};
  }
  return group;
}

function isDirective(name) {
  return name.charCodeAt(0) === 120 // 'x'
          && (name in DIRECTIVES);
}

function isSelfClosingTag(tagName) {
  return hasOwnProp.call(SELF_CLOSING_TAGS, tagName);
}

function findComponentClass(expr, prototype) {
  var ctor = Path.search(expr, prototype.constructor.resources);
  if (typeof ctor === 'function') {
    if (ctor.__extag_component_class__) {
      return ctor;
    }
    var hookEngine = config.get(HOOK_ENGINE);
    if (hookEngine) {
      ctor = hookEngine.getHookableComponentClass(ctor);
      if (typeof ctor === 'function' && ctor.__extag_component_class__) {
        return ctor;
      }
    }
    // eslint-disable-next-line no-undef
    if (__ENV__ === 'development') {
      logger.warn('`' + expr+ '` maybe component, but the class is not found.');
    }
  } 
}

function parseDirective(name, expr, node, prototype, identifiers) {
  var result;
  if (name === 'x:class') {
    node.classes = ClassStyleParser.parse(expr, prototype, identifiers, false);
  } else if (name === 'x:style') {
    node.style = ClassStyleParser.parse(expr, prototype, identifiers, true);
  } else if (name === 'x:type') {
    var ctor = findComponentClass(expr, prototype);
    if (ctor) {
      node.type = ctor;
    } else {
      result = DataBindingParser.parse(expr, prototype, identifiers);
      node.xtype = new Expression(DataBinding, result);
    }
  } else if (name === 'x:name') {
    node.name = expr;
  } else if (name === 'x:slot') {
    node.slot = expr;
  } else if (name === 'x:key') {
    result = DataBindingParser.parse(expr, prototype, identifiers);
    node.xkey = new Expression(DataBinding, result);
  } else if (name === 'x:for') {
    var pieces = expr.trim().split(FOR_OF_SPLITTER);
    
    if (pieces.length !== 2) {
      throwError('Illegal x:for="' + expr + '".', {
        code: 1001,
        expr: expr
      });
    }

    result = pieces[1].trim();
    pieces[0] = pieces[0].trim();
    if (PARENTHESES_REGEXP.test(pieces[0])) { 
      // x:for="(item, index) of items" 
      pieces = pieces[0].slice(1, -1).split(COMMA_SPLITTER);
    } else {
      // x:for="item of items" 
      pieces = [pieces[0]];
    }

    for (var i = 0; i < pieces.length; ++i) {
      pieces[i] = pieces[i].trim();
      if (!VARNAME_REGEXP.test(pieces[i])) {
        throwError('Illegal x:for="' + expr + '".', {
          code: 1001,
          expr: expr
        });
      }
    }

    result = result && DataBindingParser.parse(result, prototype, identifiers);
    if (result) {
      node.xfor = [pieces, new Expression(DataBinding, result)];
    } else {
      throwError('Illegal x:for="' + expr + '".', {
        code: 1001,
        expr: expr
      });
    }

    node.identifiers = identifiers.slice(0);
    node.identifiers.push(pieces);
  } else if (name === 'x:if') {
    result = DataBindingParser.parse(expr, prototype, identifiers);
    if (result) {
      node.xif = new Expression(DataBinding, result);
    } else {
      throwError('Illegal x:if="' + expr + '".', {
        code: 1001,
        expr: expr,
      });
    }
  } else if (name === 'x:ns') {
    node.ns = expr;
  }
}

function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
  var lastChar = attrName[attrName.length - 1];
  var result, group, key;

  if (attrValue == null) {
    group = getGroup(node, 'attrs');
    group[attrName] = true;
    return;
  }

  if (lastChar === BINDING_OPERATORS.EVENT) { // last char is '+'
    group = getGroup(node, 'events');
    key = attrName.slice(0, -1);
    // attrName = attrName.slice(0, -1);
    // key = index < 0 ? toCamelCase(attrName) : attrName;
    result = EventBindingParser.parse(attrValue, prototype, identifiers);
    group[key] = new Expression(EventBinding, result);
  } else {
    group = getGroup(node, 'attrs');
    switch (lastChar) {
      case BINDING_OPERATORS.DATA: // last char is '@'
        key = attrName.slice(0, -1);
        result = PrimitiveLiteralParser.tryParse(attrValue.trim());
        if (result != null) {
          group[key] = result;
        } else {
          result = DataBindingParser.parse(attrValue, prototype, identifiers);
          group[key] = new Expression(DataBinding, result);
        }
        break;
      case BINDING_OPERATORS.TEXT: // last char is '#'
        key = attrName.slice(0, -1);
        try {
          result = TextBindingParser.parse(attrValue, prototype, identifiers);
        } catch (e) {
          // eslint-disable-next-line no-undef
          if (__ENV__ === 'development') {
            if (e.code === 1001) {
              e.expr = BINDING_FORMAT.replace('0', e.expr);
            }
          }
          throw e;
        }
        if (result) {
          if (result.length === 1) {
            group[key] = result[0];
          } else {
            group[key] = new Expression(TextBinding, result);
          }
        } else {
          group[key] = attrValue;
        }
        break;
      default:
        group[attrName] = attrValue;
    }
  }
}

function getStopOf(regex, htmx, from) {
  var end = htmx.length, idx = from;
  while (idx < end) {
    if (regex.test(htmx[idx])) {
      return idx;
    }
    idx = idx + 1;
  }
  return -1;
}

function getSnapshot(htmx, expr, node, start) {
  var i = htmx.indexOf(expr, start);
  var j = htmx.indexOf('\n', i + expr.length);
  j = j > 0 ? j : htmx.length;
  if (j > i + expr.length * 4) {
    j = i + expr.length * 4;
  }
  return [
    htmx.slice(node.range[0], i) + '%c' + expr + '%c' + htmx.slice(i + expr.length, j), 
    'color:red;', 
    ''
  ]
}

function parseAttributes(htmx, from, node, prototype) {
  var idx = from, start = from, stop = from, end = htmx.length;
  var cc, attrName, attrNames;//, operator, attributes = [];
  while (idx < end) {
    cc = htmx[idx];
    if (attrName) {
      if (!WHITE_SPACE_REGEXP.test(cc)) {
        if (cc === '"' || cc === "'") {
          start = idx + 1;
          stop = htmx.indexOf(cc, start);
        } else {
          start = idx;
          stop = getStopOf(TAGNAME_STOP, htmx, start);
        }

        stop = stop > 0 ? stop : end;

        if (node) {
          try {
            if (isDirective(attrName)) {
              parseDirective(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
            } else {
              parseAttribute(attrName, htmx.slice(start, stop), node, prototype, node.identifiers);
            }
          } catch(e) {
            // eslint-disable-next-line no-undef
            if (__ENV__ === 'development') {
              if (e.code === 1001) {
                var snapshot = getSnapshot(htmx, e.expr, node, start);
                logger.warn((e.desc || e.message) + ' In the template of component ' 
                  + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
                  + snapshot[0], snapshot[1], snapshot[2]);
              }
            }
            throw e;
          }
        }

        if (htmx[stop] === '>') {
          return stop;
        }

        attrName = null;
        idx = stop + 1;
        start = stop = idx;
        continue;
      }
    } else if (cc === '>') {
      stop = idx;
      if (start < stop) {
        attrNames = htmx.slice(start, stop).trim().split(ATTRNAME_SPLITTER);
        while(attrNames.length > 0) {
          attrName = attrNames.shift();
          if (attrName && node) {
            parseAttribute(attrName, null, node, prototype, node.identifiers);
            // getGroup(node, 'attrs')[viewEngine.toCamelCase(attrName)] = '';
          }
        }
      }
      return stop;
    } else if (cc === '=') {
      stop = idx;
      if (start < stop) {
        attrNames = htmx.slice(start, stop).trim().split(ATTRNAME_SPLITTER);
        while(attrNames.length > 1) {
          attrName = attrNames.shift();
          if (attrName && node) {
            parseAttribute(attrName, null, node, prototype, node.identifiers);
            // getGroup(node, 'attrs')[viewEngine.toCamelCase(attrName)] = '';
          }
        }
        attrName = attrNames.shift();
      }
      idx = stop + 1;
      start = stop = idx;
      continue;
    }
    idx = idx + 1;
  }
}

// var LF_IN_BLANK_REGEXP = /\s*\n\s*/;
var LF_IN_BLANK_START = /^\s*\n\s*/;
var LF_IN_BLANK_END = /\s*\n\s*$/;

function createExprNode(binding, pattern) {
  return {
    __extag_node__: EXTAG_VNODE,
    useExpr: true,
    type: Expression,
    expr: pattern instanceof Expression ? 
          pattern : new Expression(binding, pattern)
  }
}

function parseTextNode(htmx, start, stop, parent, prototype, identifiers) {
  var contents = parent.contents || [], result;
  var text = htmx.slice(start, stop);
  text = text.replace(LF_IN_BLANK_START, '').replace(LF_IN_BLANK_END, '');
  if (!text) {
    return;
  }

  if (TextBindingParser.like(text)) {
    try {
      result = TextBindingParser.parse(text, prototype, identifiers);
    } catch (e) {
      // eslint-disable-next-line no-undef
      if (__ENV__ === 'development') {
        if (e.code === 1001) {
          var snapshot = getSnapshot(htmx, e.expr, parent, start);
          logger.warn((e.desc || e.message) + ' In the template of component ' 
                  + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
                  + snapshot[0], snapshot[1], snapshot[2]);
        }
      }
      throw e;
    }
    if (result) {
      if (result.length === 1 && (result[0] instanceof Expression)) {
        expr = result[0];
        contents.push(createExprNode(result[0].binding, result[0]));
      } else {
        var i = -1, j = 0 , n = result.length;
        for (; j < n; ++j) {
          var expr = result[j];
          if ((expr instanceof Expression) && expr.pattern.target === 'frag') {
            if (j > i) {
              if (j - i > 1) {
                contents.push(createExprNode(TextBinding, result.slice(i, j)));
              } else if (result[i] instanceof Expression) {
                contents.push(createExprNode(result[i].binding, result[i]));
              } else {
                contents.push(result[i]);
              }
            }
            contents.push(createExprNode(expr.binding, expr));
            i = -1;
          } else if (i < 0) {
            i = j;
          }
        }
        if (i >= 0 && j > i) {
          if (j - i > 1) {
            contents.push(createExprNode(TextBinding, result.slice(i, j)));
          } else if (result[i] instanceof Expression) {
            contents.push(createExprNode(result[i].binding, result[i]));
          } else {
            contents.push(result[i]);
          }
        }
      }
    } else {
      contents.push(decodeHTML(text));
    }
  } else {
    contents.push(decodeHTML(text));
  }
  parent.contents = contents;
}

function parseHTMX(htmx, prototype) {
  htmx = htmx.trim();

  var cc, nc;
  var node, tagName;
  var start = 0, stop = 0;
  var parent, parents = [];
  var idx = 0, end = htmx.length;

  parent = {
    tag: '<>',
    contents: [],
    identifiers: ['this']
  };
  parents.push(parent);

  while (idx < end) {
    cc = htmx[idx];
    if (cc === '<') {
      nc = htmx[idx + 1];
      if (LETTER_REGEXP.test(nc)) {
        if (start < idx) {
          parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
        }
        // tag starts
        start = idx + 1;
        stop = getStopOf(TAGNAME_STOP, htmx, start);
        tagName = htmx.slice(start, stop);
   
        node = {};
        node.tag = tagName;
        node.useExpr = true;
        node.__extag_node__ = EXTAG_VNODE;

        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          node.range = [start-1, -1];
        }
        
        node.identifiers = parent.identifiers;

        if ('>' !== htmx[stop]) {
          start = stop = stop + 1;
          stop = parseAttributes(htmx, start, node, prototype, node.identifiers);
        }

        if (!node.ns) {
          if (node.attrs && node.attrs.xmlns) {
            node.ns = toNameSpace(node.attrs.xmlns);
          } else if (parent.ns) {
            node.ns = parent.ns;
          }
        }

        if (node.type == null && node.xtype == null) {
          if (X_TAG_REGEXP.test(tagName)) {
            switch (tagName) {
              case 'x:slot':
                node.type = Slot;
                break;
              case 'x:frag':
                node.type = Fragment;
                break;
            }
          } else if (CAPITAL_REGEXP.test(tagName)) {
            var ctor = findComponentClass(tagName, prototype);
            if (ctor) {
              node.type = ctor;
            }
          }
        }

        if (parent) {
          parent.contents = parent.contents || [];
          parent.contents.push(node);
        }
        
        if (htmx[stop - 1] !== '/' && !isSelfClosingTag(tagName)) {
          parents.push(node);
          parent = node;
        }

        // eslint-disable-next-line no-undef
        if (__ENV__ === 'development') {
          node.range[1] = stop;
        }

        idx = stop + 1;
        start = stop = idx;
        continue;
      } else if ('/' === nc && LETTER_REGEXP.test(htmx[idx + 2])) {
        if (start < idx) {
          parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
        }

        start = idx + 2;
        stop = getStopOf(TAGNAME_STOP, htmx, start);
        tagName = htmx.slice(start, stop);

        if (tagName !== parent.tag) {
          // eslint-disable-next-line no-undef
          if (__ENV__ === 'development') {
            var snapshot = getSnapshot(htmx, tagName, parent, start);
            logger.warn('Unclosed tag `' + parent.tag + '`. In the template of component ' 
                  + (prototype.constructor.fullname || prototype.constructor.name) + ':\n' 
                  + snapshot[0], snapshot[1], snapshot[2]);
          }
          throwError('Unclosed tag ' + parent.tag);
        }

        if ('>' !== htmx[stop]) {
          start = stop = stop + 1;
          stop = parseAttributes(htmx, start);
        }
        // tag closed
        if (parents.length > 1) {
          parents.pop();
          // check <x:frag>@{{draw()^}}</x:frag>
        } else {
          // if (stop < end) {
          //   throw new Error('');
          // }
          return parents[0];
        }

        if (parents.length > 0) {
          parent = parents[parents.length - 1];
        } 

        idx = stop + 1;
        start = stop = idx;
        continue;
      } else if ('!' === nc && '<!--' === htmx.slice(idx, idx + 4)) {
        // comment
        if (start < idx) {
          parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
        }
        start = idx + 4;
        stop = htmx.indexOf('-->', start);
        stop = stop > 0 ? stop : htmx.length;
        // node =  {
        //   tag: '!',
        //   comment: htmx.slice(start, stop),
        //   __extag_node__: EXTAG_VNODE
        // };
        // parent.contents = parent.contents || [];
        // parent.contents.push(node);
        idx = stop + 3;
        start = stop = idx;
        continue;
      }
    }

    idx = idx + 1;
  }

  if (start < end) {
    parseTextNode(htmx, start, end, parent, prototype, parent.identifiers);
  }

  return parents;
}

var HTMXParser = {
  parse: function(htmx, prototype) {
    // viewEngine = viewEngine || config.get(VIEW_ENGINE);

    var constructor = prototype.constructor;
    var nodes = parseHTMX(htmx, prototype);
    var contents = nodes[0].contents;
    var root = contents[0];

    if (contents.length !== 1) {
      throwError('The template of component ' + (constructor.fullname || constructor.name) + ' must have only one root tag.')
    }
    if (root.tag === '!' || root.tag === '#') {
      throwError('Component template root tag must be a DOM element, instead of: ' + htmx.slice(0, htmx.indexOf('>')));
    }
    if (root.tag === 'x:slot' || root.tag === 'x:view') {
      throwError(root.tag + ' can not be used as root tag of component template: ' + htmx.slice(0, htmx.indexOf('>')));
    }
    if (root.type && root.type.__extag_component_class__) {
      throwError('component can not be used as root tag of another component template: ' + htmx.slice(0, htmx.indexOf('>')));
    }
    if (root.xif || root.xfor || root.xkey) {
      throwError('`x:if`, `x:for`, `x:key` can not be used on root tag of component template: '  + htmx.slice(0, htmx.indexOf('>')));
    }

    return root;
  }
};

HTMXEngine.parseHTMX = HTMXParser.parse;

export default HTMXParser