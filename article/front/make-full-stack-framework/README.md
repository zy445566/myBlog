# 全栈(gan)工程师第一步:搭建一个全栈(gan)框架
作为一个全栈(gan)工程师是不是很苦恼，在一个全栈(gan)项目中被主流前后端项目所迫害所以只能多仓库开发，甚至于启动前端一个命令，启动后端一个命令。

现在发挥node.js全栈(gan)优势的机会来了，拒绝两个仓库，拒绝两个命令，转战真全栈(gan)模式！

# 0x01:将前后端和中间层合并到一个仓库
合并完目录如下:(当前demo代码:[full-stack-demo地址](https://github.com/zy445566/myBlog/tree/master/20190824fullstack/20190824make-full-stack-framework/full-stack-demo))
```sh
full-stack-demo
├── app
│   ├── back # 这里是后端文件夹
│   │   ├── router.js # 后端路由配置
│   │   ├── src
│   │   │   └── controller # 由于这是教程所以只保留了控制器
│   │   │       └── HelloController.js
│   │   └── static.js # 后端静态文件配置
│   ├── config.js
│   ├── front # 前端文件夹
│   │   ├── run.js # 运行前端的node文件
│   │   ├── src
│   │   │   └── index.jsx # 由于这是教程所以只保留了前端路口文件
│   │   ├── static # 静态文件文件夹
│   │   │   ├── index.html # 前端首页
│   │   │   └── webpack.bundle.js # webpack生成的js文件
│   │   └── webpack.config.js  # webpack配置文件
│   └── middleware # 中间件文件夹
│       ├── application-type.js # 返回头的类型
│       ├── router.js # 路由中间件
│       └── static.js # 静态文件中间件
├── main.js # 项目入口文件
├── Dockerfile # docker容器文件
└── package.json
```
也就是说我们用类似于monorepo的模式将前后端都作为了当前app的子项目文件。我们用入口文件main.js启动整个项目。在简单提一下在dev模式关于热更新，我们使用nodemon来实现后端热更，而前端热更则使用wepack的watch来实现。为了防止前后端热更冲突，我们可以使用package.json来配置nodemon忽略前端目录实现。
```json
"nodemonConfig": {
    "ignore": [
      "app/front/*"
    ]
  }
```

#  0x02:启动和入口文件
在我们开发模式中，我们常常使用nodemon来启动服务
```sh
npx nodemon main.js
```
通过执行main.js达到执行前后端的效果

main.js文件如下：
```js
const Koa = require('koa');
const path = require('path');
// app的配置文件
const config = require('./app/config');
// 路由中间件
const router = require('./app/middleware/router');
// 静态文件中间件
const static = require('./app/middleware/static');

//实例化koa 
const app = new Koa();
// 这里相当于后端做静态文件服务而不使用webpack-dev-server
app.use(static(require('./app/back/static')));
// 使后端路由配置生效
app.use(router(require('./app/back/router')));
// 读取app配置绑定ip并监听端口
app.listen(config.port, config.hostname);

// 前端以子进程的方式启动，配置好启动路径
require('child_process').fork('run.js',process.argv,{cwd:path.join(__dirname,'app','front')});
```
这里相当于启动后端服务后，再用子进程来启动前端服务。那么我们来谈谈前端的启动。

# 0x03:前端的启动
前端则是使用webpack的api模式来启动，而非是传统的CLI的方法来启动项目，通过区分启动参数来进行启动模式的判定，比如在dev模式中则使用watch的方式，来查看变更，而在正式环境只通过run来编译一次生成静态文件。
```js
const config = require('../config');
const webpack = require('webpack');
// 这里直接引用webpack.config.js而不是通过CLI来读取
const compiler = webpack(require('./webpack.config.js'));
// 这里判断参数是否只编译一次还是走dev的watch方式
let compilerOnce = false
for(let arg of process.argv) {
    if(arg=='--stable') {
        compilerOnce = true;
    }
}

// 运行webpack的回调
function runBack(err, stats) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stats.toString({
    errors: true,
    warnings: true,
    modules: false,
    chunks: false,
    colors: true
    }));
    console.log(`link: http://${config.hostname}:${config.port}/`);
}

// 判断是只编译一次还是热更
if(compilerOnce) {
    compiler.run(runBack)
} else {
    /**
     * 这里和webpack-dev-server不一样
     * webpack-dev-server默认watch到内存中
     * 而这种方式则会真正生成文件
     */
    compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
    },runBack);
}
```

值得一提的是后端如何和webpack联动而不用webpack-dev-server实现前端静态化。首先我们看一下webpack.config.js文件:
```js
const path = require('path');
module.exports = {
  mode:'development',
  entry: './src/index.jsx',
  output: {
    // 注意这里，其实后端的配置文件的静态服务也在这里打开的
    path: path.join(__dirname,'static'),
    filename: 'webpack.bundle.js'
  },
  resolve: {
    alias: {
        '@': path.join(__dirname,'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          }
        }
      }
    ]
  }
};
```
在后端的配置full-stack-demo/app/back/static.js中:
```js
const path = require('path');
const config = require('../config');
module.exports = [
    {
        urlPrefix:'/',
        staticPath:path.join(config.appDirname,'front','static'),
        defaultList:['index.html']
    }
]
```
配置了静态化full-stack-demo/app/front/static/目录，同时指定默认访问了index.html.而index.html则是引用了编译生成的webpack.bundle.js，这是前端环境正式生效。(画外音:顺带推荐个国际化的模块[my-i18n](https://www.npmjs.com/package/my-i18n)还不错)

index.html代码如下：
```html
<!DOCTYPE HTML>
<html>
    <head>
        <title>全栈(gan)demo</title>
    </head>
<body>
<div id="root"></div>
<script type="module" src="/webpack.bundle.js"></script>
</body>
</html>
```

# 总结
自此实现了一行命令，从一个入口文件，同时执行前端和后端项目。能快速启动和开发一些简单的全栈(gan)场景和一些小型项目，但目前较大的前后端几乎都是采用微服务化的多APP模式，将多APP模式和这种全栈(gan)框架结合，目前还是有很多事情需要考虑的。就酱！
