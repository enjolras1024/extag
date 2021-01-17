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
      template: ExtagDOM.query('#slider-template').innerHTML
    },
    
    onMouseChange: function(event) {
      switch (event.type) {
        case 'mousemove':
        case 'touchmove':  
          if (this.pressed) {
            var clientX = event.touches ? event.touches[0].clientX : event.clientX;
            var cx = clientX - ExtagDOM.invoke(this.$skin, 'getBoundingClientRect').left;
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
      this.on('changed', (function() {
        var value = this.value;
        value = value < this.min ? this.min : value;
        value = value > this.max ? this.max : value;
        this.value = value;
      }).bind(this));
      this.on('mounted', this.onMounted.bind(this));
      this.onMouseChange = this.onMouseChange.bind(this);
    },
    
    onMounted: function() {
      var body = document.body;
      body.addEventListener('mousemove', this.onMouseChange);
      body.addEventListener('mouseup', this.onMouseChange);
      body.addEventListener('touchend', this.onMouseChange);
      body.addEventListener('touchmove', this.onMouseChange);
    },

    normalize: function(value) {
      return (value - this.min) / (this.max - this.min) * 150;
    }
  });

  var TextSlider = Extag.defineClass({
    extends: Component,
    
    statics: {
      template: ExtagDOM.query('#text-slider-template').innerHTML,
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
      template: ExtagDOM.query('#app-template').innerHTML,
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

  new App().attach(ExtagDOM.query('#app'));
})();