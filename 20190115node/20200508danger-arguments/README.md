# 警惕JS数组解构转参数导致爆栈问题
起源是在写webscoket服务的时候，发现开发工具偶尔报`Maximum call stack size exceeded`的问题。由于当时没时间，就草草把[BUG](https://github.com/zy445566/before-server/commit/bafa7f8a241510b322add1394fc48bddf3a30fbc)修复了，并未深究原因。现在复盘工作的时候，又想起这个问题，于是再把这个问题拿出来研究。

出错代码大概是如下：
```js
new Array().push(...Buffer.allocUnsafe(2**17))
```
一开始看到超出调用栈以为是Buffer的迭代器递归出现了问题，但事实并不是这样。

# 排查出错原因
由于出错代码是这样的:
```js
/*
* 而且存在临界点，不同机器略有差异
* 本人的机器大于2**17就必报
*/
new Array().push(...Buffer.allocUnsafe(2**17))
```
当时认为是Buffer的迭代器问题，所以就尝试使用普通数组
```js
/*
* 这段代码在浏览器也报错
* 所以排除nodejs原因，应该是V8造成的
*/
new Array().push(...new Array(2**17).fill(0xff))
```
发现普通数组也存在类似问题，接下来就是排除迭代器
```js
[...new Array(2**17).fill(0xff)]
```
发现迭代居然`没有异常`，难道是push方法？那就换个方法试试
```js
console.log(...new Array(2**17).fill(0xff))
```
居然log也报错,那真相只有一个，那就是`参数超载`了

# 那为什么会报超过最大调用堆栈大小，而不是其它错误？
大家都知道，函数再调用函数的时候，是通过存储在调用栈中来保持执行顺序的，而栈是有一定大小，比如递归上数百万次后也会出现爆栈。

那么是否真的是因为栈不够用了？还是说参数对调用栈也存在一些影响？

1. 接下来我们就来逐一排查。首先确定是否是真的因为栈不够用了
```sh
# 通过调整栈大小，来判断是否是栈耗尽了，stack-size的单位是KB，默认是984
node --stack-size=2048 -e "new Array().push(...Buffer.allocUnsafe(2**17))"
```
发现果然运行正常，所以可以确定是栈耗尽了

2. 排查参数的数量对栈的影响
```js
function recursionDepth(paramLen) {
    let deepth = 0;
    function f(...paramList) {
        deepth++;
        Math.random() + f(...paramList); // 防止尾递归优化
    }
    try{
        f(...Buffer.allocUnsafe(paramLen))
    } catch (err) {
        console.log(`当参数长度为${paramLen}，最大深度则为：${deepth}`)
    }
}

recursionDepth(2**4)
recursionDepth(2**8)
recursionDepth(2**12)
recursionDepth(2**16)
recursionDepth(2**20)
```
输出结果:
```sh
当参数长度为16，最大深度则为：3489
当参数长度为256，最大深度则为：455
当参数长度为4096，最大深度则为：30
当参数长度为65536，最大深度则为：1
当参数长度为1048576，最大深度则为：0
```
所以由此确定参数的数量也是需要暂用调用栈的空间，而当参数长度达到足够长，即使1帧也可以压垮整个调用栈，超出调用栈空间。