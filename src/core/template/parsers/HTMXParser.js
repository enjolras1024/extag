// src/core/template/parsers/HTMXParser.js

import config from 'src/share/config'
import { 
  VIEW_ENGINE, 
  CONTEXT_SYMBOL } 
  from 'src/share/constants'
import { decodeHTML, throwError } from 'src/share/functions'
import logger from 'src/share/logger'
import Path from 'src/base/Path'
import View from 'src/core/shells/View'
import Slot from 'src/core/shells/Slot'
import Block from 'src/core/shells/Block'
import Fragment from 'src/core/shells/Fragment'
import Expression from 'src/core/template/Expression'
import DataBinding from 'src/core/bindings/DataBinding'
// import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import FragmentBinding  from 'src/core/bindings/FragmentBinding'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import ClassStyleParser from 'src/core/template/parsers/ClassStyleParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import EventBindingParser from 'src/core/template/parsers/EventBindingParser'
import FragmentBindingParser from 'src/core/template/parsers/FragmentBindingParser'
import PrimaryLiteralParser from 'src/core/template/parsers/PrimaryLiteralParser'

var FOR_LOOP_REGEXP = /^([\_\$\w]+)\s+of\s+(.+)$/;
var CAPITAL_REGEXP = /^[A-Z]/;
var LETTER_REGEXP = /[a-zA-Z]/;
var TAGNAME_STOP = /[\s\/>]/;
var LF_IN_BLANK = /\s*\n\s*/g;
var WHITE_SPACE = /\s/;
var WHITE_SPACES = /\s+/;

var viewEngine = null;

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
  return SELF_CLOSING_TAGS.hasOwnProperty(tagName);
}

function parseDirective(name, expr, node, prototype, identifiers) {
  var result;
  if (name === 'x:class') {
    node.classes = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, false);
  } else if (name === 'x:style') {
    node.style = ClassStyleParser.parse(expr, prototype, identifiers, viewEngine, true);
  } else if (name === 'x:type') {
    var ctor = Path.search(expr, prototype.constructor.resources);
    if (typeof ctor !== 'function' || !ctor.__extag_component_class__) {
      // if (__ENV__ === 'development') {
      //   logger.warn('Can not find such component type `' + expr + '`. Make sure it extends Component and please register `' + expr  + '` in static resources.');
      // }
      // throw new TypeError('Can not find such component type `' + expr + '`');
      throwError('Illegal x:type="' + expr + '"', {
        code: 1001,
        expr: expr,
        desc: 'Can not find such component type `' + expr 
              + '`. Make sure it extends Component and please register `' + expr 
              + '` in static resources.'
      });
    }
    node.type = ctor;
  } else if (name === 'x:name') {
    node.name = expr;
  } else if (name === 'x:key') {
    node.xkey = EvaluatorParser.parse(expr, prototype, identifiers);
  } else if (name === 'x:for') {
    var matches = expr.trim().match(FOR_LOOP_REGEXP);

    if (!matches || !matches[2].trim()) {
      throwError('Illegal x:for="' + expr + '".', {
        code: 1001,
        expr: expr
      });
      // logger.warn('Illegal x:for="' + expr + '"');
      // return;
    }

    // if (matches[6].lastIndexOf('::') < 0) {
    //   matches[6] += '::[].slice(0)';
    // }

    // var expression = DataBindingParser.parse('{' + matches[2] + '}', prototype, resources, identifiers);
    result = DataBindingParser.parse(matches[2], prototype, identifiers);

    if (result) {
      // getGroup(node, 'ctrls').xFor = new Expression(DataBinding, result);
      node.xfor = [matches[1], new Expression(DataBinding, result)];
    } else {
      throwError('Illegal x:for="' + expr + '".', {
        code: 1001,
        expr: expr
      });
      // logger.warn('Illegal x:for="' + expr + '"');
      // return;
    }

    node.identifiers = identifiers.concat([matches[1]]);
  } else if (name === 'x:if') {
    result = DataBindingParser.parse(expr, prototype, identifiers);
    if (result) {
      node.xif = new Expression(DataBinding, result);
    } else {
      throwError('Illegal x:if="' + expr + '".', {
        code: 1001,
        expr: expr,
      });
      // logger.warn('Illegal x:if="' + expr + '"');
      // return;
    }
  } else if (name === 'x:ns') {
    node.ns = expr;
  }
}

function parseAttribute(attrName, attrValue, node, prototype, identifiers) {
  var lastChar = attrName[attrName.length - 1];
  var result, group, key;

  if (lastChar === '+') {
    group = getGroup(node, 'events');
    key = viewEngine.toCamelCase(attrName.slice(0, -1));
    result = EventBindingParser.parse(attrValue, prototype, identifiers);
    group[key] = new Expression(EventBinding, result);
  } else {
    group = attrName.indexOf(':') < 0 ? getGroup(node, 'props') : getGroup(node, 'attrs');
    switch (lastChar) {
      case '@':
        key = viewEngine.toCamelCase(attrName.slice(0, -1));
        result = PrimaryLiteralParser.tryParse(attrValue);
        if (result != null) {
          group[key] = result;
        } else {
          result = DataBindingParser.parse(attrValue, prototype, identifiers);
          group[key] = new Expression(DataBinding, result);
        }
        break;
      case '#': 
        key = viewEngine.toCamelCase(attrName.slice(0, -1));
        result = FragmentBindingParser.parse(attrValue, prototype, identifiers);
        if (result) {
          result.asStr = true;
          group[key] = new Expression(FragmentBinding, result);
        } else {
          group[key] = attrValue;
        }
        break;
      // case '+':
      //   name = viewEngine.toCamelCase(attrName.slice(0, -1));
      //   result = EventBindingParser.parse(attrValue, prototype, identifiers);
      //   getGroup(node, 'events')[name] = new Expression(EventBinding, result);
      //   break;
      default:
        key = viewEngine.toCamelCase(attrName);
        group[key] = viewEngine.isBoolProp(key) || attrValue;
        break;
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
  // var i = htmx.lastIndexOf(limit[0], node.range[0]);
  // var j = htmx.indexOf(limit[1], range[1]);
  var i = htmx.indexOf(expr, start);
  var j = htmx.indexOf('\n', i + expr.length);
  j = j > 0 ? j : htmx.length;
  if (j > i + expr.length * 4) {
    j = i + expr.length * 4;
  }
  return [htmx.slice(node.range[0], i) + '%c' + expr + '%c' + htmx.slice(i + expr.length, j), 'color:red;', '']
}

function parseAttributes(htmx, from, node, prototype, identifiers) {
  var idx = from, start = from, stop = from, end = htmx.length;
  var cc, attrName, attrNames;//, operator, attributes = [];
	while (idx < end) {
    cc = htmx[idx];
    if (attrName) {
      if (!WHITE_SPACE.test(cc)) {
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
            if (__ENV__ === 'development') {
              if (e.code === 1001) {
                var snapshot = getSnapshot(htmx, e.expr, node, start);
                logger.warn((e.desc || e.message) + ' In the template of component ' 
                  + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
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
        attrNames = htmx.slice(start, stop).trim().split(WHITE_SPACES);
        while(attrNames.length > 0) {
          attrName = attrNames.shift();
          if (attrName && node) {
            getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = true;
          }
        }
      }
      return stop;
    } else if (cc === '=') {
      stop = idx;
      if (start < stop) {
        attrNames = htmx.slice(start, stop).trim().split(WHITE_SPACES);
        while(attrNames.length > 1) {
          attrName = attrNames.shift();
          if (attrName && node) {
            getGroup(node, 'props')[viewEngine.toCamelCase(attrName)] = true;
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

function parseTextNode(htmx, start, stop, parent, prototype, identifiers) {
  var children = parent.children || [], result;
  var text = decodeHTML(htmx.slice(start, stop));
  text = text.replace(LF_IN_BLANK, '');
  if (FragmentBindingParser.like(text)) {
    try {
      result = FragmentBindingParser.parse(text, prototype, identifiers);
    } catch (e) {
      if (__ENV__ === 'development') {
        if (e.code === 1001) {
          var snapshot = getSnapshot(htmx, e.expr, parent, start);
          logger.warn((e.desc || e.message) + ' In the template of component ' 
                  + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
                  + snapshot[0], snapshot[1], snapshot[2]);
        }
      }
      throw e;
    }
    if (result) {
      children.push(new Expression(FragmentBinding, result));
    } else {
      children.push(text);
    }
  } else {
    children.push(text);
  }

  parent.children = children;
}

function parseHTMX(htmx, prototype) {
  htmx = htmx.trim();

  var cc, nc;
  var node, tagName;
  // var range = [0, 0];
  var start = 0, stop = 0;
  var parent, parents = [];
  var idx = 0, end = htmx.length;

  // if (htmx[0] !== '<' || htmx[end-1] !== '>' || !LETTER_REGEXP.test(htmx[1])) {
  //   throw new Error('');
  // }

  parent = {
    tag: '[]',
    children: [],
    identifiers: [CONTEXT_SYMBOL] // ['this']
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

        start = idx + 1;
        stop = getStopOf(TAGNAME_STOP, htmx, start);
        tagName = htmx.slice(start, stop);
   
        node = {};
        node.tag = tagName;
        node.__extag_node__ = true;

        if (__ENV__ === 'development') {
          node.range = [start-1, -1];
        }
        
        node.identifiers = parent.identifiers;
        

        // console.log('start tag: ' + tagName)

        if ('>' !== htmx[stop]) {
          start = stop = stop + 1;
          stop = parseAttributes(htmx, start, node, prototype, node.identifiers);
        }

        if (!node.ns) {
          if (node.props && node.props.xmlns) {
            node.ns = viewEngine.toNameSpace(node.props.xmlns);
          } else if (parent.ns) {
            node.ns = parent.ns;
          }
        }
        if (node.type == null && CAPITAL_REGEXP.test(tagName)) {
          var ctor = Path.search(tagName, prototype.constructor.resources);
          if (typeof ctor === 'function' && ctor.__extag_component_class__) {
            node.type = ctor;
          }
        }
        if (node.type == null) {
          switch (tagName) {
            case 'x:slot':
              node.type = Slot;
              break;
            case 'x:view':
              node.type = View;
              break;
            case 'x:frag':
              node.type = Fragment;
              break;
            // case 'x:block':
            //   node.type = Block;
            //   break;
          }
        }
        
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
        
        if (htmx[stop - 1] !== '/' && !isSelfClosingTag(tagName)) {
          parents.push(node);
          parent = node;
        }

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
        // console.log('end tag: ' + htmx.slice(start, stop))
        if (tagName !== parent.tag) {
          if (__ENV__ === 'development') {
            var snapshot = getSnapshot(htmx, tagName, parent, start);
            logger.warn('Unclosed tag `' + parent.tag + '`. In the template of component ' 
                  + (prototype.constructor.fullName || prototype.constructor.name) + ':\n' 
                  + snapshot[0], snapshot[1], snapshot[2]);
          }
          throwError('Unclosed tag ' + parent.tag);
        }

        if ('>' !== htmx[stop]) {
          start = stop = stop + 1;
          stop = parseAttributes(htmx, start);
        }

        // start = stop = stop + 1;

        if (parents.length > 1) {
          parents.pop();
        } else {
          if (stop < end) {
            throw new Error('');
          }
          return parents[0];
        }

        if (parents.length > 0) {
          parent = parents[parents.length - 1];
        } 

        idx = stop + 1;
        start = stop = idx;
        continue;
      } else if ('!' === nc && '<!--' === htmx.slice(idx, idx + 4)) {
        if (start < idx) {
          parseTextNode(htmx, start, idx, parent, prototype, parent.identifiers);
        }
        start = idx + 4;
        // stop = idx + 4;
        // node = parseComment(htmx, range);
        stop = htmx.indexOf('-->', start);
        stop = stop > 0 ? stop : htmx.length;
        node =  {
          tag: '!',
          comment: htmx.slice(start, stop)
        };
        parent.children = parent.children || [];
        parent.children.push(node);
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

  // if (parent) {
  //   throw new Error('Unclosed tag ' + parent.tagName);
  // }

  return parents;
}

var HTMXParser = {
  parse: function(htmx, prototype) {
    viewEngine = viewEngine || config.get(VIEW_ENGINE);

    var constructor = prototype.constructor;
    var nodes = parseHTMX(htmx, prototype);
    var children = nodes[0].children;
    var root = children[0];

    if (children.length !== 1) {
      throwError('The template of Component ' + (constructor.fullName || constructor.name) + ' must have only one root tag.')
    }
    if (root.tag === '!' || root.tag === '#') {
      throwError('Component template root tag must be a DOM element, instead of: ' + htmx.slice(0, htmx.indexOf('>')));
    }
    if (root.type) {
      if (root.tag === 'x:frag' && root.type === Fragment) {
        root.type = null;
      } else if (root.tag === 'x:slot' || root.tag === 'x:view') {
        throwError(root.tag + ' can not be used as root tag of component template: ' + htmx.slice(0, htmx.indexOf('>')));
      } else {
        throwError('component can not be used as root tag of another component template: ' + htmx.slice(0, htmx.indexOf('>')));
      }
    } else if (root.xif || root.xfor || root.xkey) {
      throwError('`x:if`, `x:for`, `x:key` can not be used on root tag of component template: '  + htmx.slice(0, htmx.indexOf('>')));
    }
    return root;
  }
};

config.HTMXParser = HTMXParser;

export default HTMXParser