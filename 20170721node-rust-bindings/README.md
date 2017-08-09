# rust-bindings-learn
* 于[github首发](https://github.com/zy445566/rust-bindings-learn),如需转载，请先联系作者。
* 这是一个用于制作node的rust扩展的的中文教程，接下来我将会一步一步教学。
* 由于天朝墙的问题，建议大家先准备好代理。

## 准备
### 如果之前使用过node-gyp则只需要安装rust即可（优势可以不需要python了）

### 在 Unix 系统的软件列表
* `make`
* [GCC](https://gcc.gnu.org)
* [Node](https://nodejs.org)
* [Rust](https://www.rust-lang.org)

### 在 Mac 系统的软件列表
* [Xcode](https://developer.apple.com/xcode/download/)
* [Node](https://nodejs.org)
* [Rust](https://www.rust-lang.org)

### 在 Windows 系统的软件列表
* [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)
* [Visual C++ Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools)
* [Visual Studio 2015以上](https://www.visualstudio.com/products/visual-studio-community-vs)
* (仅限于Windows Vista / 7)[.NET Framework 4.5.1](http://www.microsoft.com/en-us/download/details.aspx?id=40773)
* [Node](https://nodejs.org)
* [Rust](https://www.rust-lang.org)
* 设置Visual Studio的版本如2017则改为2017即可，npm config set msvs_version 2015

## 开始建立项目
### 先全局安装生成器
``` sh
npm install -g neon-cli
```
### 正式开始建立项目
* 运行命令建立项目，那我们来一发求斐波那契数吧
* 先建立项目，同时看是否之前的环境是否搭建有误
首先运行
```sh
neon new fib
```
------------------------
![neon_new_fib](https://raw.githubusercontent.com/zy445566/rust-bindings-learn/master/imgs/neon_new_fib.png)
---------------------------------
我们先看一下目录结构
-------------
![dir-stcut](https://raw.githubusercontent.com/zy445566/rust-bindings-learn/master/imgs/dir-stcut.png)
------------------
接下来，切换到生成的目录，安装依赖并编译
``` sh
cd fib
npm install
```
如果出现以下情况则安装正确(如图)：
---------
![build-test](https://raw.githubusercontent.com/zy445566/rust-bindings-learn/master/imgs/build-test.png)
------------------

### 开始写我们的斐波那契数吧
打开native目录里的src中的lib.rs文件,修改为
```rust
#[macro_use]
extern crate neon;

use neon::vm::{Call, JsResult};
use neon::js::JsString;
use neon::js::JsInteger;
use neon::js::Variant;

//原有的hello方法
fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "hello node").unwrap())
}

//斐波那契数方法入口
fn fib(call: Call) -> JsResult<JsInteger> {
    let scope = call.scope;
    //获取第一个参数
    let option_num = call.arguments.get(scope,0);
    //定义参数值变量
    let mut num:i32 = 0;
    //获取参数值
    if let Some(x1) = option_num {
        if let Variant::Integer(x2) = x1.variant() {
            num = x2.value() as i32;
        }
    }
    //调用简单的求斐波那契数方法，并返回js的Integer对象
    Ok(JsInteger::new(scope, easy_fib(num)))
}

// 简单的求斐波那契数方法，有兴趣的同学可以实现一下矩阵快速幂求斐波那契数
fn easy_fib(num:i32) -> i32
{
    if num < 2
    {
        return 1;
    } else {
        return easy_fib(num-1) + easy_fib(num-2);
    }
}

//模块导出
register_module!(m, {
    try!(m.export("hello", hello));
    try!(m.export("fib", fib));
    Ok(())
});

```
### 接下来是lib的index.js文件修改为
```node
var addon = require('../native');
console.log(addon.hello());
console.log(addon.fib(30));
```

### 编译并运行
```sh
cnpm install #或neon build
node .\lib\index.js
```

### 看到下图，你就已经成功了，现在你可以用rust做node扩展了
-----------------

![fib-test](https://raw.githubusercontent.com/zy445566/rust-bindings-learn/master/imgs/fib-test.png)