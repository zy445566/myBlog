# nodejs面向指针编程
### 我们可以用指针读取node数据啦(宏观)
第一步肯定是
```sh
npm install type-pointer
```
接下来
```js
const TypePointer = require('type-pointer');

let typePointer = new TypePointer(); //先把包new一下
var obj1 = {a:1,b:2,c:()=>{return a+b;}}; //定义一个值，你可以用任意的值包括数字等等

var addr = typePointer.mallocValueAddr(obj1); //这里可以开辟空间，并把对象放入开辟的空间
console.log(addr); //0x102709430

var obj2 = typePointer.readValueByAddr(addr); //这里可以把该地址的js对象读出来，当然你也可以读该程序段内所有的虚拟地址，但这很危险

var obj3 = {d:4};
typePointer.writeValueByAddr(addr,obj3); //这里可以重新写入对象,同时会释放之前的值在heap中的数据，但开辟的空间会保留
var obj4 = typePointer.readValueByAddr(addr); //再次读出地址的对象

typePointer.freeValueByAddr(addr);//但由于对象一直处于占用内存的状态下，所以我们可以及时释放，否则会一直保持
```
关于这个小项目，我想我可以回答一下之前提出的问题了<br />
[https://cnodejs.org/topic/5ab60ba7320bb09d69e231b1](https://cnodejs.org/topic/5ab60ba7320bb09d69e231b1)<br />

### 其一
就这道题而言，可以说至少通过C语言很难拿到真实地址<br />
因为每个应用程序为了保证互不干扰，所有系统会为每个进程分配一个虚拟内存（或叫逻辑内存）。<br />
包括C语言的取地址符&都是取的虚拟内存，<br />
而你要拿到物理内存的话，要通过 段选择符 计算出虚拟内存的偏移量<br />
再通过段选择符在LDT（本地描述符表）或GDT（全局描述符表）取出段描述符，<br />
再用段描述符加上偏移量，计算出线性地址。<br />
其实在这步就成功了，因为有指针访问线性地址的时候系统会自动计算内存分页指向物理地址。<br />
有兴趣可以看《汇编语言 基于x86处理器》的十一章，x86存储管理，上面有详细说明<br />
嘿嘿，而且大量变量的内存地址在编译期就确定了，虽然这很难让人相信。<br />

### 其二
关于V8的内存回收，其实V8的内存管理在C中，
是使用Handle（句柄）和 HandleScope（句柄域，自己理解有点像js的作用域的意思，但本质是一个栈）来管理Heap的数据<br/>
也就是说V8他自己实现了一套内存管理在heap中，没用直接使用malloc和free，所以这应该就是--max-new-spaace-size和--max-old-spaace-size的根本原因吧（猜测，请大神指正）<br/>
而由于heap经常要进行from内存到to内存的变换，所以每个数据的指针具有不确定性，所以需要通过Handle来访问。而Handle是什么东西呢？就类似于Heap的指针。<br/>
大家应该知道其实函数的调用都是存在栈里面的，同理Handle也是存在栈里面的，当然也有不是在栈里面的，这个栈在v8里面叫HandleScope，所以Handle一旦出栈，那么Handle指向的Heap数据，在下一次CG里面就可以被回收。<br/>
而Handle又有多种类型如Local和Persistent两种，Local是存在栈里面的，在调用出了HandleScope就会被释放调，而Persistent则可以逃出释放的厄运,但容易内存泄漏。

### 总结
所以我恰巧犯了这两个错误，Local和逻辑地址的错误，导致取不到v8数据的问题。

### 顺便说一下
rust目前也可以和nodejs混写了[地址](https://github.com/zy445566/node-rust-jit#example)，虽然觉得意义不是很大，因为rust只所以能获得高效的性能其实很大程度取决于编译期的运算，这个东西类似于js的prepack。所以如果要获取rust的最大性能写rust扩展的意义不是特别大，因为你写扩展的本身就会注意性能问题，其次是范围很小，rust的优化器，基本很难施展，除非你这个扩展是高GC扩展，不过有兴趣的同学还是可以尝试一下。



