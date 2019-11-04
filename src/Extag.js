// src/Extag.js 

// import SkinUtil from 'src/utils/SkinUtil'
// import PathUtil from 'src/utils/PathUtil'
// import StringUtil from 'src/utils/StringUtil'
// import LiteralUtil from 'src/utils/LiteralUtil'

// import Event from './base/Event'
// import RES from 'src/base/RES'
import Path from 'src/base/Path'
import Parent from 'src/base/Parent'
import Watcher from 'src/base/Watcher'
import Accessor from 'src/base/Accessor'
// import Schedule from 'src/base/Schedule'
import Generator from 'src/base/Generator'
import Validator from 'src/base/Validator'
import DirtyMarker from 'src/base/DirtyMarker'

import Schedule from 'src/core/Schedule'

// import List from 'src/core/models/List'
// import State from 'src/core/models/State'
import Store from 'src/core/models/Store'
import Cache from 'src/core/models/Cache'
// import Collection from 'src/core/models/Collection'

import Text from 'src/core/shells/Text'
import Slot from 'src/core/shells/Slot'
import Shell from 'src/core/shells/Shell'
import Element from 'src/core/shells/Element'
// import Fragment from 'src/core/shells/Fragment'
import Component from 'src/core/shells/Component'

import Binding from 'src/core/bindings/Binding'
import DataBinding from 'src/core/bindings/DataBinding'
// import TextBinding from 'src/core/bindings/TextBinding'
import EventBinding from 'src/core/bindings/EventBinding'
import FragmentBinding from 'src/core/bindings/FragmentBinding'

import Evaluator from 'src/core/template/Evaluator'
import Expression from 'src/core/template/Expression'
import JSXEngine from 'src/core/template/JSXEngine.4'
import HTMXEngine from 'src/core/template/HTMXEngine'
import JSXParser from 'src/core/template/parsers/JSXParser'
// import HTMXTemplate from 'src/core/template/HTMXTemplate'
// import HTMLParser from 'src/core/template/parsers/HTMLParser'
import HTMXParser from 'src/core/template/parsers/HTMXParser'
import EvaluatorParser from 'src/core/template/parsers/EvaluatorParser'
import DataBindingParser from 'src/core/template/parsers/DataBindingParser'
// import TextBindingParser from 'src/core/template/parsers/TextBindingParser'
import EventBindingParser from 'src/core/template/parsers/EventBindingParser'
import FragmentBindingParser from 'src/core/template/parsers/FragmentBindingParser'

import config from 'src/share/config'
import { 
  copy, 
  slice, 
  defineProp, 
  defineClass, 
  setImmediate, 
  encodeHTML, 
  decodeHTML } from 'src/share/functions'


if (typeof window !== 'undefined' && window.ExtagDom) {
  config.set('view-engine', ExtagDom);
}

// RES.register('XSlot', Slot);

export default {
  anew: Generator.anew,
  inst: Generator.inst,

  conf: function(key, val) {
    if (arguments.length === 1) {
      return config.get(key);
    }
    config.set(key, val);
  },
  //#test config: config,

  // functions
  // help: help, 
  //#test defineProp: defineProp, 
  defineClass: defineClass, 
  //#test setImmediate: setImmediate,
  //#test slice: slice,
  //#test encodeHTML: encodeHTML,
  //#test decodeHTML: decodeHTML,

  // base
  //#test Accessor: Accessor,
  //#test DirtyMarker: DirtyMarker,
  //#test Evaluator: Evaluator,
  //#test Expression: Expression,
  //#test Generator: Generator,
  //#test Parent: Parent,
  //#test Path: Path,
  // RES: RES,
  //#test Schedule: Schedule,
  Validator: Validator,
  Watcher: Watcher, 
  

  // models
  // List: List,
  Store: Store,
  Cache: Cache,
  // Collection: Collection, 
  
  // shells
  //#test Shell: Shell,
  //#test
  Slot: Slot,
  Text: Text, 
  Element: Element, 
  // Fragment: Fragment,
  Component: Component,

  // bindings
  //#test Binding: Binding,
  //#test DataBinding: DataBinding,
  //#test TextBinding: TextBinding,
  //#test EventBinding: EventBinding,

  // parsers
  //#test HTMLParser: HTMLParser,
  //#test HTMXParser: HTMXParser,
  //#test EvaluatorParser: EvaluatorParser,
  //#test DataBindingParser: DataBindingParser,
  //#test TextBindingParser: TextBindingParser,
  //#test EventBindingParser: EventBindingParser,

  // JSXEngine: JSXEngine,
  //#test HTMXEngine: HTMXEngine,
  node: JSXParser.node,
  expr: JSXParser.expr,
  // slot: JSXEngine.slot,
  // reflow: JSXEngine.reflow,

  copy: copy,

  // attach: function(shell, $skin, sync) {
  //   shell.attach($skin);
  //   if (sync) {
  //     Schedule.flushQueues();
  //   }
  // },
  
  version: __VERSION__
}