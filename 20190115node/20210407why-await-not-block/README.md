# 为什么说javascript的await是交出控制权而不是阻塞
先讲讲为什么要写这篇文章，我发现很多人对async/await的理解在不同的层次，大部分人对异步模型还在一个相对模糊的概念，很多人对异步模型甚至是有许多错误的看法，我觉得有必要写一篇文章来好好讲讲这个异步模型的构成。

# 不要被代码欺骗了你的眼睛
很多人看到下面的代码，很多人理解为await不就是为了阻塞doSomething1和doSomething2的执行，让doSomething1完成后再执行doSomething2吗？看效果好像是这样，但事实真的就是这样吗？
```js
async function run(mark) {
    await doSomething1();
    await doSomething2();
}
run('first') // 调用
```
实际上远远不仅仅是你所看到代码的那样，在第一个await之后实际上异步模型还可以去干**非当前所看到代码的事情**。

这里你可能还不理解这句话，为什么叫“干非当前所看到代码的事情”？

下面这个例子可能可以更让你理解为什么叫“干非当前所看到代码的事情”,那我们略作修改，比如
```js
function doSomething1 (time) {
    return new Promise ((reslove)=>{setTimeout(reslove,time)})
}
async function run(mark) {
    await doSomething1(1000);
    console.log(`${mark}.doSomething1 complete`)
    await doSomething2();
}
run('first') // 第一次调用
run('second') // 第二次调用
```
这时你会发现如果doSomething1的耗时比较固定的话，你会发现两条'doSomething1 complete'几乎会同时输出。为什么呢？如果按照await是阻塞的说法来说，不是应该走完第一次调用的doSomething1和doSomething2才会走下一步么？显然await是阻塞的说话是错误的。那这个不是阻塞是什么呢？我说这是一个调度系统,你相信么？

这就好比你是一个工人：
1. 当**第一次**run()执行的时候，你运行到doSomething1发现有await，你就知道这里有需要等待的事情，好比你砌墙发现没砖了，你要等货车把砖搬过来。
2. 所以这时候你跟调度系统说“现在**第一次**run()的doSomething1要等某样东西才能运行了”，这时候调度系统就会告诉你“那你现在去做第二次run()的doSomething1吧”
3. 然后你去就做了**第二次**run()的doSomething1。同样发现**第二次**run()的doSomething1也需要等待.
4. 你跟调度系统说“现在**第二次**run()的doSomething1要等某样东西才能运行了”。调度系统发现所有的任务都需要等待，这时可能就会跟你说“你先歇着，等我号令”。
5. 过了一会调度系统告诉你**第一次**run()的doSomething1好了，快去看看，你做完了**第一次**run()的doSomething1后，就打印了'first.doSomething1 complete'。
6. 接着运行**第一次**run()的doSomething2的时候发现要await。
7. 你又跟调度系统说“现在**第一次**run()的doSomething2要等某样东西才能运行了”。
8. 这时调度系统就会说“呀，**第二次**run()的doSomething1已经等你很久了，快去看看”。
9. 这次你做完了**第二次**run()的doSomething1后，就打印了'second.doSomething1 complete'。由于中间要做的事情很少，所以两条'doSomething1 complete'几乎会同时输出。


这时你注意第2步，所以表面上你在**第一次**run()的doSomething1停住，但实际上他却跑去做**第二次**run()的doSomething1了，所以你认为他等待的时候，他并没有闲着。

这时有人会说，哇，这调度系统好复杂啊。确实很复杂，而且这个调度系统还有个响亮的名字叫“事件循环”，事件循环在浏览器中分了宏微任务，在node.js还不仅仅宏微任务，还为事件循环分了六个阶段，同时一个微小的改动就会让事件循环的结果发生很大变化。比如本人之前写的文章[《又被node的eventloop坑了，这次是node的锅》](https://github.com/zy445566/myBlog/blob/master/20190115node/20190115eventloop/README.md) 可能大家在一些论坛上也看到过。简单的理解就是给需要等待的任务做排序，这里重点不在这里所以就不多说了。

# 那么什么时候是真正阻塞
真正阻塞会让你一直陷在一件事情里面不能自拔，好比上面的代码，我们再做一个修改，如下：
```js
function doSomething1 (time) {
    return new Promise ((reslove)=>{setTimeout(reslove,time)})
}
async function run(mark) {
    await doSomething1(1000);
    console.log(`${mark}.doSomething1 complete`)
    while(true){} // 增加一个死循环
    await doSomething2();
}
run('first') // 第一次调用
run('second') // 第二次调用
```
这时你会发现，只会输出一条'first.doSomething1 complete',为什么呢？假设你还是那个工人还是上面那个故事，就是上面**第5步**之后让你有了做不完的事情，你就会在打印出'first.doSomething1 complete'后就会一直忙，所以没空去去问调度系统了。所以它还是一个人还是一个线程，但是调度系统让他能够做更多不一样的东西了，即更加充分利用资源。当然while(true)类似这种海量计算的写法是不推荐，因为这会真正阻塞js进程，导致事件循环无法继续下去或者让事件循环产生极大延迟，如果存在海量计算推荐是进行分片或者使用WebWorker来做，当然这只是题外话。

所以await和真正阻塞是有本质上的区别。

# 结论：await后并不是傻等
在经历上面的故事后，我们知道在await后并不是傻等，浏览器的其他js代码更不会因为await之后就不执行了。恰恰相反，通过await后的代码不仅仅更美观可读，因为事件循环的关系，它还非常高效了。所以请不要担心使用await会阻塞代码的问题了，谢谢大家。

