# 利用vm解决复杂的内存泄漏问题(Emscripten踩坑之路)
前段时间移植了一些项目到Wasm上，在公司项目上用户还没发现问题(可能是PM2不断奶活吧)，反倒开源项目先被github其它用户发现了存在内存泄漏问题，我一查确实存在。即使最后查明了内存泄漏原因，但是还是一度陷入了无法解决的难题中。

# 问题排查
和之前排查问题类似，不过目前不需要heapdump模块了。直接使用nodejs自带的v8模块就可以实现把内存快照写入到本地，吐槽一下，速度很慢。
```js
const { writeHeapSnapshot } = require('v8');
writeHeapSnapshot();
```
得到两份内存泄漏前的快照和内存泄漏后的快照后，用浏览器进行一次对比。发现了泄漏源是一个全局的Module变量，其中emscripten编译到C++的方法和malloc的内存空间都会绑定到这个变量中，而malloc的内存空间并没有被free掉。

有人可能要说了直接free掉空间不就好了？但是malloc的点太多了，而且free错了也会造成异常。

那既然解决起来很困难，能不能直接把这些作为一大块内存，要丢弃的时候直接丢弃掉？

对！这个时候就要使用神器,nodejs的vm模块了。

# 正文：使用vm解决Emscripten编译模块的内存泄漏问题
废话不多说，先上代码
```js
// 要维持挂载全局，但是每次调用后全局的cv和context又会被重新初始化
let cv = {};
let context = {};
// opencv.js即是Emscripten编译后的代码
let opencvCode = fs.readFileSync('./opencv.js');
const script = new vm.Script(opencvCode);
// isReadyFunc方法再每次调用暴露函数前运行
function isReadyFunc () {
    return new Promise((reslove,reject)=>{
        // 初始化上下文
        context = {
            module:{exports:{}},
            Module:{
                onRuntimeInitialized() {
                    // 其实就是读取module.exports暴露的方法
                    cv = context.module.exports();
                    return reslove(true);
                }
            },
            print:console.log
        }
        script.runInNewContext(context);
        // 超时判断载入失败
        setTimeout(()=>{
            return reject(new Error('loading opencv time out'))
        },3*1000)
    })
}
```
可能没有经常使用Emscripten和不太了解require原理的同学，看到上面的代码可能会有些迷糊为什么要这样写。其实Emscripten是可以编译前端环境和后端的nodejs环境，所以它本身是根据，当前变量中存在module且module.exports不为空则为nodejs环境。如果为nodejs环境在完成C++模块初始完成后会调用全局的Module.onRuntimeInitialized方法，而context的module.exports其实就是require暴露的变量和方法。

简单来说就是为了模拟require环境，同时适应Emscripten编译后代码的运行环境。

所以只要再调用我需要的方法前调用isReadyFunc方法，就可以重新再初始化context，使全局的cv和context，重新再初始化一遍，释放掉不必要的空间。

# 为什么vm最适合解决这类复杂的内存泄漏问题
因为vm最方便模拟运行环境，而且可以作为一个运行整体，想扔掉的的时候。而使用其它方案比如清除require的cache和parent中的关联，但随着node版本变化也可能导致其它变量一起泄漏，且不是那么方便模拟Emscripten编译后代码的运行环境。

当然优缺点都很明显，优点是省事偷懒，即使某个包存在内存泄漏也可以使用vm的思路解决，即使自己紧急也不用重新fork出新包来自己维护。缺点则是牺牲部分性能作为代价，因为每一次都必要进行非必要的初始化。但在叠机器的时代，性能真的这么重要么？

