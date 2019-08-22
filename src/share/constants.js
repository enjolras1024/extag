// src/share/constants.js 

// flags
var FLAG_NORMAL = 0;
var FLAG_CHANGED = 1;
var FLAG_CHANGED_CHILDREN = 2;
var FLAG_CHANGED_COMMANDS = 4;

var VIEW_ENGINE = 'view-engine';

// empty things
var EMPTY_FUNCTION = function() {};
var EMPTY_OBJECT = {};
var EMPTY_ARRAY = [];

// template symbols
var EVENT_SYMBOL = 'event';
// var CAPTURE_SYMBOL = '!',
var CONTEXT_SYMBOL = 'this';
var ONE_WAY_BINDING_BRACKETS = '{}';
var TWO_WAY_BINDING_BRACKETS = '[]';
var BINDING_OPERATORS = {
  DATA: '@', 
  TEXT: '#', 
  EVENT: '+', 
  MODIFIER: '::',
  CONVERTER: '|=', 
  SCOPE_EVENT: '@', 
  ASSIGN: '!',
  TWO_WAY: '@',  
  ANY_WAY: '^', 
  ONE_TIME: '?'
};

export {
  FLAG_NORMAL,
  FLAG_CHANGED,
  FLAG_CHANGED_CHILDREN,
  FLAG_CHANGED_COMMANDS,
  
  VIEW_ENGINE,

  EMPTY_ARRAY,
  EMPTY_OBJECT,
  EMPTY_FUNCTION,

  EVENT_SYMBOL,
  CONTEXT_SYMBOL,
  BINDING_OPERATORS,
  ONE_WAY_BINDING_BRACKETS,
  TWO_WAY_BINDING_BRACKETS
};