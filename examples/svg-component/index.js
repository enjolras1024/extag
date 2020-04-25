(function() {
  var Component = Extag.Component;

  var Slider = Extag.defineClass({
    extends: Component,
    
    statics: {
      attributes: {
        min: 0,
        max: 10,
        value: 0
      },
      template: ExtagDom.query('.template .slider').outerHTML
    },
    
    onMouseChange: function(event) {
      switch (event.type) {
        case 'mousemove':
        case 'touchmove':  
          if (this.pressed) {
            var clientX = event.touches ? event.touches[0].clientX : event.clientX;
            var cx = clientX - ExtagDom.call(this.getSkin(), 'getBoundingClientRect').left;
            cx = cx < 0 ? 0 : cx;
            cx = cx > 150 ? 150 : cx;
            this.value = (cx / 150 * (this.max - this.min) + this.min).toFixed(1);
          }
          break;
        case 'mousedown':
        case 'touchstart':
          this.pressed = true;
          break;
        case 'mouseup':
        case 'touchend':
          this.pressed = false;
          break;        
      }
    },

    setup: function() {
      this.normalize = this.normalize.bind(this);
      this.onMouseChange = this.onMouseChange.bind(this);
    },
    
    onInited: function() {
      var body = document.body;
      body.addEventListener('mousemove', this.onMouseChange);
      body.addEventListener('mouseup', this.onMouseChange);
      body.addEventListener('touchend', this.onMouseChange);
      body.addEventListener('touchmove', this.onMouseChange);

      this.on('changed', (function() {
      var value = this.value;
        value = value < this.min ? this.min : value;
        value = value > this.max ? this.max : value;
        this.value = value;
      }).bind(this));
    },

    normalize: function(value) {
      return (value - this.min) / (this.max - this.min) * 150;
    }
  });

  var TextSlider = Extag.defineClass({
    extends: Component,
    
    statics: {
      template: ExtagDom.query('.template .text-slider').outerHTML,
      resources: {
        Slider: Slider
      },
      attributes: {
        min: 0,
        max: 10,
        value: 0,
        label: ''
      }
    }
  });

  var App = Extag.defineClass({
    extends: Component,
    
    statics: {
      template: ExtagDom.query('.template .app').outerHTML,
      resources: {
        TextSlider: TextSlider
      },
      attributes: {
        rotate: 0,
        scaleX: 1.0,
        scaleY: 1.0
      }
    }
  });

  Component.create(App).attach(ExtagDom.query('#app'));
})();