# 如何解决多仓库项目的使用问题
最近接手一个老项目，刚刚准备git clone的时候，我人傻了，这个项目大概有十几个子仓库，之前维护的同学告诉我让我一个仓库一个仓库自行git clone下来，然后在依次对每个项目安装依赖，最后放到指定的目录结构再运行起来。

git clone了两个仓库后，我停了下来想到如果每个人都跟着这个方案走，下一个接手的人还要接受这样的痛苦，我认为这是不负责的，所以我决定做一下仓库整合。

## 那如何解决呢？

我的思路是这样的，先使用创建一个主仓库来承载全部的子仓库，然后针对重复依赖安装则使用软链的方式来完成。可能你会觉得这很复杂，但实际上现在已经有很成熟的方法和工具可以来做这些事情了。

## 祭出神器gitmodules
首先创建了一个新的仓库作为主仓库，然后再使用git submodule add 命令添加子仓库，如：
```sh
git submodule add git@git.xxxx.com:xxxx/xxxx.git
```
然后将全部子仓库，都设置完成后，测试一下是否能拉取成功
```sh
git clone --recursive git@git.xxxx.com:xxxx/main.git
```
这里解释一下recursive参数的用途，在我们拉取主仓库的时候，默认是不会拉取子仓库数据的，所以使用recursive来递归拉取子仓库。

这时你可能会发现仓库拉取下来都不是具体的分支名字而不是分支ID，这样的话子模块是无法被提交的，所以你可以使用git submodule foreach来做这件事情。
```sh
git submodule foreach git checkout master
```
git submodule foreach是可以在仓库中运行任意命令，上面的意思是让全部子仓库切换到master分支，你还可以使用其他命令如：
```sh
git submodule foreach ls
```
这里则是让每个子仓库进行ls操作，列出每个子仓库下面的文件名字列表。

OK，走到这里好像所有事情都结束了？
然而并不是，因为我们需要对每个子仓库都进行依赖安装，可能有同学说直接使用git submodule foreach npm install不就好了。当然不行，这些仓库依赖都很重复，如果对每个仓库进行install会极大增加安装依赖的时间。所以我们还需要一样东西。

## 再祭出神器lerna
lerna是什么呢？这个当时是babel团队为了解决babel中多模块发布而推出的一个神器来更好管理monorepo。

那么我们针对多仓库依赖重复安装问题，当然也可以用这把刀来做。

首先我们创建lerna.json,用来标识仓库和子模块，我这边是这样做的，仓库有省略。
```json
{
  "packages": [
    "accidents",
    "crm",
    "dailyReport",
    "mammut",
    "migration",
    "obd",
    "rules",
    "sdkconfig"
  ],
  "version": "1.0.0"
}
```
然后使用使用lerna的依赖安装功能对多个仓库进行依赖安装
```sh
npx lerna bootstrap
```

使用这种方式，就可以当有重复依赖的时候只使用软链的方式来安装依赖，不仅省空间也省时间了，同时lerna有更强大的monorepo管理功能，这里不多说，就请你自己探索了。


## 总结
最后强烈希望大家，在对多仓库使用的时候能尽可能使用submodule来管理再根据实际情况使用lerna做优化，也不是很麻烦，但是对后人维护来说却能够节约很多沟通成本和搭建时间。希望本篇文章能够帮助大家更好地管理多仓库，感谢大家阅读。