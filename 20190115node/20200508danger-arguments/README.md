# 警惕数组转Buffer的参数过量问题
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
`未完待续`
