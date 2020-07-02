# 利用require-vm实现一个更安全的引用，更好的防止内存泄漏篇
之前由于遇到了发现泄漏变量，但是代码结构庞大无法直接修改。就好像你引用了别人一个庞大的库，而且这个库有10000多个内存泄漏的方法等着你去修复，但这任务量无疑是庞大的。所以为了解决这个问题开发了[require-vm](https://www.npmjs.com/package/require-vm)库来彻底解决这个问题。

# 内存泄漏类型测试
现在引用一下N年前的老帖[《Node内存泄漏专题》](https://cnodejs.org/topic/4fa94df3b92b05485007fd87),里面几乎涵盖了内存泄漏的几种类型，那我们就根据这几种类型来验证[require-vm](https://www.npmjs.com/package/require-vm)是否能解决，这些内存泄漏问题。

## Case1：无限制增长的数组
泄漏案例：
```js
// case1.js
var leakArray = [];   
exports.leak = function () {  
  leakArray.push("leak" + Math.random());  
};
```
如果按照原来的方式requie，那么leakArray就不可能被回收，内存就会无限上涨连续运行3分钟内基本就爆出内存耗尽，如下:
```js
while(true) {
    require('./case1.js').leak()
}
```
但是如果你使用[require-vm](https://www.npmjs.com/package/require-vm)却可以无限运行，如下：
```js
const requireVM = require('require-vm');
while(true) {
  requireVM('./case1.js').leak()
}
```
看来case1,[require-vm](https://www.npmjs.com/package/require-vm)完美解决。

## Case2：无限制设置属性和值
泄漏案例：
```js
// case2.js
_.memoize = function(func, hasher) {
  var memo = {};
  hasher || (hasher = _.identity);
  return function() {
    var key = hasher.apply(this, arguments);
    return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
  };
};
```
memoize方法主要是为了用于缓存计算结果的，但是为了缓存计算结果会把计算值保留，但随着保留的多，数据会直接爆炸，导致内存耗尽。如下：
```js
function getN (n) {
  return n;
};
let memoize = require('lodash').memoize
let memoizeGetN = memoize(getN);
let i=0n;
while(true) {
  memoizeGetN(i);
  i++;
}
```
像这种情况，因为memo对象被memoizeGetN引用，而memoizeGetN变量又没有被销毁，所以这个只能手动销毁，[require-vm](https://www.npmjs.com/package/require-vm)也需要你手动销毁引用，如下：
```js
const requireVM = require('require-vm');
function getN (n) {
  return n;
};
let memoize = requireVM('lodash').memoize
let memoizeGetN = memoize(getN);
let i=0n;
while(true) {
  memoizeGetN(i);
  /**
   * 当重新赋值后原memo的引用也会被丢弃
   * 如果完全不需要可delete memoizeGetN
   * 但这样做原本用于缓存计算结果也无效了
   */
  memoizeGetN = memoize(getN);
  i++;
}
```

## Case3：任何模块内的私有变量和方法均是永驻内存的
泄漏案例：
```js
(function (exports, require, module, __filename, __dirname) {
    // case3.js ------------------------
    var circle = require('./circle.js');
    console.log('The area of a circle of radius 4 is ' + circle.area(4));
    exports.get = function () {
       return circle();
    };
    // case3.js ------------------------
});
```
其实这个东西和Case1很像，目前也确实是会存在问题，原因是require存在cache和其中的某些变量会存在全局，而且require来清除里面的变量并不是很方便，所以如下:
```js
const get = require('./case3.js').get;
// 这里无论你怎么样处理，case3.js里面的circle变量都不回被回收。
get = null;
```

如果使用[require-vm](https://www.npmjs.com/package/require-vm)解决，则把内存泄漏的可能交给自己手动解决，只要你delete应用关系即可被回收，如下：
```js
const requireVM = require('require-vm');
const get = requireVM('./case3.js').get;
/**
 * 如果使用requireVM，则get值被重置引用关系直接会被解除
 * 所以case3.js里面的circle变量走完get = null就直接被回收
 */
get = null;
```
同时如果存在全局变量的情况下，requireVM依旧可以回收，假设case3.js里面的circle变量是全局变量，则使用这种方式手动控制回收，如下：
```js
const requireVM = require('require-vm');
const context = {}
const get = requireVM('./case3.js',context).get;
/**
 * 因为我们假设circle变量是全局变量
 * 传入上下文，使变量绑定在上下文中
 * 删除上下文则随着上下文一起回收
 */
delete context;
```

## Case4: 大循环，无GC机会
泄漏案例：
```js
//OOM测试
for ( var i = 0; i < 100000000; i++ ) {
    var user       = {};
    user.name  = 'outmem';
    user.pass  = '123456';
    user.email = 'outmem[@outmem](/user/outmem).com';
}
```
这种现在已经没有任何意义，现在即使在循环内，V8也会进行内存回收。

# requireVM的优势
requireVM的目标是实现一个更安全，更可控的require引用，目前来看确实是做到了，它可以仅可能阻断内存泄漏，即使引用的包不能被修改，也可以实现手动实现引用包的内存释放。同时可定义moduleMap来实现引用替换，比如实现改写fs模块返回，从此引用第三方包不再需要提心吊胆，欧耶！



