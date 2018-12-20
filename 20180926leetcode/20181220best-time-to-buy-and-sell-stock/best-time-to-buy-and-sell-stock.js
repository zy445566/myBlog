/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    // 优化头
    while (prices.length>0) {
        let maxPrice = Math.max.apply(this,prices);
        if (maxPrice<=prices[0]) {
            prices.shift();
        } else {
            break;
        }
    }
    // 优化尾
    while (prices.length>0) {
        if (prices[prices.length-1] === Math.min.apply(this,prices) {
            prices.pop();
        } else {
            break;
        }
    }
    // 开始动态规划填表
    let dpTable = [];
    for (let i = 0;i<prices.length;i++) {
        dpTable[i] = [];
        for (let j = 0;j<prices.length;j++) {
            if (j<=i) {
                dpTable[i].push('x')
            } else {
                dpTable[i].push(prices[j]-prices[i]);
            }
        }
    }
    // 开始动态规划求值
    let maxValue = 0;
    for (let i = 0;i<dpTable.length;i++) {
        for (let j = i+1;j<dpTable[i].length;j++) {
            if (dpTable[i][j]=='x') {continue;}
            if (dpTable[i][j]>maxValue) {
                maxValue = dpTable[i][j];
            }
        }
    }
    return maxValue;
};
