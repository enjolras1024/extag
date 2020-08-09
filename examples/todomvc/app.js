(function() {
  var Model = Extag.Model;
  var Component = Extag.Component;

  var uid = 0;

  var STATUS = {
    ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed'
  };

  function filter(todos, status) {
    return todos.filter(function(todo) {
      return status === STATUS.ALL || (status === STATUS.COMPLETED ? todo.completed : !todo.completed);
    });
  }

  var ENJ = {
    read: function() {
      var item = localStorage.getItem('todos');

      if (item) {
        return JSON.parse(item);
      }
    },
    save: function(todos) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  };

  ENJ.TodoItem = Extag.defineClass({
    extends: Component,

    statics: {
      fullname: 'TodoItem',
      template: ExtagDOM.query('#todo-item-template').innerHTML,
      attributes: {
        completed: false,
        label: ''
      }
    },

    setup: function() {
      return {
        onToggle: this.onToggle.bind(this),
        onChange: this.onChange.bind(this),
        onKeyup: this.onKeyup.bind(this),
        state: new Model({
          editing: false,
          text: ''
        })
      }
    },

    onToggle: function(event) {
      this.completed = event.target.checked;
    },

    onChange: function(event) {
      this.state.text = event.target.value.trim();
    },

    onKeyup: function(event) {
      switch(event.key.toLowerCase()) {
        case 'escape':
          this.cancelEditing();
          break;
        case 'enter':
          this.doneEditing();
          break;
      }
    },

    startEditing: function() {
      this.state.text = this.label;
      this.state.editing = true;
      this.editor.cmd('focus');
    },

    doneEditing: function() {
      if (this.state.editing) {
        this.submit(this.state.text);
      }

      this.cancelEditing();
    },

    cancelEditing: function() {
      this.state.editing = false;
    },

    submit: function(text) {
      if (text) {
        this.label = text;
      } else {
        this.destroy();
      }
    },

    destroy: function() {
      this.emit('destroy');
    }
  });

  ENJ.TodoApp = Extag.defineClass({
    extends: Component,

    statics: {
      fullname: 'TodoApp',
      resources: {
        filter: filter,
        display: function(visible) {
          return visible ? '' : 'none';
        },
        pluralize: function(num, str) {
          return str + (num !== 1 ? 's' : '');
        },
        TodoItem: ENJ.TodoItem
      },

      template: ExtagDOM.query('#todoapp-template').innerHTML
    },

    setup: function() {
      this.on('created', this.onCreated.bind(this));
      var state = new Model({
        todos: [],
        status: STATUS.ALL,
        newTodo: '',
        get allDone() {
          return this.remainingCount === 0;
        },
        set allDone(value) {
          this.todos.forEach(function(todo) {
            todo.completed = value;
          });
        },
        get remainingCount() {
          return this.todos.length - filter(this.todos, STATUS.COMPLETED).length;
        }
      });
      return {
        state: state,
        onSave: this.onSave.bind(this),
        onToggle: this.onToggle.bind(this),
        onKeyup: this.onKeyup.bind(this),
        onKeydown: this.onKeydown.bind(this)
      }
    },

    onCreated: function() {
      var state = this.state;
      var records = ENJ.read();
      if (records) {
        for (var i = 0, n = records.length; i < n; ++i) {
          this.addTodo(records[i]);
        }
      }
      state.on('changed', (function(key) {
        if (key === 'todos') {
          this.onSave()
        }
      }).bind(this));

      function onHashChange () {
        var hash = window.location.hash;
        var status = STATUS[hash.replace(/#\/?/, '').toUpperCase()];
        state.status = status || STATUS.ALL;
      }
    
      onHashChange();
    
      window.onhashchange = onHashChange;
    },

    addTodo: function(todo) {
      todo = new Model(todo);
      todo.id = ++uid;
      this.state.todos.push(todo);
      todo.on('changed', this.onSave);
      this.state.todos = this.state.todos.slice(0);
    },

    removeTodo: function(todo) {
      var todos = this.state.todos;
      var index = todos.indexOf(todo);
      if (index < 0) { return; }
      todos.splice(index, 1);
      todo.off('changed', this.onSave);
      this.state.todos = todos.slice(0);
      todo.off();
    },

    clearCompleted: function() {
      this.state.todos = filter(this.state.todos, STATUS.ACTIVE);
    },

    onToggle: function(event) {
      this.state.allDone = event.target.checked;
    },

    onKeyup: function(event) {
      if (event.key.toLowerCase() === 'enter') { return; }
      this.state.newTodo = event.target.value.trim();
    },

    onKeydown: function(event) {
      if (event.key.toLowerCase() !== 'enter') { return; }
      if (this.state.newTodo) {
        this.addTodo({
          label: this.state.newTodo,
          completed: false
        });
      }
      this.state.newTodo = '';
    },

    onSave: function() {
      ENJ.save(this.state.todos.slice(0));
    }
  });

  var app = new ENJ.TodoApp();
  app.attach(ExtagDOM.query('#todoapp'));
})();