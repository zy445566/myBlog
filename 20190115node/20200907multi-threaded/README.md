# 如何更爽的在JS中使用多线程
最近写多线程的时候遇到一个烦恼，就是用起来实在太麻烦，不管是WebWorker还是worker_threads库，用起来都实在太麻烦了。而且很多时候IO密集和CPU密集操作很多时候是交织的，有没有一种办法，可以直接在代码中方便的使用多线程呢？

# 以前我们使用Worker要怎么做？现在我们能怎么做？


### 之前的做法：
```js
// ### 父进程代码
// 比如请求网络数据，IO操作
const apiData = await request('/api/xxx');
// 为了不阻塞eventloop开启子线程,并拿到符合要求的格式
const goodApiData = await new Promise((resolve, reject) => {
  const worker = new Worker('子进程文件名xxx.js', {
    workerData: apiData
  });
  worker.on('message', resolve);
  worker.on('error', reject);
});
// ### 子线程代码
// 这里处理data数据，CPU密集操作
doSomething(workerData)
// 再发送回父进程
parentPort.postMessage(data);
```
代码量这么大，还要写2个文件以上文件，数据发送过去再发送回来头都大了！！！费脑！！！


那有没有更好的方法呢？当然使用ncpu就能做到！

### 使用ncpu的做法：
```js
import {NCPU} from 'ncpu'
// 比如请求网络数据，IO操作
const apiData = await request('/api/xxx');
// 为了不阻塞eventloop开启子线程,并拿到符合要求的格式
const goodApiData = await NCPU.run((data)=>{
  // 这里处理data数据，CPU密集操作
  doSomething(data)
  return data;
}, [apiData])
```
使用ncpu果然爽，一个回调函数就把CPU密集型计算搞定了。


爽是爽，但目前有两点强制限制：
* 回调函数不能共用上下文，因为ncpu是使用函数复制的方式来实现的，不会保留函数上下文。
* 传入参数都是使用 [HTML structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)方式来进行克隆的，不是原值

但正是这两点强制限制，使得线程更加安全了。因为但多个线程同时操作原值，会导致内存数据更新速度赶不上线程更新的速到，导致另一个线程读取数据不正确。而且我们要处理数据时，通常只需要将大循环和递归计算放入线程的回调函数中，所以这两点强制，并不会太影响使用。

# 目前ncpu的两个版本
一个是[ncpu](https://github.com/zy445566/ncpu)专门为node.js环境设计,另一个是[ncpu-web](https://github.com/zy445566/ncpu-web)专门为浏览器环境设计。

同时[ncpu](https://github.com/zy445566/ncpu)需要的最低node.js版本是12，而[ncpu-web](https://github.com/zy445566/ncpu-web)浏览器要求是谷歌浏览器至少60以上，火狐57以上即可。

在使用的时候要注意这些问题哦！


