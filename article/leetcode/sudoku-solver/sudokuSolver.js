/**
 * @param {character[][]} board
 * @return {void} 
 */
// github@zy445566
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