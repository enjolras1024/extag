### ExtagDOM
Extag操作DOM的默认视图引擎。

#### 快速开始
使用script标签简单地引入Extag和ExtagDOM。
```html
<script src="https://unpkg.com/extag/dist/extag.js"></script>
<script src="https://unpkg.com/extag-dom/dist/extag-dom.js"></script>
```
或通过npm安装后引入Extag和ExtagDOM。
```javascript
import Extag from 'extag'
import ExtagDOM from 'extag-dom'
Extag.conf('view-engine', ExtagDOM);
```