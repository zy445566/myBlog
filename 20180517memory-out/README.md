# 实战线上内存泄漏问题
### 故事背景
由于我们线上验证码突然出现假死，记录最后一次node崩溃的线上node内存使用达到了1.36GB，所以基本断定是内存泄漏了

### 工具
heapdump(npm包)
chrome浏览器中的开发者工具（memory）

### 准备
先在入口文件中加入
```js
const heapdump = require('heapdump');
```
我们的环境用的是k8s服务，所以每个prod都有自己的域名（所以下面的域名是不存在的），<br />
我们获取验证码的接口是http://valve-tdbase/valve/verification/get <br />
下面是我的请求的测试脚本<br />
```js
const http = require("http");
for(let i=0;i<500;i++)
{
    http.get('http://valve-tdbase/valve/verification/get', (res) => {});
}
```

### 开干
然后使用node启动入口文件（请勿用pm2启动服务，pm2开的子进程容易造成数据的迷惑）<br />
启动后，查出node的PID，如图<br />
![pid](./pid.png) <br />
接下来每运行一次测试脚本就执行一次下面的命令（2981是我启动node服务的PID）
```sh
kill -USR2 2981
```
生成出内存快照后，进入chrome开发者工具进行对比，使用对比模式(comparision),将两次执行测试脚本后生成的快照进行对比,发现CAP类型的数据回收数量为0，并且新增数量巨大，如下图<br />
![comparision](./comparision.png) <br />

### 并且发现绑定在reg_ary中，遂查找调用链。发现以下可能存在问题的代码(有兴趣可以先看一下)

以下是我们业务代码（每一次调用都会走，存在删减）：<br />
```js
_M.prototype.get = function* () {
    try{
        this.log.info('request get default verification code');
        var ccap = require('ccap');
        var captcha = ccap(default_cfg.style);
        var ary = captcha.get();
        var code = ary[0];
        var buffer = ary[1];
        var pid = randomWord(false,16);
        yield this.redis_client.setex(pid,default_cfg.expire_date,code.toLowerCase());
        return {pid:pid,img:'data:'+default_cfg.type+';base64,'+buffer.toString('base64')}
    }catch(e){
        this.log.error('get default verification code error:',e);
        return null;
    }
};
```
以下是ccap库的代码(存在删减)：<br />
hcap.js:<br />
```js
...
var timer = require('./timer.js');
...
var CAP = function(args){
...
}
module.exports = function(args){
	var cap = CAP(args);
	ins_count++;
	timer.reg_ary.push(cap);//将实例化之后的对象注册到timer定时器中
	return cap;
};

dirObj.dir();//设置路径权限，清空历史文件夹
dirObj.setSchedule();//开启定时器，每天凌晨2点清理文件夹
timer.timer();//启动计时器，每分钟更新缓存
```
timer.js:<br />
```js
var timer = {
	timeout:1000*60,//更新验证码时间1分钟
	reg_ary:[],
	isRunning:0,
}
timer.timer = function(notFirst){
...
		
		var rary = timer.reg_ary,
			len = rary.length;

		for(var i=0;i<len;i++){
			try{
				rary[i]._timer();
			}
			catch(e){
				console.error(e)
			}
		}
...
		
}
module.exports = timer;
```


### 发现问题
业务代码中存在这段，每次请求都会调用<br />
```js
var ccap = require('ccap');
var captcha = ccap(default_cfg.style);
```
而运行ccap，会把CAP这个方法不断推送到timer.js文件的timer变量的reg_ary数组中！<br />
重点reg_ary是绑定在require('./timer.js')的，所以不会回收，而一直缓存的！<br />
```js
module.exports = function(args){
	var cap = CAP(args);
	ins_count++;
	timer.reg_ary.push(cap);//将实例化之后的对象注册到timer定时器中
	return cap;
};
```
导致绑定在reg_ary的数据越来越多！

### 解决
将ccap(default_cfg.style);放到当前文件上面，我们这个文件是单例，不会不断运行，所以可以这样做，当然其它情况需视情况而定。
```js
var ccap = require('ccap');
var captcha = ccap(default_cfg.style);
_M.prototype.get = function* () {
    try{
        this.log.info('request get default verification code');
        var ary = captcha.get();
        var code = ary[0];
        var buffer = ary[1];
        var pid = randomWord(false,16);
        yield this.redis_client.setex(pid,default_cfg.expire_date,code.toLowerCase());
        return {pid:pid,img:'data:'+default_cfg.type+';base64,'+buffer.toString('base64')}
    }catch(e){
        this.log.error('get default verification code error:',e);
        return null;
    }
};
```
### 总结
虽然这份业务代码不是我也写的，但自认如果自己写，也有可能会遇到这样的坑，所以希望ccap的作者有时间能够改良一下，虽然可能我有时间也会PR，嘿嘿！@DoubleSpout