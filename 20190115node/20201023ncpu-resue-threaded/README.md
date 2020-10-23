# 使用ncpu解锁真·多线程复用
最近看了一些线程池的库，发现很多都是伪多线程复用，什么叫伪多线程复用呢?我看到这么一种情况只规定了多线程的最大数量等于CPU数量，来一个请求就启动一个线程，超出后请求就开始排队。那么这会有什么问题呢？就是不断地{启动}->{销毁}->{启动}->{销毁},但这样启动和销毁是会有开销的。这和ncpu有什么关系呢？不是说好ncpu只做多线程底层库，线程池让用户自己封装么？当然有关系，ncpu可以做到从底层就避免上面的问题，从而更好的封装线程池。

# 那么ncpu是如何实现真·多线程复用的呢？
1. 利用已实现的在线程中运行动态代码，使得即使代码变更也不需要重启线程
2. 使用计数方法进行动态创建和空闲时销毁线程
3. 利用主次进程的通讯机制在通讯连接上积压执行请求，只要存在积压请求，那么线程运行就不会停止

# 那么如何利用ncpu实现一个简易的复用线程池呢
其实很简单，加上http服务代码都不超过20行：
```js
const http = require('http');
const {NCPU} = require('ncpu');
const cpuNum = 4;
const ncpuPool = new Array(cpuNum).map(e=>NCPU.getWorker()); // 生成简易进程池
http.createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const ncpuWorker = ncpuPool[Math.round(Math.random()*3)] // 不建议使用随机法，容易负载不均衡，仅例子使用
    const sum = await NCPU.run((num)=>{
      let i=0;
      let sum=0;
      while(i<num) {
        i++;
        sum+=i;
      }
      return sum;
    },[1000000],ncpuWorker); // 将ncpuWorker这个线程绑定run的计算
    res.end(sum.toString());
}).listen(8080)
```
这里通过线程池随机取线程，再通过线程直接和计算相互绑定实现计算和线程的复用绑定。

# ncpu的优势和具体如何使用
优势：
* 取代了传统多线程的的不断{启动}->{销毁}->{启动}->{销毁}的过程损耗
* 主线程和从线程之间的通讯进行了封装，使得使用麻烦的部分进行了隐藏
* 简单快捷，作为基础库利于封装成自己的多线程库

使用说明地址和注意事项：

其中ncpu有两个版本一个是给node.js使用的版本为[ncpu](https://github.com/zy445566/ncpu)。还有专门给前端可以直接使用webpack打包的版本为[ncpu-web](https://github.com/zy445566/ncpu-web)。在使用的时候请注意。

