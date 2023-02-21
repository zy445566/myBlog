# 三数之和的优化之旅
最近一期的996结束，准备在空闲的时间学点什么，就在纠结的时候看到leetcode中国版推出了，正好提升一下自身的算法能力，遂开始刷题。可以说从中有一定提升，但大部分还是暴力刷题过的。这次下班回家刷三数之和的时候感觉纠结了我一晚上，让我吃也吃不下，让我睡也睡失眠，最后在上班路上用手机把这道题做了，我觉得还是有必要记录一下。

# 先说题目

> 给定一个包含 n 个整数的数组 nums，判断 nums 中是否存在三个元素 a，b，c ，使得 a + b + c = 0 ？找出所有满足条件且不重复的三元组。

> 注意：答案中不可以包含重复的三元组。

> 例如, 给定数组 nums = [-1, 0, 1, 2, -1, -4]，

>满足要求的三元组集合为：
```
[
  [-1, 0, 1],
  [-1, -1, 2]
]
```

# 最早思路，直接暴力刷
#### 当时想法:
1. 直接用三个循环遍历三个数
2. 然后给相加为0的结果排个序，再给这三个数打个map防止重复
#### 根据上面思路走的代码:
```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let threeSumList = [];
    let threeSumMap = {};
    // 1. 直接用三个循环遍历三个数
    for(let i=0;i<nums.length;i++) {
        for (let j=i+1;j<nums.length;j++) {
            for (let k=j+1;k<nums.length;k++) {
                if (nums[i]+nums[j]+nums[k]==0) {
                    let item = [nums[i],nums[j],nums[k]].sort((a,b)=>{return a-b;});
                    let itemStr = item.join();
                    if (!threeSumMap[itemStr]) {
                        // 2. 然后给相加为0的结果排个序，再给这三个数打个map防止重复
                        threeSumMap[item.join()] = true;
                        threeSumList.push(item); 
                    }
                }
            }
        }
    }
    return threeSumList;
};
```
#### 结果(貌似每个用例时间要小于三秒)：
超出时间限制


# 然后思考了一下，试试双指针
#### 当时想法:
1. 先对传入的数组排序
2. 两边指针向中心靠拢
3. 给右指针加上辅指针，向左移
#### 原因：
因为相加要为0，那么让最左边和最右边相加再不断缩小范围不就好了
#### 根据上面思路走的代码:
```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let threeSumList = [];
    let threeSumListMap = {};
    // 1. 先对传入的数组排序
    nums.sort((a,b)=>{return a-b;});
    function beatRepeat(num1,num2,num3) {
        let res = [num1,num2,num3].sort(); 
        let threeStr = res.join();
        if (!threeSumListMap[threeStr]) {
            threeSumListMap[threeStr] = true;
            threeSumList.push(res)
        }
    }
    // 2. 两边指针向中心靠拢
    for (let i=0;i<nums.length;i++) {
        for (let j=nums.length-1;j>i+1;j--) {
            // 3. 给右指针加上辅指针，向左移
            for(let k=j-1;k>i;k--) {
                let sumRes = nums[i]+nums[j]+nums[k];
                if (sumRes==0) {
                    beatRepeat(nums[i],nums[j],nums[k])
                }
            }
        }
    }
    return threeSumList;
};
```
#### 结果(貌似每个用例时间要小于三秒)：
超出时间限制

# 开始抓狂，找优化点
#### 当时想法:
1. 不可能，我怎么会失败，肯定是细节没做好
#### 原因：
1. 已经排过序了，那做map的时候可以不用排序了
2. 左右都是0的的可以直接返回了
3. 左边的值和上一个左边值相同说明做过处理了，不需要再处理了
4. 如果最右边的两个值相加没左边的绝对值高，那么是不是右边无论怎么左移都不可能和左边的数相加为0了
5. 如果相加大于0,辅助指针可以直接偏移
6. 如果相加已经开始小于0了,辅助指针可以直接结束本轮了
#### 根据上面思路走的代码:
```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let threeSumList = [];
    let threeSumListMap = {};
    function beatRepeat(num1,num2,num3) {
        // 1. 已经排过序了，那做map的时候可以不用排序了
        let res = [num1,num2,num3]; 
        let threeStr = res.join();
        if (!threeSumListMap[threeStr]) {
            threeSumListMap[threeStr] = true;
            threeSumList.push(res)
        }
    }
    nums.sort((a,b)=>{return a-b;});
    // 2. 左右都是0的的可以直接返回了
    if (nums[0]==0 && nums[nums.length-1]==0) {
        if (nums.length>=3) {
            return [[0,0,0]]
        } else {
            return [];
        }
    }
    for (let i=0;i<nums.length,nums[i]<=0;i++) {
        // 3. 左边的值和上一个左边值相同说明做过处理了，不需要再处理了
        if (i>0) {while(nums[i]==nums[i-1]){i++;}}
        for (let j=nums.length-1;j>i+1;j--) {
            // 4. 如果最右边的两个值相加没左边的绝对值高，那么是不是右边无论怎么左移都不可能和左边的数相加为0了
            if ((nums[i]+nums[j-1]+nums[j])<0){break;}
            for (let k=j-1;k>i;k--) {
                // 5. 如果相加大于0,辅助指针可以直接偏移
                while (nums[i]+nums[k]+nums[j]>0) {k--;}
                if (k<=i) {break;}
                let sumRes = nums[i]+nums[k]+nums[j];
                // 6. 如果相加已经开始小于0了,辅助指针可以直接结束本轮了
                if (sumRes<0){break;}
                if (sumRes==0) {
                    beatRepeat(nums[i],nums[k],nums[j])
                }
            }
        }
    }
    return threeSumList;
};
```
#### 结果(貌似每个用例时间要小于三秒)：
超出时间限制（这时心态接近崩溃@ _ @）

# 冷静下来，不空想
#### 排查
使用conosle.count打印了各个循环的计次,当数组大于3000时循环到j和k的次数超过100W次，而且k中还要进行大量运算，如果是100W次有效运算问题应该不大。但k很多都是无效运算。随准备加快k效率。

#### 当时想法:
1. 那能不能实现让辅助指针直接实现跳跃呢
#### 修改点：
##### 原代码:
```js
while (nums[i]+nums[k]+nums[j]>0) {k--;}
```
##### 修改为:
```js
// 折半跳跃
let inc = k-i;
while (nums[i]+nums[k]+nums[j]>0) {
    k--;
    let zk = k-Math.floor(inc/2);
    if (nums[i]+nums[zk]+nums[j]>0) {
        k=zk;
    }
    inc = inc/2;
    if (k<=i) {break;}
}
```
#### 根据上面思路修改的代码:
```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let threeSumList = [];
    let threeSumListMap = {};
    function beatRepeat(num1,num2,num3) {
        let res = [num1,num2,num3]; 
        let threeStr = res.join();
        if (!threeSumListMap[threeStr]) {
            threeSumListMap[threeStr] = true;
            threeSumList.push(res)
        }
    }
    nums.sort((a,b)=>{return a-b;});
    if (nums[0]==0 && nums[nums.length-1]==0) {
        if (nums.length>=3) {
            return [[0,0,0]]
        } else {
            return [];
        }
    }
    for (let i=0;i<nums.length,nums[i]<=0;i++) {
        if (i>0) {while(nums[i]==nums[i-1]){i++;}}
        for (let j=nums.length-1;j>i+1;j--) {
            if ((nums[i]+nums[j-1]+nums[j])<0){break;}
            for (let k=j-1;k>i;k--) {
                // 辅助指针直接实现跳跃呢
                // while (nums[i]+nums[k]+nums[j]>0) {k--;}
                let inc = k-i;
                while (nums[i]+nums[k]+nums[j]>0) {
                    k--;
                    let zk = k-Math.floor(inc/2);
                    if (nums[i]+nums[zk]+nums[j]>0) {
                        k=zk;
                    }
                    inc = inc/2;
                    if (k<=i) {break;}
                }
                if (k<=i) {break;}
                let sumRes = nums[i]+nums[k]+nums[j];
                if (sumRes<0){break;}
                if (sumRes==0) {
                    beatRepeat(nums[i],nums[k],nums[j])
                }
            }
        }
    }
    return threeSumList;
};
```
#### 结果：
通过全部用例

# 基准测试结果
```sh
threeSum#1 x 0.05 ops/sec ±5.39% (5 runs sampled)
threeSum#2 x 0.05 ops/sec ±5.05% (5 runs sampled)
threeSum#3 x 0.34 ops/sec ±9.68% (5 runs sampled)
threeSum#4 x 6.97 ops/sec ±2.44% (21 runs sampled)
```

# 结论
threeSum#4执行速度几乎是threeSum#1和threeSum#2的139倍，比threeSum#3也快了接近20倍。