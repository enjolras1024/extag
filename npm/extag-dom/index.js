'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/extag-dom.min.js');
} else {
  module.exports = require('./dist/extag-dom.js');
}
