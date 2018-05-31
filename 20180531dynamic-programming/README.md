# 动态规划包的拆解和使用
### 什么是动态规划
动态规划(dynamic programming)是运筹学的一个分支，是求解决策过程(decision process)最优化的数学方法。20世纪50年代初美国数学家R.E.Bellman等人在研究多阶段决策过程(multistep decision process)的优化问题时，提出了著名的最优化原理(principle of optimality)，把多阶段过程转化为一系列单阶段问题，利用各阶段之间的关系，逐个求解，创立了解决这类过程优化问题的新方法——动态规划。<br />
可以说这不仅仅是一类算法，更是一种思想。

### 动态规划的意义
动态规划问世以来，在经济管理、生产调度、工程技术和最优控制等方面得到了广泛的应用。例如最短路线、库存管理、资源分配、设备更新、排序、装载等问题，用动态规划方法比用其它方法求解更为方便。<br />
虽然动态规划主要用于求解以时间划分阶段的动态过程的优化问题，但是一些与时间无关的静态规划(如线性规划、非线性规划)，只要人为地引进时间因素，把它视为多阶段决策过程，也可以用动态规划方法方便地求解。<br />
也就是说在编程方面可以把一些复杂的问题简单化，使处理起来简单和清晰。<br />

### 快速使用动态规划来解决问题
我们可以使用 [https://www.npmjs.com/package/quick-dp](https://www.npmjs.com/package/quick-dp)这个库来简单的实现很多动态规划的问题。<br />
这次本人也根据quick-dp提供的例子之一《动态规划-找零钱》来讲解这个如何用这个库实现动态规划及这个库的实现，进而浅入动态规划的思想。

### 先看quick-dp的例子找零钱代码
#### 题目：
给予不同面值的硬币若干种种（每种硬币个数无限多），如何用若干种硬币组合为某种面额的钱，使硬币的的个数最少？
#### 代码：
```js
const DynamicProgramming = require('quick-dp');
// change coin question by dynamic programming
class Coin
{
    constructor(much)
    {
        this.much = much;       
    }
}
let coinTypeList = [new Coin(1),new Coin(2),new Coin(5)];
let coinDP = new DynamicProgramming(coinTypeList,13);
let totalMoney = 0;
let coinResult = coinDP.run((item,itemKey,nowPurpose)=>{
    return Math.ceil(nowPurpose/item.much);
},(item,itemResult,itemKey,nowPurpose,purpose,result)=>{
    let money = item.much*itemResult;
    if (money<=purpose-totalMoney)
    {
        result.push({coin:item,num:itemResult});
        if (totalMoney+money==purpose){return DynamicProgramming.RETURN_FIND;}
        totalMoney+=money;
        return DynamicProgramming.BREAK_FIND;
    }
});
console.log("change coin question:")
/**
 * coinResult：
 * [ { coin: Coin { much: 5 }, num: 2 },
 * { coin: Coin { much: 2 }, num: 1 },
 * { coin: Coin { much: 1 }, num: 1 } ]
 */
console.log(coinResult)
```
#### 代码解析
我们可以先看run是如何实现的
```js
run(getSingleResultFunc,findResultFunc)
{
    let singleResultList = this.getSingleResultList(getSingleResultFunc);
    return this.findResult(findResultFunc,singleResultList);
}
```
这里它调用了两个方法getSingleResultList和findResult。
也就是说我们把下面的方法传入了getSingleResultList来获取一个结果
```js
// getSingleResultFunc:
(item,itemKey,nowPurpose)=>{
    return Math.ceil(nowPurpose/item.much);
}
```
那我们来看看getSingleResultList是如何实现的
```js
getSingleResultList(getSingleResultFunc) 
{
    let singleResultList = [];
    for (let itemKey=0;itemKey<this.itemList.length;itemKey++) 
    {
        singleResultList[itemKey] = [];
        for(let nowPurpose=0;nowPurpose<=this.purpose;nowPurpose++)
        {
            singleResultList[itemKey][nowPurpose] = getSingleResultFunc(
                this.itemList[itemKey],itemKey,nowPurpose,singleResultList
            );
        }
    }
    return singleResultList;
}
```
其实这里就是动态规划的核心思想“填表”。像上面的硬币就会生成如下表
```js
// singleResultList:
[ [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ],
  [ 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7 ],
  [ 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3 ] ]
```
#### 那么生成这张表意义是什么呢？
仔细观察你会发现这张表就是单一结果的可能性。什么意思呢？<br />
这个例子是基于我们有1，2，5面值的硬币，要找13元的情况下的例子<br />
第一列就是只有面值为1时的找零的向上取整：<br />
```
只有面值为1在找零为0的时候要给出0个
只有面值为1在找零为1的时候要给出1个
只有面值为1在找零为2的时候要给出2个
只有面值为1在找零为3的时候要给出3个
...
只有面值为1在找零为11的时候要给出11个
只有面值为1在找零为12的时候要给出12个
只有面值为1在找零为13的时候要给出13个
```
第二列就是只有面值为2时的找零的向上取整：<br />
```
只有面值为2在找零为0的时候要给出0个
只有面值为2在找零为1的时候要给出1个(这里本来是要找0.5个，但向上取整了，后面以此类推)
只有面值为2在找零为2的时候要给出1个
...
只有面值为2在找零为11的时候要给出6个
只有面值为2在找零为12的时候要给出6个
只有面值为2在找零为13的时候要给出7个
```
第三列就和前两列雷同就不讲了，这里的目的就是对问题的拆分，将一些复杂的多情况问题先拆分成一个一个单一情况的问题

#### 那么拿到这张表之后呢？如何找结果呢？
拿到这张表之后其实就是可以开始组合这边的结果集了,看findResult是怎么实现的
```js
findResult(findResultFunc,singleResultList)
    {
        let result = [];
        for (let itemKey=this.itemList.length-1;itemKey>=0;itemKey--) 
        {
            for(let nowPurpose=this.purpose;nowPurpose>=0;nowPurpose--)
            {
                let isAgainRun = findResultFunc(
                    this.itemList[itemKey],
                    singleResultList[itemKey][nowPurpose],
                    itemKey,nowPurpose,
                    this.purpose,result,singleResultList
                );
                if (isAgainRun<0)
                {
                    if (isAgainRun==DynamicProgramming.RETURN_FIND){return result;}
                    if (isAgainRun==DynamicProgramming.BREAK_FIND){break;}
                    if (isAgainRun==DynamicProgramming.CONTINUE_FIND){continue;}
                }
                
            }
        }
    }
```
我们这里看到，这就是一个倒叙遍历，也就是从最后一列和最后一行遍历到第一列第一行,同时根据findResultFunc返回的结果决定是否继续遍历还是中断操作等。。。那我们回头看我们传入的findResultFunc方法是怎么样的。
```js
(item,itemResult,itemKey,nowPurpose,purpose,result)=>{
    let money = item.much*itemResult;
    if (money<=purpose-totalMoney)
    {
        result.push({coin:item,num:itemResult});
        if (totalMoney+money==purpose){return DynamicProgramming.RETURN_FIND;}
        totalMoney+=money;
        return DynamicProgramming.BREAK_FIND;
    }
}
```
结合之前的倒序遍历，这里其实做的就是第一步最大硬币的面值乘以最大要找的数量，如果不是正好等于0，则向上让更小的硬币乘以更小的值，直到补足，使要找的钱正好到达我们的目标值，而已。<br />
使用动态规划，硬币找零只需要10行代码实现，quick-dp库的例子中还有01背包和动态规划排序的例子，有兴趣可以看一下。

### 使用quick-dp库实现动态规划的优缺点
#### 优点
* 能相对简单的实现动态规划
* 把单一循环工作都已经做了一遍
#### 缺点
* 动态规划的思想还是要自己给出
* 由于这个库为了兼容大多数动态规划，所以不会有太好的性能，针对特定的动态规划优化算法还是要自己写






