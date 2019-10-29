# quickjs初体验
第一次看到quickjs，就感觉挺有意思的，对我个人来说解决了以下问题：
* 可以把js编译成二进制(解决js代码加密问题)
* 足够轻量，只需要将编译好的文件扔到对应系统即可运行，不需要带运行时
* 更纯粹的js环境

但是更纯粹的js环境也会带来其它问题，那么如果要做成http服务怎么办呢？

在文档中只看到了暴露了一个标准库std基本就是读写文件和控制台的一些操作功能，还有一个是os库，主要是获取当前目录当前系统的的一些操作。

那么这个问题就存在了，如果靠这两个库不能用现有的一些库，构建服务就会特别复杂。但还好的是，看到的了一些希望，看到了C Modules这一节我意识到quickjs提供了类似node的C扩展的东西。

所以看到这个，我就去源代码找例子，看到源代码中有一个fib的例子，所以顺便用这个来小试牛刀。

首先先把quickjs代码下载下来并安装到自己的电脑中。如下：
```sh
# 获取源码
wget https://bellard.org/quickjs/quickjs-2019-10-27.tar.xz
# 解压
tar -Jxvf quickjs-2019-10-27.tar.xz
# 切换到目录
cd quickjs-2019-10-27
# 根据makefile编译
make
 # 根据makefile安装到指定位置
make install
# 运行全局命令看看是否安装成功
qjs
qjsc
```
编译完成，我们自己把源代码的例子复制出来，同时做一些修改，如下：
```cpp
- #include "../quickjs.h"
+ #include "quickjs/quickjs.h"
+ #define JS_SHARED_LIBRARY true
```
为什么要这样修改，quickjs/quickjs.h被安装到了/usr/local/include/quickjs/文件夹中，默认编译的include是/usr/local/include/所以要在全局编译要增加quickjs作为/usr/local/include/的相对路径。

而JS_SHARED_LIBRARY变量，我觉得作者的意愿是在makefile中定义来控制编译函数名，所以当前文件没有定义。该文件全部代码如下，有省略：
```cpp
#include "quickjs/quickjs.h"
#define JS_SHARED_LIBRARY true
#define countof(x) (sizeof(x) / sizeof((x)[0]))
// 这里实现fib函数
static int fib(int n)
{
    if (n <= 0)return 0;
    else if (n == 1)return 1;
    else return fib(n - 1) + fib(n - 2);
}

// 因为js和C桥接需要更参数和传入值变换
// 相当于是对C函数封装成JS函数
static JSValue js_fib(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    int n, res;
    if (JS_ToInt32(ctx, &n, argv[0]))
        return JS_EXCEPTION;
    res = fib(n);
    return JS_NewInt32(ctx, res);
}

// 定义C函数列表，主要用于暴露
static const JSCFunctionListEntry js_fib_funcs[] = {
    JS_CFUNC_DEF("fib", 1, js_fib ),
};
// 这里作为模块主体，主要用于暴露
static int js_fib_init(JSContext *ctx, JSModuleDef *m)
{
    return JS_SetModuleExportList(ctx, m, js_fib_funcs,
                                  countof(js_fib_funcs));
}
// 根据JS_SHARED_LIBRARY编译不同方法名
#ifdef JS_SHARED_LIBRARY
#define JS_INIT_MODULE js_init_module
#else
#define JS_INIT_MODULE js_init_module_fib
#endif
// 初始化模块和添加暴露列表
JSModuleDef *JS_INIT_MODULE(JSContext *ctx, const char *module_name)
{
    JSModuleDef *m;
    m = JS_NewCModule(ctx, module_name, js_fib_init);
    if (!m)
        return NULL;
    JS_AddModuleExportList(ctx, m, js_fib_funcs, countof(js_fib_funcs));
    return m;
}

```

那么接下来我们直接把c文件编译成动态连接库，这里提醒一下，/usr/local/lib/quickjs/libquickjs.a是需要被依赖一起打包的库，如果需要更快体积更小的，可以使用libquickjs.lto.a，这是被链接时间优化的库。
```sh
gcc ./fib.c /usr/local/lib/quickjs/libquickjs.a  -shared -o fib.so 
```
这样就编译好了fib.so，我们可以在下面的js代码使用：
```js
// test_fib.js
// 引用库的代码
import { fib } from "./fib.so";
// 打印Hello World
console.log("Hello World");
// 输出C扩展代码的结果
console.log("fib(10)=", fib(10));
```
这个时候我们可以用qjs来直接运行
```sh
qjs ./test_fib.js
```
或者是用qjsc编译成二进制文件,再运行二进制文件
```sh
qjsc -o test_fib ./test_fib.js 
./test_fib
```
总的来说无论是deno也好，node也好，甚至于quickjs也好，都给出了不同的特权层解决方案。各有各的好处，但quickjs不管是自身或是是编译出的应用都可以说是相当轻量，而且从此之后大概没人能说JS编译不了成二进制了。