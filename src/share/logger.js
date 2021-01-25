// src/share/logger.js 

import { slice } from 'src/share/functions'

function log(fn, args, prefix) {
  args = slice.call(args, 0);
  args.unshift(prefix);
  fn.apply(console, args);
}

export default {
  info: function info() {
    log(console.log, arguments, '[EXTAG INFO]');
  },
  warn: function warn() {
    log(console.warn, arguments, '[EXTAG WARN]');
  },
  error: function error() {
    log(console.error, arguments, '[EXTAG ERROR]');
  },
  debug: function debug() {
    log(console.log, arguments, '[EXTAG DEBUG]');
  }
}