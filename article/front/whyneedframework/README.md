# 为什么我们还要使用前端框架来构建页面？
今天一个同事说现在前端一定要使用前端框架，现在复杂应用不用就写不下去。我说我们很多场景下未必就一定需要前端框架，很多时候没有框架反而会更好。并且我相信随着Web规范的一步一步完善，去框架化的时代或许不久就会到来。

我列举了几个使用前端框架的坏处：
* 给每个页面无端带上了多余的上百K的请求负担
* 过于依赖框架，让我们成为框架工程师
* 对理解底层JS实现增加障碍
* 框架对代码进行编译和封装，让我们在棘手问题的调试更加困难

同时列举无框架化该如何实现组件的封装，路由跳转，双向数据绑定，列表渲染！

`注意：本文基于chrome66以上版本！！！`

本文例子代码地址:[点此打开本文example代码](https://github.com/zy445566/myBlog/tree/master/20191023front/20191023whyneedframework/example)

# 构造一个具有封装性的组件
首先我们需要增加一个index.html,里面添加一个自定义标签app-container，作为我们的app容器，同时引用一个模块化的js文件用type="module"来区分，如下：
```html
<!DOCTYPE HTML>
<html>
    <head>
        <title>show time</title>
    </head>
<body>
    <app-container />
    <script type="module" src="/app.js"></script>
</body>
</html>
```
接下来我们来完成app.js，首先我们需要创建一个模版,其中包含了自定义路由标签，但不需要管，后面会说到路由的实现。
```js
const template = document.createElement('template');
        template.innerHTML = `
        <style>
            .container > h1 {
                width:120px;
                border: solid;
                cursor: pointer;
            }
        </style>
        <div class="container">
            <h1>Click Me!</h1>
            <my-router>
                <my-browse-route path="/data-bind" tag="data-bind"></my-browse-route>
                <my-browse-route path="/add-list" tag="add-list"></my-browse-route>
            </my-router>
        </div>`;
```
然后把创建的模版来生成一个关闭的封装模式的web组件，同时使用customElements.define来注册自定义的web组件，到这里app-container标签就成功生成为一个web组件完成封装。 如下是app.js的代码：
```js
// 省略一些代码
class AppContainer extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = `...模版代码，这里省略`;//就是上面的代码，省略
        const content = template.content.cloneNode(true);
        // 这里是设定封装模式，可以设置是否能受到外界因素影响
        const shadow = this.attachShadow( { mode: 'closed' } );
        // 省略一些代码...
        shadow.appendChild(content);
    }
  }
window.customElements.define('app-container', AppContainer);
```

# 一个路由跳转组件的实现
如app.js所示的路由标签如下所示，那么我们需要做两个组件分别是my-router和my-browse-route。
```html
<my-router>
    <my-browse-route path="/data-bind" tag="data-bind"></my-browse-route>
    <my-browse-route path="/add-list" tag="add-list"></my-browse-route>
</my-router>
```
那么我们第一个路由组件my-router只需要一个空壳来包装路由文件的内容，而my-browse-route则需要根据目前的路由来显示内容。

那么一个空壳组件my-router其实只需要，如下实现：
```js
export default class MyRouter extends HTMLElement {
    constructor() {
        super();
    }
}
```
当然组件my-browse-route也只需要寥寥代码即可实现：
```js
export default class MyBrowseRoute extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        // 获取path属性来决定当前路由是否渲染内容
        this.path = this.getAttribute('path');
        // 获取tag属性来决定显示那个组件
        this.tag = this.getAttribute('tag');
        template.innerHTML = this.getHtml()
        const content = template.content.cloneNode(true);
        const shadow = this.attachShadow( { mode: 'closed' } );
        shadow.appendChild(content);
    }
    getHtml() {
        // 这里是如果当前路由不等于设置路由则直接返回空html来渲染
        if(window.location.pathname!=this.path) {return ''};
        return `<${this.tag}/>`
    }
  }
```

# 实现双向绑定的例子
其实双向绑定实现的方式有很多，我使用了一个代码量较少的方式来实现，即一开始就劫持数据，并在数据变化的时候，重新渲染模版如下：
```js
export default class DataBind extends HTMLElement {
    constructor() {
        this.data = this.dataBind({
            inputVal:'hello'
        }); 
        // 省略若干代码...
    }
    dataBind(data) {
        // 这里进行数据劫持
        return new Proxy(data, {
            set:  (target, key, receiver) => {
                Reflect.set(target, key, receiver)
                // 这里进行重新渲染模版
                this.shadow.innerHTML = this.getHtml();
                return Reflect.set(target, key, receiver);
        }})
    }
    getHtml() {
        // 这里获取数据的最新模版
        return `
        <di>
            <input type="text" value="${this.data.inputVal}"/>
            <h4>${this.data.inputVal}</h4>
        </div>`;
    }
  }
```
# 列表渲染的实现
列表渲染更是简单，只需要利用一下模版字符串的一些小技巧既可以实现列表渲染，如下。
```js
export default class AddList extends HTMLElement {
    constructor() {
        // 这里设置默认值
        this.data = {
            inputVal:'hello',
            list:[]
        }
        //  省略一些代码... 
        const content = template.content.cloneNode(true);
        const myUl = content.querySelector('ul');
        // 这里根据按钮点击重新渲染列表
        myBtn.addEventListener('click',()=>{
            if(myInput.value) {
                this.data.list.push(myInput.value);
                myUl.innerHTML = this.getLi()
            }
        })
        //  省略一些代码... 
    }
    // 这里就是遍历list数据来重新渲染列表模版
    getLi() {
        return `${this.data.list.map((val)=>{
                return `<li>${val}</li>`
            }).join('')}`
    }
  }
```
如果想要集成数据绑定和模版渲染写个基类，然后上层都继承基类即可。

# 总结
不使用前端框架而使用web组件来替代的好处就是简单的页面基本都是几十B(是B不是KB)就搞定，在渲染的时候自己可控性也强导致性能可以优化的更猛，更原生的体验，不需要热加载，刷新即可见。debugger都是原生代码而不是框架处理后的代码，摆脱框架束缚。自己搭框架也不过是百行，同时随着方法即服务流行扩大，这种无框架架构将会受到更大的支持。

`注意：本文基于chrome66以上版本！！！`

本文例子代码地址:[点此打开本文example代码](https://github.com/zy445566/myBlog/tree/master/20191023front/20191023whyneedframework/example)