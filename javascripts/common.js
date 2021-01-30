var MenuCard = Extag.defineClass({
  extends: Extag.Component,
  statics: {
    template: ['<div class="menu-card">', 
                '<h4 click+="onClickIcon">',
                  '<a class="menu-link" href@="href">@{text}</a>',
                  '<i x:class="icon-triangle; icon-triangle-left: @{folded}; icon-triangle-down: @{!folded}"></i>', 
                '</h4>', 
                '<ul x:style="display: @{folded ? \'none\' : \'block\'};">', 
                  '<li x:for="menu of menus">', 
                    '<a x:class="menu-link; active: @{isActive(menu.href, activeId)}" href@="menu.href" target@="menu.target">@{menu.text}</a>',
                  '</li>',
                '</ul>',
              '</div>'].join('\n'),
    attributes: ['href', 'text', 'menus', 'folded', 'activeId']
  },
  isActive: function(href, activeId) {
    return activeId && href.lastIndexOf('#' + activeId) > 0;
  },
  onClickIcon: function() {
    this.folded = !this.folded;
  },
  setup: function() {
    return {
      onClickIcon: this.onClickIcon.bind(this)
    }
  }
});

var SideBar = Extag.defineClass({
  extends: Extag.Component,
  statics: {
    template: ['<aside x:class="side-bar; offscreen: @{state.offscreen}" click+="onClickSideBar">',
                '<div x:type="MenuCard" x:for="card of menuCards" ', 
                  ' activeId@="state.activeId" href@="card.href" text@="card.text" menus@="card.menus" folded@="card.folded">', 
                '</div>',
                '<a class="side-btn" x:name="button" click+="onClickButton">', 
                  "@{state.offscreen ? '>>' : '<<' }",
                '</a>',
              '</aside>'].join('\n'),
    resources: {
      MenuCard: MenuCard
    },
    attributes: ['menuCards']
  },
  setup: function() {
    this.on('mounted', this.onMounted.bind(this));
    return {
      state: new Extag.Model({
        offscreen: true,
        activeId: '' 
      }),
      onClickButton: this.onClickButton.bind(this),
      onClickSideBar: this.onClickSideBar.bind(this)
    }
  },
  onMounted: function() {
    this.links = []
    var menuCards = this.menuCards;
    var locationHref = window.location.href;
    for (var i = 0; i < menuCards.length; ++i) {
      if (locationHref.indexOf(menuCards[i].href) > 0) {
        this.links.push.apply(this.links, menuCards[i].menus);
      }
    }
    window.addEventListener('scroll', this.onScrollScreen.bind(this));
    window.addEventListener('click', this.onClickScreen.bind(this));
    var index = locationHref.lastIndexOf('#');
    if (index > 0) {
      var id = locationHref.slice(index + 1);
      if (id) {
        this.state.activeId = id;
      }
    }
  },
  onScrollScreen: function() {
    var state = this.state;
    var links = this.links;
    var i, link, activeId;
    for (i = 0; i < links.length; ++i) {
      link = links[i];
      var index = link.href.lastIndexOf('#');
      if (index < 0) {
        continue;
      }
      var id = link.href.slice(index + 1);
      var el = document.getElementById(id);
      if (!el) {
        continue;
      } 
      if (el.offsetTop - window.scrollY < window.innerHeight * 0.25) {
        activeId = id;
      }
    }
    if (activeId) {
      state.activeId = activeId;
    }
  },
  onClickButton: function() {
    this.state.offscreen = !this.state.offscreen;
    
  },
  onClickScreen: function(event) {
    if (this.state.offscreen || !this.$skin) {
      return;
    }
    var target = event.target;
    while (target) {
      if (target === this.$skin || 
          target === this.button.$skin) {
        return;
      }
      target = target.parentNode;
    }
    this.state.offscreen = true;
  },
  onClickSideBar: function(event) {
    var className = event.target.className;
    if (className && className.indexOf('menu-link') >= 0) {
      this.state.offscreen = true;
    }
  }
});

var CodeTabs = Extag.defineClass({
  extends: Extag.Component,
  statics: {
    fullname: 'CodeTabs',
    template: ['<div class="code-tabs">',
                '<div class="tab-bar" click+="onClick" x:name="tabBar">',
                  '<a x:for="entry of data |=entrySet" x:class="tab-btn; active:@{selectedIndex === entry.index};" href="javascript:void(0);">' +
                    '@{entry.value.label ?}' + 
                  '</a>',
                '</div>',
                '<div style="clear:both;"></div>',
                '<div x:for="entry of data |=entrySet" x:class="tab-box; active:@{selectedIndex === entry.index};">',
                  '<div class="code-box scroll active">',
                    '<div class="CodeMirror cm-s-alice" inner-html@="entry.value.content">',
                    '</div>',
                  '</div>',
                '</div>',
              '</div>'].join(''),
    attributes: {
      data: null,
      selectedIndex: 0
    },
    resources: {
      entrySet: function(data) {
        var entries = [];
        for (var i = 0, n = data.length; i < n; ++i) {
          entries.push({
            index: i,
            value: data[i]
          })
        }
        return entries;
      }
    }
  },
  setup: function() {
    return {
      onClick: this.onClick.bind(this)
    }
  },
  onClick: function(event) {
    var tabBtns = this.tabBar.getChildren(true);
    for (var i = 0, n = tabBtns.length; i < n; ++i) {
      if (tabBtns[i].$skin === event.target) {
        this.selectedIndex = i;
        break;
      }
    }
  }
});

(function() {
  var root = '';
  var href = window.location.href;
  if (href.indexOf('enjolras1024.github.io') >= 0 || href.indexOf('enjolras1024.gitee.io') >= 0) {
    root = '/extag';
  }
  new SideBar({
    attrs: {
      menuCards: [
        {text: 'Extag', href: root + '/', menus: [
          {text: 'GitHub', href: 'https://github.com/enjolras1024/extag', target: '_blank'},
          {text: '快速开始', href: root + '/index.html#get-started'}
          
        ]},
        {text: '事件系统', href: root + '/documents/event.html', menus: [
          {text: 'on, off, emit', href: root + '/documents/event.html#on-off-emit'}
        ]},
        {text: '组件系统', href: root + '/documents/component.html', menus: [
          {text: '组件，元素，片段，文本', href: root + '/documents/component.html#component-element-fragment-text'},
          {text: 'DOM属性和样式', href: root + '/documents/component.html#dom-props-and-style'},
          {text: '组件自定义特性', href: root + '/documents/component.html#component-attributes'},
          {text: '组件特性验证', href: root + '/documents/component.html#component-attribute-validation'},
          {text: '组件特性拦截', href: root + '/documents/component.html#component-attribute-interception'},
          {text: '组件特性依赖', href: root + '/documents/component.html#component-attribute-dependency'},
          {text: '组件内部状态', href: root + '/documents/component.html#component-inner-state'},
          // {text: '组件contents', href: root + '/documents/component.html#component-contents'},
          {text: '组件边界处理', href: root + '/documents/component.html#component-boundary'},
          {text: '组件生命周期', href: root + '/documents/component.html#component-lifecycle'}, 
          {text: '组件context', href: root + '/documents/component.html#component-context'}, 
          {text: '组件元素命令', href: root + '/documents/component.html#component-element-command'} 
        ]},
        {text: '模板语法', href: root + '/documents/template.html', menus: [
          {text: '事件监听', href: root + '/documents/template.html#event-listening'},
          {text: '数据绑定', href: root + '/documents/template.html#data-binding'},
          {text: '双向数据绑定', href: root + '/documents/template.html#two-way-data-binding'},
          {text: '文本插值绑定', href: root + '/documents/template.html#text-binding'},
          {text: 'class和style绑定', href: root + '/documents/template.html#class-and-style-binding'},
          {text: '可选转换器', href: root + '/documents/template.html#optional-converters'},
          {text: '使用子组件', href: root + '/documents/template.html#using-child-component'},
          // {text: '组件动态输出', href: root + '/documents/template.html#component-output'},
          {text: '组件slots', href: root + '/documents/template.html#component-slots'},
          {text: '部件引用', href: root + '/documents/template.html#part-reference'},
          {text: '列表渲染', href: root + '/documents/template.html#list-rendering'},
          {text: '条件渲染', href: root + '/documents/template.html#condition-rendering'},
          {text: 'Diff渲染', href: root + '/documents/template.html#diff-rendering'},
          // {text: '函数化模板', href: root + '/documents/template.html#functional-template'},
          // {text: 'camelCase v.s. kebab-case', href: root + '/documents/template.html#camelCase-vs-kebab-case'},
          {text: '标签命名空间', href: root + '/documents/template.html#tag-namespace'},
          {text: '变量标识符', href: root + '/documents/template.html#variable-identifier'}
        ]},
        {text: '数据模型', href: root + '/documents/model.html', menus: [
          {text: 'Model for Object', href: root + '/documents/model.html#model-for-object'}
        ]},
        {text: '高级指引', href: 'void(0)', menus: [
          {text: '类React组件', href: root + '/documents/react-like-component.html'},
          {text: '函数化模板', href: root + '/documents/functional-template.html'},
          {text: 'Portals', href: root + '/documents/portals.html'},
          {text: 'KeepAlive', href: root + '/documents/keep-alive.html'},
          {text: 'Shadow Mode', href: root + '/documents/shadow-mode.html'}
        ]},
        // {text: 'Tips', href: root + '/documents/tips.html', menus: [
        //   {text: '函数组件', href: root + '/documents/tips.html#functinal-component'},
        //   {text: '模板函数', href: root + '/documents/tips.html#template-function'},
        //   {text: 'Shadow模式', href: root + '/documents/tips.html#shadow-mode'}
        // ]},
        {text: '示例', href: root + '/examples', menus: [
          {text: 'Color Palette', href: root + '/examples/color-palette.html'},
          {text: 'SVG Component', href: root + '/examples/svg-component.html'},
          {text: 'TodoMVC', href: root + '/examples/todomvc.html'}
        ]}
      ]
    }
  }).attach(ExtagDOM.query('.side-bar'));
})();