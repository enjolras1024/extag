(function() {
  var Component = Extag.Component;

  var ChannelEditor = Extag.defineClass({
    extends: Component,

    statics: {
      attributes: ['label', 'value'],
      template: ExtagDOM.query('#channel-editor-template').innerHTML
    },

    setup: function() {
      this.onChange = this.onChange.bind(this);
      this.onSlide = this.onSlide.bind(this);
    },

    onChange: function(event) {
      var value = event.target.value;
      if (!isNaN(value)) {
        this.value = Number(value);
      }
    },

    onSlide: function(event) {
      this.value = Number(event.target.value);
    }
  });

  function clip(value) {
    value = Math.floor(Number(value));
    return value < 0 ? 0 : (value > 255 ? 255 : value);
  }

  function dec2hex(n) {
    var s = Math.floor(Number(n)).toString(16);
    return  s.length > 1 ? s : '0' + s;
  }

  function hex2dec(s) {
    return Number('0x' + s);
  }


  var Palette = Extag.defineClass({
    extends: Component,

    statics: {
      template: ExtagDOM.query('#palette-template').innerHTML,

      resources: {
        ChannelEditor: ChannelEditor
      },

      attributes: {
        red: {
          value: 0,
          set: function(value, props) {
            props.red = clip(value);
          }
        },
        blue: {
          value: 0,
          set: function(value, props) {
            props.blue = clip(value);
          }
        },
        green: {
          value: 0,
          set: function(value, props) {
            props.green = clip(value);
          }
        },
        color: {
          get: function() {
            return '#' + dec2hex(this.red) + dec2hex(this.green) + dec2hex(this.blue);
          },
          set: function(value) {
            if (/^s*#[0-9a-fA-F]{6}s*$/.test(value)) {
              this.red = hex2dec(value.slice(1, 3));
              this.green = hex2dec(value.slice(3, 5));
              this.blue = hex2dec(value.slice(5, 7));
            }
          }
        },
        isInvalid: false
      }
    },

    setup: function() {
      this.onChange = this.onChange.bind(this);
    },

    onChange: function(event) {
      this.color = event.target.value.trim();
    }
  });

  Component.create(Palette).attach(ExtagDOM.query('#palette'));
})();