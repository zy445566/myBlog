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

console.log(buileListByArray([1,2,3,4,5]))