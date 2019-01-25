# 编译deno，deno结构解析
deno在我不被重视技术列表中，但在github的年度开源star榜单上，斩获年度第四。让我不得不思考为什么deno能广受好评，我想我需要刨开deno看看了。

# 编译
为什么不能直接解刨，呃。。。这和我的习惯有关系，我喜欢先编译，并一步一步调试，毕竟源码是不可能骗人的，再加上我喜欢魔改的臭习惯。废话不多说，开搞。

`本次编译在mac上进行，其他系统可能不是很适应`

步骤如下：
1. 安装rust，并注意安装nightly的rust。

为什么要安装nightly的rust？这个原因可以说是作者比较激进，有很多地方使用了实验性特性，导致有些地方编译的时候正式版的特性还不足以支持。在这点基础上，我认为作者也是将deno定位激进的先进产品，或许这点我敢苟同。。。


安装rust，并用rust的版本控制器使用rustup切换到nightly,rustup可以理解为node的nvm。

命令如下：
```sh
curl https://sh.rustup.rs -sSf | sh
rustup install nightly
rustup default nightly
```

2. 安装Xcode打开，同意一下各种不平等条款，再运行运行一下，并切换到当前的Xcode版本。

命令如下：
```sh
sudo xcode-select -s /Applications/Xcode.app
```

3. 准备工作基本完成了，接下来需要克隆仓库了

`注意`：这里必须使用--recurse-submodules参数，原因是deno将多个仓库作为了子模块进行开发，包括deno_std和third_party等等。
```sh
git clone --recurse-submodules https://github.com/denoland/deno.git
```

4. 使用工具安装第三方依赖
感觉这一步就是单纯实现的懒人神器功能。

`注意`:这里必须开启终端翻墙，否则会失败，因为这里会同步谷歌源代码管理中心的数据，包括v8的同步，很重要！
```sh
cd deno
./tools/setup.py
```

5. 编译
编译就是漫长的等待了
```sh
cd deno
./tools/build.py # 如果要构建release，请DENO_BUILD_MODE=release
```
直到输出:
```
ninja: Entering directory `/xxx/xxx/deno/target/debug'
```
到这里就成功了，你可以直接在/xxx/xxx/deno/target/debug中运行一下
```sh
cd deno
cd ./target/debug 
./deno #如果出现REPL交互就成功了
```

# 目录解析
```sh
/build # 存储v8构建的配置，最后软链到/third_party/v8的目录中
/build_extra # 存储一些deno的构建配置
/buildtools # 顾名思义，一些构建工具，最后软链到/third_party/v8的目录中
/js # 这就是一些用js写的一些源码，这点和node的js部分有点像，只不过改成用ts写了
/libdeno #  我认为这是一个桥接v8和rust的适配器代码
/node_modules # 给/js文件夹装的一些依赖，软链到/third_party的目录中
/prebuilt # 因为切换到gn了，所以需要一些是否构建的检查，顾名思义，预构建的一些文件，都是自己生成的
/src # rust代码。像fs，http都在这里实现，就是实现一些浏览干不了的事情
/target # 编译后的文件，分debug和release，玩过rust的就知道，编译release比较久，因为编译器要做代码折叠
/testing # v8的测试用例，软链到/third_party/v8的目录中
/test # deno的测试用例
/third_party # 第三方依赖如flatbuffers和v8等等
/tools #各种杂七杂八的脚本，比如用于构建代码和检查代码格式等等。
/website #deno的官方网站
```
针对目录解析，可能大家会有几个问题：
* 问题1:为什么要一个libdeno做rust的桥接器？
    * 因为V8是C++写的，同时V8很多自己的结构，那么你要rust要较好的使用，你就必须写一个桥接器来让rust和V8能购相互调用。
* 问题2:为什么要用rust而不像node一样，直接在v8上累代码？
    * 因为这样可以减少对V8的依赖，比如V8底层一变，上层就需要大变，这样对运行时开发者来说无疑是心智负担。
* 问题3:那么这样deno做对我们什么好处呢？
    * 对于普通开发者：1.deno其实设计就是想趋于浏览器，那么比如像node的require这种全局变量本身其实就不应该存在的，因为浏览器中没有这样的全局变量，且这种全局变量还会造成很大的安全问题，所以要解决这个问题，但又要可以操作文件和http等操作，解决途径就是不暴露这样的全局变量，将deno做为一个import可以引进来的库，这样既可以和浏览器趋同，又不会暴露全局。2.抹平了大部分和浏览器的区别，比如相同代码在浏览器和运行时的结果不同，同时更加兼容，移植JS更加方便。
    * 对于运行时开发者：1.抛弃了gyp使用了gn，改一行代码再也不用全量编译了。2.V8引擎的修改，再也不需要牵一发而动全身了。3.一句话总结就是降低了开发者的心智负担。

# 结语
这篇文章作为deno的先导篇，有机会还会在写，但不保证这不是最后一篇。deno确实有很多优势，这也让我改变了一些对它的评价，但作为一个划时代的产品，我认为多少还是差了一点意思，只能说期待deno更亮眼的功能吧。

重点:deno是可以运行js的！deno是可以运行js的！deno是可以运行js的！重要的事情说三遍。所以完全不用担心deno会抢node饭碗，如果是普通开发者，学习deno的成本，认为和学习一个库的成本差不多，所以不用过度担心，且deno在生产环境溜一溜的结果也未可知，等待deno什么GA，期待deno在生产环境的结果吧。