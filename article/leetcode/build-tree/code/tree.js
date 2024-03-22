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

console.log(buileTreeByArray([1,2,3,null,4,5,6,null,null,7,null,null,8]))