var TinyEditor = Extag.defineClass({
  extends: Extag.Component,
  statics: {
    template: ExtagDom.query('.template .tiny-editor').outerHTML,
    attributes: {
      fontColor: 'black',
      height: 300,
      width: 600
    },
    resources: {
      commands: [
        {name: 'bold', icon: 'text-bold', title: 'bold'},
        {name: 'italic', icon: 'text-italic', title: 'italic'},
        {name: 'underline', icon: 'text-underline', title: 'underline'},
        {name: 'subscript', icon: 'text-subscript', title: 'subscript'},
        {name: 'superscript', icon: 'text-superscript', title: 'superscript'},
        {name: 'justifyLeft', icon: 'text-align-left', title: 'align left'},
        {name: 'justifyCenter',  icon: 'text-align-center', title: 'align center'},
        {name: 'justifyRight', icon: 'text-align-right', title: 'align right'},
        {name: 'insertOrderedList', icon: 'text-ordered-list', title: 'ordered list'},
        {name: 'insertUnorderedList', icon: 'text-bullets-list', title: 'bullets list'},
        {name: 'undo', icon: 'action-undo', title: 'undo'},
        {name: 'redo', icon: 'action-redo', title: 'redo'}
      ]
    }
  },
  setup: function() {
    this.onFontSizeChange = this.onFontSizeChange.bind(this);
    this.invalidate = this.invalidate.bind(this);
  },
  onInited: function() {
    this.body.on('paste', this.onPaste.bind(this));
    this.on('click', this.invalidate);
    this.on('keyup', this.invalidate);
    this.on('mouseup', this.invalidate);
  },
  execCmd: function(name, value) {
    document.execCommand(name, false, value);
  },
  checkCmd: function(name) {
    if (name === 'undo' || name === 'redo') {
      return document.queryCommandEnabled(name);
    }
    return document.queryCommandState(name);
  },
  getData: function getData(type) {
    var $body = this.body.$skin;
    if (type === 'html') {
      return $body.innerHTML;
    } else if (type === 'text') {
      return $body.textContent || $body.innerText;
    }
    return '';
  },
  setData: function setData(type, data) {
    if (type === 'html') {
      this.body.set('innerHTML', data);
    } else if (type === 'text') {
      this.body.set('innerHTML', filterText(data));
    }
  },
  onPaste: function(event) {
    event.preventDefault();
    if (event.clipboardData) {
      this.execCmd('insertHTML', filterText(event.clipboardData.getData('text/plain')))
    } else {
      var range,  html = filterText(window.clipboardData.getData("Text"));
      if (document.getSelection) {
        var frag = document.createDocumentFragment();
        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) {
          frag.appendChild(div.firstChild);
        }
        range = document.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(frag);
      } else if (document.selection) {
        range = document.selection.createRange();
        range.pasteHTML(html);
      }
    }
  },
  onFontSizeChange: function(event) {
    this.body.style.set('fontSize', event.target.value);
  }
});

function filterText(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[ ]/g, '&nbsp;').replace(/\n/g, '<br>');
}

var editor = Extag.Component.create(TinyEditor, {fontColor: '#666'});
editor.setData('text', 'This editor should work well in IE9~11.');
editor.attach(ExtagDom.query('#editor'));