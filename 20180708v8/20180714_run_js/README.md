# 利用v8引擎实现运行js文件
这篇文章接着上篇文章《[V8的编译实战](https://github.com/zy445566/myBlog/tree/master/20180708v8/20180708_ninjia_v8)》,相信大家根据上篇文章非常简单的实现了v8的编译，这篇文章主要是讲如何基于 利用v8引擎实现运行js文件 。相信从这篇文章之后，大家能认识到实现一个简单的js运行时，并不是很难。每次都讲helloworld，没什么意义，这次参考 <span>shell</span>.cc，写一个js代码执行器。

# 准备 && 配置
上一篇本人的v8源码的路径是/home/zy445566/v8，所以依旧基于这个目录完成代码的构建 <br />
```sh
# 创建自己的代码目录
mkdir -p /home/zy445566/v8/zy_node_src 
# 创建一个用于写代码的路径
touch /home/zy445566/v8/zy_node_src/zy_node.cc 
```
但我们要如何ninja是如何关联编译的呢？因为最新版本的v8默认是是基于gn构建的，所以我们只要修改v8源码目录的BUILD.gn来配置编译关联就行了，编辑v8目录的BUILD.gn并再末尾加上以下代码就好，说明请看注释。OK，那么我们来配置gn吧。<br />
```conf
# 这行表示我们要输出的文件名
v8_executable("zy_node") {
  # 这里表示要编译的代码
  sources = [
    # 这个文件就是我们之前touch的文件
    "zy_node_src/zy_node.cc",
    # 由于原生的console输出方式默认不向命令行中输出
    # 所以我们使用d8的console用于命令的输出
    # 这也是我们要编译的文件
    "src/d8-console.cc",
    "src/d8-console.h",
  ]
  # 默认的配置
  configs = [
    ":internal_config_base",
  ]
  # 这里表示我依赖的组件
  deps = [
    ":v8",
    ":v8_libbase",
    ":v8_libplatform",
    "//build/win:default_exe_manifest",
  ]
}
```
OK，配置上基本是完事了，我们开始直接开始写代码了<br />

# 编码
写在前面,源码请直接参考[zy_node.cc]()

# 编译
因为我们很早就进行了配置，所以这次我们直接编译就好<br />
```
cd v8
ninja -C out.gn/x64.release
```
![ninja_zy_node.png](./ninja_zy_node.png)
不得不说gn的增量编译真的爽，之前编译过的不需要二次编译了。再也不想回到过去的gyp时代了。<br />

# 运行


# 总结
走完这些步骤，相信只要花足够多的时间堆足够的C++组建就可以模仿出一个node.js。但是我认为简单的基于v8开放不一定是好事，v8本质上就是一个js引擎是一个单独的组件，不应该直接基于v8在上面深度的定制和大量写出和v8底层相关的代码。但由于js引擎没有开发开放标准，导致后面的开发者极度容易直接基于v8直接定制，而不是和引擎接入标准挂钩。v8这点应该学习Rtk，做一个开放和中立的js引擎标准！







