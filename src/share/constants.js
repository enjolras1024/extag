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
var BINDING_FORMAT = '@{0}';
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

// regex
var WHITE_SPACES_REGEXP = /\s+/;
var WHITE_SPACE_REGEXP = /\s/g;
var CAPITAL_REGEXP = /^[A-Z]/;
var CONTEXT_REGEXP = /^this\./;
var HANDLER_REGEXP = /^(this\.)?[\w\$\_]+$/;
var PROP_EXPR_REGEXP = /^\s*[\$_a-zA-Z0-9]+\s*$/;


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
  BINDING_FORMAT,
  BINDING_OPERATORS,
  ONE_WAY_BINDING_BRACKETS,
  TWO_WAY_BINDING_BRACKETS,

  WHITE_SPACES_REGEXP,
  WHITE_SPACE_REGEXP,
  PROP_EXPR_REGEXP,
  CAPITAL_REGEXP,
  CONTEXT_REGEXP,
  HANDLER_REGEXP
};