## Extag
Extag是一个基于组件和事件驱动的JavaScript MVVM库，用于构建Web用户界面。Extag提供了一个由文本、元素、片段和组件构成的Shell层。其中，组件支持模板、数据绑定等，具有良好的可扩展性，能够更好地组织用户界面，管理数据状态。通过监听和派发自定义属性更改事件，内嵌在组件模板中的数据绑定表达式得以生效，从而能够动态地改变Shell层的内容。Shell层一旦发生变化，Extag就会通过ExtagDOM以异步批量的模式，将变化的部分渲染到真实的DOM层。

#### 快速开始
使用script标签简单地引入Extag和ExtagDOM。
```html
<div id="hello"></div>
<script src="https://unpkg.com/extag@0.4.1/dist/extag.js"></script>
<script src="https://unpkg.com/extag-dom@0.4.1/dist/extag-dom.js"></script>
```
或通过npm安装后引入Extag和ExtagDOM。
```javascript
import Extag from 'extag'
import ExtagDOM from 'extag-dom'
Extag.conf('view-engine', ExtagDOM);
```

一个简单的Extag例子如下：
```javascript
// 定义一个组件子类
class Hello extends Extag.Component {
  static get template() {
    return  `<div class="hello">
                <h1>Hello, @{ name }!</h1> 
            </div>`;
  }
  static get attributes() {
    return ['name'];
  }
}
// 创建一个组件实例
const hello = new Hello({name: 'World'});
// 附着到一个元素上
hello.attach(ExtagDOM.query('#hello')); // hello.attach(document.getElementById('hello'));
```
我们定义了一个Hello类，继承自Component。组件模板中使用了一个单向的数据绑定表达式 ```@{ name }```。包裹在 ```@{ }``` 内的自定义的特性 ```name``` 是可绑定的，其默认值为 ```'World'```。创建一个Hello类的实例，附着到页面上的一个元素上，```'Hello, World!'``` 的字样就会渲染到页面上。
#### 数据绑定 & 事件监听
我们在标签上使用 ```@=``` 绑定属性和表达式，使用 ```+=``` 连接事件和处理函数：
```javascript
class Hello extends Extag.Component {
  static get template() {
    return  `<div class="hello">
                <h1>Hello, @{ state.name }!</h1>
                <input value@="state.name" input+="onInput">
            </div>`;
  }
  setup() {
    return {
      state: new Extag.Model({
        name: 'World'
      }),
      onInput: this.onInput.bind(this)
    }
  }
  onInput(event) {
    this.state.name = event.target.value;
  }
}
```
特别地，对于 ```class``` 和 ```style``` 的绑定，还可以是：
```html
<a x:class="btn btn-next; disabled: @{page >= total};"
   x:style="margin: 5px; color: @{color}; font-size: @{fontSize}px;">
  下一页
</a>  
```
#### if条件 & for循环
```html
<ul x:if="items != null">
  <li x:for="item of items">
    <span>@{ item.text }<span>
  </li>
</ul>
```

更多内容，请参阅[文档](https://enjolras1024.github.io/extag/)。