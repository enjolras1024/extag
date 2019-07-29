// src/core/template/parsers/PrimaryLiteralParser.js

export default {
  tryParse: function tryParse(expr) {
    if (expr === 'false') {
      return false;
    }
    if (expr === 'true') {
      return true;
    }
    if (!isNaN(expr)) {
      return Number(expr);
    }
  }
}