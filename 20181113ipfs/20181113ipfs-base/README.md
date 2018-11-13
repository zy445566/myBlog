# ipfs基本介绍
由于看到网上大部分IPFS的介绍都十分含糊不清，所以觉得IPFS急需要一个更强力的科普文来介绍IPFS。所以搬了官网的介绍来进行说明。

# 前置知识

用磁力链开过车的老司机都知道，只要在下载器里面输入磁力链链接，不管这个磁力链的文件在“某个老司机的电脑”里，下载器都能够嗅探并下载下来，同时你也会成为这个文件的“某个老司机的电脑”。

这是P2P(不是借钱跑路的P2P)网络传输的一种模式，即所有的机器都是对等关系，即是服务器又是客户端，且无主从之分，是一种非中心化的分布式网络。(或许这已经是趋势了)

当然IPFS也不仅仅就是这样。

# 今天互联网存在什么问题，IPFS能带来什么样的改变

## HTTP效率低且成本高

![ipfs-illustration-http.svg](./ipfs-illustration-http.svg)

HTTP重复从一个中心节点下载文件，而不是同时从多个节点上获取文件。然而视频传输，通过P2P方法可以节省60％的带宽成本。

IPFS可以高效地分发大量数据。零重复意味着节省存储空间。

## 每天都会删除的历史

![ipfs-illustration-history.svg](./ipfs-illustration-history.svg)

网页的平均寿命为100天。还记得GeoCities(最早一批提供个人主页服务的网站,后来关闭，导致大量用户资料丢失)吗？一旦中心节点不再存在，我们这个时代的主要媒介就会土崩瓦解，这还不够好。

IPFS保留了文件的每个版本，并使设置弹性网络以便镜像数据变得简单。

## 网络的中心化造成了垄断

![ipfs-illustration-centralized.svg](./ipfs-illustration-centralized.svg)

互联网一直是人类历史上最伟大的均衡器之一，也是真正的创新加速器。但互联网垄断总是相对简单。

IPFS仍然忠实于开放式和扁平化网络的最初愿景，但提供了使该愿景成为现实的技术。

## 我们的应用程序过于依赖中心节点

![ipfs-illustration-network.svg](./ipfs-illustration-network.svg)

中心节点在开发中,断线,自然灾害,间歇性连接。与星际网络系统(IPNS)相比，所有这些都是微不足道的。在我们使用的网络是20世纪，我们可以做得更好。

IPFS支持创建具有多种弹性的网络，无论是否具有Internet骨干网连接，都可实现持久可用性。

# IPFS的工作原理
1. 每个文件及其中的所有块都被赋予一个称为加密哈希的唯一指纹

![ipfs-illustrations-how-1.svg](./ipfs-illustrations-how-1.svg)

2. 消除了网络上的重复文件。

![ipfs-illustrations-how-2.svg](./ipfs-illustrations-how-2.svg)

3. 帮助每个网络节点仅存储它感兴趣的内容，以及一些索引信息，确定存储内容。

![ipfs-illustrations-how-3.svg](./ipfs-illustrations-how-3.svg)

4. 当你查找文件时，你会通过唯一的哈希值在存储文件的节点上查到文件。

![ipfs-illustrations-how-4.svg](./ipfs-illustrations-how-4.svg)

5. 每个文件都可以使用名为星际网络系统(IPNS)的分散命名系统，保证可通过人类可读的名称找到。

![ipfs-illustrations-how-5.svg](./ipfs-illustrations-how-5.svg)

# 学习更多内容
* [下载一个ipfs桌面客户端(支持win，mac，linux)](https://github.com/zy445566/ipfs-desktop/releases)
* [了解IPFS的基础知识以及启动和运行中文指南](https://github.com/zy445566/ipfs-doc-zh/blob/master/README.md)
* [针对docker的ipfs服务](https://github.com/zy445566/ipfs-docker)
