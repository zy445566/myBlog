# 解数独
刚刷完《有效的数独》后就刷了《解数独》这道题。刷完后看到这道题被标记成`困难`，并且感觉还挺有意思的，所以正好拿出来分享一下。

# 先看看数独游戏的规则吧(玩过的可以忽略)
1. 数字 1-9 在每一行只能出现一次。
2. 数字 1-9 在每一列只能出现一次。
3. 数字 1-9 在每一个以粗实线分隔的 3x3 宫内只能出现一次。

待填入的数独：

![待填入的数独图片](./sd.png)

完成的数独：

![完成的数独图片](./sda.png)

# 先看《有效的数独》解法
思路比较简单，就是遍历每一个值，并且分别判断横竖和对应该数的九宫格是否重复。这里不多说。
```js
/**
 * @param {character[][]} board
 * @return {boolean}
 */
var isValidSudoku = function(board) {
    for(let i=0;i<board.length;i++) {
        let map = {};
        for (let j=0;j<board[i].length;j++) {
            if (board[i][j]!='.'){
                if (!map[board[i][j]]) {
                    map[board[i][j]] = true;
                } else {
                    return false;
                }
            }
        }
    }
    for(let i=0;i<board.length;i++) {
        let map = {};
        for (let j=0;j<board[i].length;j++) {
            if (board[j][i]!='.'){
                if (!map[board[j][i]]) {
                    map[board[j][i]] = true;
                } else {
                    return false;
                }
            }
        }
    }
    function littleReapeat(lStart,vStart,long = 3) {
        let map = {};
        for(let i=lStart;i<lStart+long;i++) {
            for (let j=vStart;j<vStart+long;j++) {
                if (board[i][j]!='.'){
                    if (!map[board[i][j]]) {
                        map[board[i][j]] = true;
                    } else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    for(let i=0;i<board.length;i+=3) {
        for (let j=0;j<board[i].length;j+=3) {
            if(!littleReapeat(i,j)) {
                return false;
            }
        }
    }
    return true;
};
```

# 再看《解数独》解法
第一次的想法就是直接和《有效的数独》解法走反向

1. 先找出横竖和对应该数的九宫格中排除数字，如果只剩下一个结果，则填入
2. 如果存在有结果填入，则再执行第1步。没有则说明没有结果能够判断出来，直接返回

```js
/**
 * @param {character[][]} board
 * @return {void} Do not return anything, modify board in-place instead.
 */
var solveSudoku = function(board) {
    function checkNowNum(x,y) {
        let setMap = new Set(["1","2","3","4","5","6","7","8","9"]);
        for(let i=0;i<board[x].length;i++) {
            if(board[x][i]!='.') {
                setMap.delete(board[x][i])
            }
        }
        for(let i=0;i<board.length;i++) {
            if(board[i][y]!='.') {
                setMap.delete(board[i][y])
            }
        }
        let startX = Math.floor(x/3)*3;
        let startY = Math.floor(y/3)*3;
        for(let i = startX;i<startX+3;i++) {
            for(let j = startY;j<startY+3;j++) {
                if(board[i][j]!='.') {
                    setMap.delete(board[i][j])
                }
            }
        }
        if (setMap.size==1) {
            for(let num of setMap) {
                return num;
            }
        } else {
            return '.'
        }
    }
    function eachNum() {
        let addNum = 0;
        for (let i=0;i<board.length;i++) {
            for (let j=0;j<board[i].length;j++) {
                if (board[i][j]=='.') {
                    board[i][j] = checkNowNum(i,j);
                    if (board[i][j]!='.') {
                        addNum++;
                    }
                }
            }
        }
        if (addNum!=0) {eachNum()};
        return board;
    }
    eachNum();
};
```

一开始我认为上面的解法应该是够了的时候，拿去执行，发现只通过2个测试用例，原来测试用例的数独也不是可以完全判断出来，而是需要碰一些运气。那怎么办呢。

我想到我可以试一下尝试填入。即：

1. 填入无法判断的位置的可能性的数字
2. 根据上面填入的数字进行一步运算，如果不能走通就重制未知的结果，更换可能性数字

那么整体流程就变成了:

1. 先找出横竖和对应该数的九宫格中排除数字，如果只剩下一个结果，则填入
2. 如果存在有结果填入，则再执行第1步。
3. 如果全部计算出，则弹出结果，没有则走下一步
4. 填入无法判断的位置的可能性的数字
5. 再走第一步，如果不能走通就重制未知的结果，更换可能性数字

代码如下：

```js
/**
 * @param {character[][]} board
 * @return {void} 
 */
var solveSudoku = function(board) {
    function delUnkownNum (setMap,x,y) {
        if(board[x][y]!='.' && typeof board[x][y] =='string') {
            setMap.delete(board[x][y])
        }
    }
    function checkNowNum(x,y) {
        let setMap = new Set(["1","2","3","4","5","6","7","8","9"]);
        for(let i=0;i<board[x].length;i++) {
            delUnkownNum (setMap,x,i)
        }
        for(let i=0;i<board.length;i++) {
            delUnkownNum (setMap,i,y)
        }
        let startX = Math.floor(x/3)*3;
        let startY = Math.floor(y/3)*3;
        for(let i = startX;i<startX+3;i++) {
            for(let j = startY;j<startY+3;j++) {
                delUnkownNum (setMap,i,j)
            }
        }
        if (setMap.size==1) {
            for(let num of setMap) {
                return num;
            }
        } else {
            return setMap;
        }
    }
    function eachNum() {
        let addNum = 0;
        let unkownNumList = [];
        for (let i=0;i<board.length;i++) {
            for (let j=0;j<board[i].length;j++) {
                if (board[i][j]=='.' || typeof board[i][j] =='object') {
                    board[i][j] = checkNowNum(i,j);
                    if (board[i][j]!='.' && typeof board[i][j] =='string') {
                        addNum++;
                    } else {
                        unkownNumList.push({x:i,y:j,num:board[i][j]});
                    }
                }
            }
        }
        if (addNum!=0) {
            return eachNum()
        } else {
            if (unkownNumList.length>0) {
                for (let unkownNum of unkownNumList) {
                    if (unkownNum.num.size==0) {break;}
                    for(let num  of unkownNum.num) {
                        board[unkownNum.x][unkownNum.y] = num;
                        for (let unkownNumOther of unkownNumList) {
                            if (unkownNumOther.y>=unkownNum.y && unkownNumOther.x>=unkownNum.x) {
                                if (!(unkownNumOther.y==unkownNum.y && unkownNumOther.x==unkownNum.x)) {
                                    board[unkownNumOther.x][unkownNumOther.y] = unkownNumOther.num;
                                }
                            }
                        }
                        let ukList = eachNum();
                        if(ukList.length==0) {
                            return ukList;
                        } else {
                            for (let unkownNumOther of unkownNumList) {
                                if (unkownNumOther.y>=unkownNum.y && unkownNumOther.x>=unkownNum.x) {
                                    board[unkownNumOther.x][unkownNumOther.y] = unkownNumOther.num;
                                }
                            }
                        }
                    }
                }
            }
        }
        return unkownNumList;
    }
    eachNum();
};
```

通过这次增强运算，意料之中顺利通过了全部用例。

# 总结
先说说我这个最终方案的缺陷吧，我的最终方案其实走了很多的多余运算。如果优化的话，只要发现存在某个位置存在没有任何可能数字的情况下，就应该立刻复盘并更换复盘的可能性数字，而目前是直接算到底，只有发现无法全部算出才进行复盘。这道题，个人认为把`回溯法`表现的十分棒，而`回溯法`的精髓是什么呢？我认为就是`复盘`,这个过程更像是穿越时间回到过去，再把错误的决策给扳正。