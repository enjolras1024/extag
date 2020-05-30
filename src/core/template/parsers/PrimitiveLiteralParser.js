// src/core/template/parsers/PrimaryLiteralParser.js

export default {
  /**
   * try to parse expression as boolean or number value.
   * @param {string} expr 
   */
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