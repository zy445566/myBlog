# 分享一个构建树的方法
## 起因
想不到在2024年，我居然会重新开始刷题，但是作为JavaScript开发，在刷到树的时候，还是特别烦恼，倒也不是因为难而烦恼，而是因为刷题的时候要调试树的结构而烦恼，所以自己写了个方法来进行数的构建。但是想到链表有时也需要构建，想想干脆就一起写了吧

# 树的构建
树的构建,这里使用了BFS广度遍历来进行构建，主要原因是数组本身也是一个广度遍历型的数组结构
```js
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}
function buileTreeByArray(list) {
    if(!list.length){return null}
    let root = new TreeNode(list.shift())
    const queue = [root]
    while(list.length) {
        const len = queue.length
        for(let i=0;i<len;i++) {
            const node = queue.shift()
            if(node===null) {continue}
            let leftVal = list.shift()
            node.left = leftVal===null?null:new TreeNode(leftVal)
            const rightVal = list.shift()
            node.right = rightVal===null?null:new TreeNode(rightVal)
            queue.push(node.left, node.right)
        }
    }
    return root
}

```

# 链表的构建
链表的构建可以说丝毫没有难度，废话不多说，分享一下代码
```js
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}
function buileListByArray(list) {
    if(!list.length){return null}
    let head = node = new ListNode(list.shift())
    while(list.length) {
        node.next = new ListNode(list.shift())
        node = node.next
    }
    return head
}
```

# 结语
这几个方法本来是自用调试的，倒不是为了省钱不开通Plus会员，主要是身为技术还去开通leetcode的Plus会员就有点没技术范了。