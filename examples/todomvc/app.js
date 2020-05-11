(function() {
  var Store = Extag.Store;
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
      fullName: 'TodoItem',
      template: ExtagDom.query('#todo-item-template').innerHTML,
      attributes: {
        completed: false,
        editing: false,
        label: '',
        text: ''
      }
    },

    setup: function() {
      this.onToggle = this.onToggle.bind(this);
      this.onChange = this.onChange.bind(this);
    },

    onToggle: function(event) {
      this.completed = event.target.checked;
    },

    onChange: function(event) {
      this.text = event.target.value.trim();
    },

    startEditing: function() {
      this.text = this.label;
      this.editing = true;
      this.editor.cmd('focus');
    },

    doneEditing: function(event) {
      if (this.editing) {
        this.submit(this.text);
      }

      this.cancelEditing();
    },

    cancelEditing: function(event) {
      this.editing = false;
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
      fullName: 'TodoApp',
      attributes: {
        todos: Extag.anew(Array),
        status: STATUS.ALL,
        newTodo: '',
        remainingCount: {
          get: function() {
            return this.todos.length - filter(this.todos, STATUS.COMPLETED).length;
          }
        },
        allDone: {
          get: function() {
            return this.remainingCount === 0;
          },
          set: function(value) {
            this.todos.forEach(function(todo) {
              todo.completed = value;
            });
          }
        }
      },

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

      template: ExtagDom.query('#todoapp-template').innerHTML
    },

    setup: function() {
      this.onSave = this.onSave.bind(this);
      this.onEnter = this.onEnter.bind(this);
      this.onToggle = this.onToggle.bind(this);
      this.onChange = this.onChange.bind(this);
      this.on('created', this.onCreated.bind(this));
    },

    onCreated: function() {
      var records = ENJ.read();
      if (records) {
        for (var i = 0, n = records.length; i < n; ++i) {
          this.addTodo(Store.create(records[i]));
        }
      }
      this.on('changed.todos', this.onSave);
    },

    addTodo: function(todo) {
      todo.id = ++uid;
      this.todos.push(todo);
      this.emit('changed.todos');
      todo.on('changed', this.onSave);
      // this.invalidate();
    },

    removeTodo: function(todo) {
      var index = this.todos.indexOf(todo);
      if (index < 0) { return; }
      this.todos.splice(index, 1);
      this.emit('changed.todos')
      // this.invalidate();
      todo.off();
    },

    clearCompleted: function() {
      this.todos = filter(this.todos, STATUS.ACTIVE);
    },

    onToggle: function(event) {
      this.allDone = event.target.checked;
    },

    onChange: function(event) {
      this.newTodo = event.target.value.trim();
    },

    onEnter: function(event) {
      if (this.newTodo) {
        this.addTodo(Store.create({
          label: this.newTodo,
          completed: false
        }));
      }
      this.newTodo = '';
    },

    onSave: function() {
      ENJ.save(this.todos.slice(0));
    }
  });

  var app = Component.create(ENJ.TodoApp);

  function onHashChange () {
    var hash = window.location.hash;
    var status = STATUS[hash.replace(/#\/?/, '').toUpperCase()];
    app.status = status || STATUS.ALL;
  }

  onHashChange();

  window.onhashchange = onHashChange;

  app.attach(ExtagDom.query('#todoapp'));
})();