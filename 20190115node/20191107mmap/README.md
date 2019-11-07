# 如何使用node.js实现内存共享
这篇文章的起因是因为一道node.js面试题，面试官问“内存共享有哪些方式?”，我说我就只记得socket和信号量了。他说少了，还有一种内存共享叫 “内存映射”，我在想不会是mmap吧。但想了想万一装逼失败是要扣分的，我就说我不太清楚。但是他貌似不死心想进一步提醒我说，那你知道socket为什么慢和socket的本质是什么？我当时就在想“linux万物皆文件”，不会是想让我说mmap是映射内存到文件实现文件共享，如果socket走文件也能比网络少几次拷贝吧，想想算了，没把握。匆匆说了个“套接字”结束，想想套接字也有点这个意思。事后一查，果然如我所料，但这一块细节一问一定爆炸，还好这波没装。算了算了，说正事，如何使用node.js实现内存共享。

# 使用C扩展来搭建贡献内存的桥梁
首先mmap不是node.js的方法，是C语言中的方法，那么比如要开启node.js的C扩展，看到n-api做了一些升级，那就开始用n-api来做这个事情吧。首先node-gyp是不可避免的，n-api的好处是不需要使用nan作为库了，所以binding.gyp简单了很多,但这不是重点，实现核心代码才是重点。

我们要实现两个不同进程的内存共享有一点很重要就是桥梁。在系统设计中，进程和进程的内存空间是绝对相互分割的，所以要共享内存肯定不能是侵入别人的进程中去读取，而是通过桥梁，之前说过了“linux万物皆文件”，所以文件就当然是可以作为内存共享的桥梁。通过桥梁再用mmap映射到自己进程的内存栈中。核心代码如下：
```cpp
#define SHARE_PATH "share-data"
long get_share_adress(size_t min_size,int is_init=0) {
  int open_type = O_RDWR|O_EXCL;
  int fd = open(SHARE_PATH, open_type, 0777);
  if(fd<0) {return fd;}
  struct stat st;
  if((fstat(fd, &st))<0){return -1;}
  size_t mmap_size = st.st_size | min_size;
  char* mmap_ptr = (char *)mmap(NULL, mmap_size, PROT_READ| PROT_WRITE, MAP_SHARED, fd, 0);
  close(fd);
  return (long)mmap_ptr;
}
```
那么打通了这个桥梁，那么就可以实现一个读取的方法和一个写入的方法。其实这个就比较简单了，无非就是查查n-api的文档了。话又说回来，n-api真的的不错，比nan的写法精简了很多，可以说是粉了，如下：

```cpp
// 读取共享内存数据方法
napi_value readMethod(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t min_size = 1024;
  char* mmap_ptr = (char* )get_share_adress(min_size);
  napi_value read_string_data;
  status = napi_create_string_utf8(env, mmap_ptr, min_size, &read_string_data);
  assert(status == napi_ok);
  return read_string_data;
}
```
```cpp
// 写入共享内存数据方法
napi_value writeMethod(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 1;
  napi_value args[argc];
  status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  assert(status == napi_ok);
  size_t min_size = 1024;
  char* mmap_ptr = (char* )get_share_adress(min_size);
  size_t* result = nullptr;
  status = napi_get_value_string_utf8(env,args[0],mmap_ptr,min_size,result);
  assert(status == napi_ok);
  return createInt(env, (long) result);
}
```

# 写两个JS来测试一下
为什么要写两个，当然一个是不断的读，然后另一个写。再看另一个读取是否有变化:
* 用来读取的方法
```js
// shareRead.js
const shareObject = require('bindings')('shareObject');
// 初始化数据
shareObject.write('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
setInterval(() => {
    console.log(shareObject.read())
}, 1000);
```
* 用来写入数据的方法
```js
// shareWrite.js
const shareObject = require('bindings')('shareObject');
shareObject.write('Hello World!');
```
那么打开终端A运行shareRead.js，再打开终端B再运行shareWrite.js，你就可以看到A原本空白的打印出现了Hello World!，至此共享内存完成。

# 总结
除此之外父子进程还可以用匿名映射。上文例子每次读取和写入和进行了文件读取和重新内存映射，但在真实的场景中往往是需要省略的，但为了更容易阅读和理解，所以本文使用了这种方式。还有就是这种内存共享方式由于没有锁，可能会导致现代计算机CPU的cache和内存数据结果不一致问题，在实际使用中需要注意。其次在V8引擎中，如何共享数据堆栈是值得考虑的，因为v8的Value本质上只是一个指向数据堆栈的指针，而且这也是V8不推荐的，因为那样就不是每个进程相互独立初始化上下文而是载入上下文了。

本文代码地址:[20190115node/20191107mmap/share-object](https://github.com/zy445566/myBlog/blob/master/20190115node/20191107mmap/share-object)