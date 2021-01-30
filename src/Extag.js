/* eslint-disable no-unused-vars */
// src/Extag.js 

import Path from 'src/base/Path'
// import Parent from 'src/base/Parent'
import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
import Generator from 'src/base/Generator'
import Validator from 'src/base/Validator'
import DirtyMarker from 'src/base/DirtyMarker'

import Schedule from 'src/core/Schedule'

import Model from 'src/core/models/Model'
import Cache from 'src/core/models/Cache'

import Text from 'src/core/shells/Text'
import Slot from 'src/core/shells/Slot'
import Shell from 'src/core/shells/Shell'
import Portal from 'src/core/shells/Portal'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'
import KeepAlive from 'src/core/shells/KeepAlive'

import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import TextBinding from 'src/core/bindings/TextBinding'


import Expression from 'src/core/template/Expression'
import { createContent } from 'src/core/template/drivers/index.js'
// import JSXEngine from 'src/core/template/engines/JSXEngine'
import HTMXEngine from 'src/core/template/HTMXEngine'
import JSXParser from 'src/core/template/parsers/JSXParser'
import HTMXParser from 'src/core/template/parsers/HTMXParser'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
import EventBindingParser from 'src/core/template/parsers/EventBindingParser'
import TextBindingParser from 'src/core/template/parsers/TextBindingParser'

import config from 'src/share/config'
import { 
  slice,
  assign, 
  flatten,
  toClasses,
  defineProp, 
  defineClass, 
  encodeHTML, 
  decodeHTML } from 'src/share/functions'


if (typeof ExtagDOM !== 'undefined') {
  // eslint-disable-next-line no-undef
  config.set('view-engine', ExtagDOM);
}

var Extag = {
  anew: Generator.anew,
  inst: Generator.inst,

  node: JSXParser.node,
  expr: JSXParser.expr,

  conf: function(key, val) {
    if (arguments.length === 1) {
      return config.get(key);
    }
    config.set(key, val);
  },
  
  // functions
  defineClass: defineClass, 
  
  setImmediate: Schedule.setImmediate,

  // base
  
  Validator: Validator,
  Watcher: Watcher, 
  

  // models
  Model: Model,
  Cache: Cache,
  
  
  // shells
  Text: Text, 
  Slot: Slot,
  Portal: Portal,
  Element: Element, 
  Fragment: Fragment,
  Component: Component,
  KeepAlive: KeepAlive,

  

  // eslint-disable-next-line no-undef
  version: __VERSION__
};


if (__TEST__) {
  assign(Extag, {
    assign: assign,
    flatten: flatten,
    toClasses: toClasses,
    encodeHTML: encodeHTML,
    decodeHTML: decodeHTML,

    config: config,

    Accessor: Accessor,
    Expression: Expression,
    Generator: Generator,
    Path: Path,
    DirtyMarker: DirtyMarker,

    DataBinding: DataBinding,

    EvaluatorParser: EvaluatorParser,
    DataBindingParser: DataBindingParser,
    TextBindingParser: TextBindingParser,
    EventBindingParser: EventBindingParser
  });
}

export default Extag;