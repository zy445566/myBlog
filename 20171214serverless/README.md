# Node.js的CPU密集计算的终结解决方案!!!
## 好吧我承认我是标题党，但这种方法确实解决了node的CPU密集型计算时造成服务无法响应或响应过慢问题,其实我讲的的是Faas的serverless简单使用，基于某云平台进行讲解。
### 写在前面:
大家都知道node.js基于EventLoop，本质上就是对异步进行排队运算，所以这就面临一个问题，如果大量计算放入了队列中运算，后面就要等前面运行完，严重导致队列堆积导致请求超时之类的问题。但目前很多人用线程来解决，我觉得这样不好，会增加代码复杂度，并且如果有海量运算的话也没办法开无数多的线程（爆机器问题（所以有线程池）和大于逻辑核的无意义）。那我们有没有不增加复杂度，来解决这个问题呢？的确有，Faas框架来实现的serverless就能将CPU密集计算问题迎刃而解（原因文末说明）。最早是亚马逊的lambda，当目前国内也有类似实现，那我就选择国内某云的函数计算来验证是否解决CPU密集计算问题，同时会对利用某云函数计算的使用进行一次详解（本来是写了具体云平台，但为了避免广告嫌疑改某云）。

# 首先我们要创建一个函数计算的服务和方法
当然我们要先选择某云的产品列表的“函数计算”来创建服务<br />
![createServer](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/createServer.png)<br />
一般选择白板函数就好<br />
![createFunc1](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/createFunc1.png) <br />
我们用著名的斐波那契来模拟CPU密集型吧<br />
![createFunc2](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/createFunc2.png) <br />
代码奉上<br />
```node
module.exports.handler = function(event, context, callback) { 
  let req = JSON.parse(event);
  //为什么是40，因为每个函数计算时间不能超过3秒
  let num = req.queryParameters.num>0?
      req.queryParameters.num:
  	  Math.ceil(Math.random()*40);
  //由于这个直接作为页面数据，所以api网关需要状态码和页面显示信息
  callback(null,{
    body:`num is ${num},fibo is ${fibo(num)}`,
    statusCode:200}
  ); 
};

function fibo(num)
{
	if(num<2){return 1;} 
  	return fibo(num-1)+fibo(num-2);
}
```

# 接下来创建对应的Api网关
## 由于函数计算的方法可以互相调用和触发调用，api网关的作用就是为了通过用户访问网关触发函数计算的方法调用
当然我们要先选择某云的产品列表的“api网关”来创建网关服务<br />
创建分组后，走如下图步骤 <br />
安全认证的作用是只让自己的手机App或自己的SDK用启用的，我们希望每个用户都能访问，改成无认证就好<br />
![api1](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/api1.png) <br />
接下来定义自己给别人访问的url，同时可以将自己域名绑定到自己的分组，实现通过自己域名访问
![api2](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/api2.png) <br />
这里的要点就是选择函数服务，然后填入函数计算当时创建的服务名和方法名就好。<br />
![api3](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/api3.png) <br />
最后发布上线就好，当然你还可以在外面的api试调先调用试试。<br />
![api4](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/api4.png) <br />

# 对比一下自己本机开的服务进行压测
## 本机代码
```node
var http = require('http');
var url = require('url');

function fibo(num)
{
	if(num<2){return 1;} 
  	return fibo(num-1)+fibo(num-2);
}

http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var params = url.parse(req.url, true).query;
    let num = params.num>0?params.num:Math.ceil(Math.random()*40);
    res.end(`num is ${num},fibo is ${fibo(num)}`);
 
}).listen(3000);
```
## 压测结果
某云函数计算压测结果：<br />
![test1](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/test1.png) <br />
本机压测结果（已被CPU密集计算阻塞）：<br />
![test2](https://raw.githubusercontent.com/zy445566/myBlog/master/20171214serverless/pic/test2.png) <br />

# 原因
由于函数计算会在访问量大的时候进行动态伸缩（其实就是加实例和机器，但只对需要的函数伸缩不像Paas要对整个平台伸缩造成浪费）所以在CPU密集时，它会为了保持及时的响应速度，进行进行伸缩，不至于CPU密集会导致无法访问或访问过慢。

# 最后
如果使用此某云实现的Serverless，那么建议使用开发工具，因为能更快用自己的IDE进行编码和开发，本人使用web页面，纯粹是为了更好展现功能。原文地址：https://github.com/zy445566/myBlog/tree/master/20171214serverless






