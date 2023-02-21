# 警惕Linux发行版危机和即将或已经发生的重大影响
起因是Node.js的开发者提出要升级Node.js镜像版本，原因是Node.js16由于OpenSSL 1.1.1停止维护即将于今年9月份提前停止维护,具体可参考[Node.js16停止维护声明](https://nodejs.org/en/blog/announcements/nodejs16-eol/)，也就意味着我们至少要着手准备Node.js18及以上的镜像了。本以为升个版本也就是改个版本号的事情，但接下来发生的事情足以摧毁一个公司的基建系统。

# 0x1 祸起，事情不是那么简单
由于大部分公司的系统都是基于CentOS，我们桔厂也是一样，所以我这边首先通过Node.js官网下载最新的Node.js18的CentOS的二进制包,同时打入镜像进行构建，一切都非常顺利，原以为和16一样改个版本号就结束工作，但是直到运行node后，却发生这样的报错。
```sh
sh-4.2# node
node: /lib64/libm.so.6: version `GLIBC_2.27' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.25' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by node)
node: /lib64/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.21' not found (required by node)
```
也就是说C++库版本不对，赶紧查看一下GLIBC版本
```sh
sh-4.2# ldd --version
ldd (GNU libc) 2.17
Copyright (C) 2012 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
Written by Roland McGrath and Ulrich Drepper.
```
这时候首先做的是使用使用yum升级版本，发现这已经是目前最高可用版本。

也就意味着CentOS7，已经无法自动升级，也就意味着只有手动升级GLIBC版本，如果不使用SCL，了解的同学就知道这意味着什么，如果成功无疑等价于你实现了CentOS7的一个新的发行版！

单独升级GLIBC里面很多坑，升级了会导致很多依赖不兼容。

再看来一眼Node.js的issue很早有人开始提出恢复LTS版本在CentOS7的构建，[点击查看](https://github.com/nodejs/node/issues/43246)，但貌似官方也没有一个肯定的回复，就目前的结果来看，并没有恢复。


或许这就是最早的蝴蝶开始煽动翅膀了，危机开始扩散。

# 0x2 尝试升级CentOS
那基本只剩一条路直接升级系统，首先升级到了CentOS8发现，yum直接作废。

也就是说CentOS8提供的yum服务直接关闭，看了一眼[官方公告（点击可查看）](https://www.centos.org/centos-linux-eol/)，才知道CentOS8在2021年12月31日就已经停止了维护。

取而代之的是Stream版本，但是这个版本就相当于是Red Hat的beta版本，换句话来说新版本的坑先让CentOS的Stream先趟一遍，这还不算，哪怕你说服了自己，算了升级Stream版本，Docker也不给你机会了。[笑哭]

在docker的[CentOS官方镜像详情（点击可查看）](https://hub.docker.com/_/centos)中的开头就有下面一段话。

```
This image is no longer supported/maintained (non-EOL tags last updated November 16, 2020, docker-library/official-images#9102; see also https://www.centos.org/centos-linux-eol/ and docker-library/docs#2205). Please adjust your usage accordingly.
```
什么意思呢？简单来说就是docker的官方CentOS镜像作废。

这意味着什么？

这已经不是风险开始萌芽了，而是风险即将爆发了！

目前来看最优解只能缓慢从CentOS切换到其它的Linux发行版上。而切换到另一个Linux发行版很多基于CentOS镜像中的脚本几乎要全部进行迁移，这无疑是一个大的工作量，但我们却又不得不做，因为这是一个真正的系统性风险，一旦风险彻底暴露，等价于你裸体站在所有人面前。

# 0x3 如何选择

去掉收费的Linux系统不考虑，目前来看Debian和rockylinux，都是主要可选项。

缺点是rockylinux推出的时间不是很长，Debian的话需要迁移大量初始化脚本和代码。

如果出于成本考虑选rockylinux，如果是出于长期性考虑，我选Debian因为品牌久远一点同时几乎没有撂挑子的可能性，如果撂挑子了身为高知名度的ubuntu几乎可以平滑接盘,而rockylinux接盘侠就只能回到最初的起点了。

# 0x4 最后的警报
其实很早CentOS的停止维护危机就已经出现，但是之前没有产生实际的影响，但是目前CentOS7的停止维护日期即将到来，已经开始产生切实的影响了，我觉得是时候拉响警报了。

这是一个技术人在风暴来临前发起的警报！请注意！请注意！请注意！


