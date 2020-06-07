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
import Output from 'src/core/shells/Output'
import Element from 'src/core/shells/Element'
import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'

import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import TextBinding from 'src/core/bindings/TextBinding'

import Evaluator from 'src/core/template/Evaluator'
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
  copy, 
  help,
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

// export {
//   help,
//   defineClass,

//   Validator,
//   Watcher, 

//   Cache,
//   Model, 

//   Slot,
//   Text,
//   Element,
//   Fragment,
//   Component
// }

export default {
  anew: Generator.anew,
  inst: Generator.inst,
  // make: HTMXEngine.makeContent,

  conf: function(key, val) {
    if (arguments.length === 1) {
      return config.get(key);
    }
    config.set(key, val);
  },
  //@test config: config,

  // functions
  help: help,
  //@test assign: assign, 
  //@test defineProp: defineProp, 
  defineClass: defineClass, 
  //@test slice: slice,
  //@test flatten: flatten,
  //@test toClasses: toClasses,
  //@test encodeHTML: encodeHTML,
  //@test decodeHTML: decodeHTML,
  setImmediate: Schedule.setImmediate,

  // base
  //@test Accessor: Accessor,
  //@test Expression: Expression,
  //@test Generator: Generator,
  //@test Parent: Parent,
  //@test Path: Path,
  //@test Schedule: Schedule,
  //@test DirtyMarker: DirtyMarker,
  Validator: Validator,
  Watcher: Watcher, 
  

  // models
  Model: Model,
  //@test Cache: Cache,
  
  // shells
  //@test Shell: Shell,
  //@test
  Text: Text, 
  Slot: Slot,
  Output: Output,
  Element: Element, 
  Fragment: Fragment,
  Component: Component,

  // bindings
  //@test Binding: Binding,
  //@test DataBinding: DataBinding,
  //@test EventBinding: EventBinding,

  // parsers
  //@test HTMXParser: HTMXParser,
  //@test EvaluatorParser: EvaluatorParser,
  //@test DataBindingParser: DataBindingParser,
  //@test EventBindingParser: EventBindingParser,

  // template
  
  //@test Evaluator: Evaluator,

  // JSXEngine: JSXEngine,
  //@test HTMXEngine: HTMXEngine,
  node: JSXParser.node,
  expr: JSXParser.expr,

  // eslint-disable-next-line no-undef
  version: __VERSION__
}