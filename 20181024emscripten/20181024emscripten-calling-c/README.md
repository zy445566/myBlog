# 使用emscripten实现js直接调用C代码
最近感觉一个时间转换的C库挺好用的，但不想做成C扩展，并不是说C扩展难，对于我来说好歹也是写过一些C扩展的，主要是C扩展对环境有一些依赖，比如非win下需要node-gyp做为环境支持来进行编译，对使用者来说相对麻烦。并且我希望前端也可以调用，所以目标瞄准了emscripten，但看了这么多emscripten的文章，大多都是将理论要不就是翻译了教程，具体教程本人没看到。那就自己写的教程，记录顺便作为emscripten的初探。

# emscripten是什么
大家可能只是熟知emscripten是一个可以将C代码转换成WebAssembly的神器，不仅仅如此，emscripten还可以实现C和js互调，架出一道桥梁。同时核心还是基于LLVM，写过几篇关于[LLVM](https://github.com/zy445566/myBlog/blob/master/20180825llvm/README.md)的，所以对LLVM制作的软件还是存在莫名的好感。好废话不多说，开干！

# emscripten的安装
这篇文章不细讲，可能重要的还是空如何在终端科学上网的内容。点此[打开emscripten的安装教程](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)。

# 编写C代码
这里为什么使用emscripten.h和EMSCRIPTEN_KEEPALIVE的主要原因是我不太想编译代码的时候跟随一大堆指令，用这个在代码里面看起来也直观些。当然也可以使用编译指令EXPORTED_FUNCTIONS来暴露方法。`注意如果是C++文件请用extern "C" 包裹，否则编译到时方法名会被加上指纹，JS调用的话就要根据指纹规则调用了`
```c
// add.c
#include <emscripten.h>
// 实现一个加法
EMSCRIPTEN_KEEPALIVE
int add(int a,int b) {
    return a+b;
}
```
然后进行编译,指定输出文件为add.js否则默认输出a.out.js
```sh
emcc add.c -o add.js -s 
```
当看到add.js和add.wasm文件就说明成功了。add.wasm文件可以说是wasm文件，add.js就是wasm和js文件交互的桥梁。

# 那么我们来使用这个C的相加方法
下面直接require之前编译好的add.js来运行即可，其中注释的ccall和cwrap需要编译的时候需要暴露方法，具体编译指令也写在注释中。我们可以使用引用后的文件加下划线调用方法和ccall和cwrap来调用方法的三种方式。其中ccall和cwrap的第一个参数是方法名，第二个参数是方法的返回值，第三个参数是传入参数的类型。而ccall第四个参数是传入值并直接执行。cwrap则是先定义方法。onRuntimeInitialized是初始化模块。
```js
// test.js
// 如果要解注，编译的的使用请使用 emcc add.c -o add.js -s -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'
let addModule = require('./add.js');
// let add = addModule.cwrap('add', 'number', ['number','number']);
addModule.onRuntimeInitialized = function() {
    // console.log(add(1,2))
    // console.log(addModule.ccall('add', 'number', ['number','number'], [3,4]));
    console.log(addModule._add(5,6))
}
```
可以直接用node运行，我目前的node版本是10，低版本没测试过。
```sh
node test.js # 结果11
```
就此完成了使用emscripten实现js直接调用C代码的过程，[本教程代码可以点此查看](https://github.com/zy445566/myBlog/20181024emscripten/20181024emscripten-calling-c/)

# 最后
emscripten确实使用了一个很棒的思路来解决JS调用C语言的问题，wasm真香。其他语言也快来，转成wasm来被JS支配吧！