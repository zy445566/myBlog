# windows开发烦恼之win10的神器choco
每次接收到windows电脑来做开发就神烦，毕竟每次要装各种软件管理特别混乱，感觉终端在windows中被极大削弱了，同时还有和服务器的环境兼容问题。但还好有WSL来解决环境兼容问题，那么开发环境混乱怎么办，祭出神器choco！

choco是win10自带的！自带的！自带的！包管理工具，有点类似于centos的yum和ubuntu的apt-get，用起来简直不要太爽。

# 后端开发套件一把梭
不用花费数小时去构建开发套件,还不需要关心版本升级，同时也再也不用担心中毒，被迫小窗口送福利了。

安装套件一把梭：
```sh
choco install git.install -y
choco install docker -y
# 指定个nodejs版本
choco install nodejs --version 8.9 -y
choco install mysql -y
choco install redis-64 -y
choco install mongodb.core -y
```

# 其他功能
升级套件：
```sh
choco upgrade nodejs
```
查看安装版本：
```sh
choco info nodejs
```
卸载：
```sh
choco uninstall nodejs
```
查找：
```sh
choco search  nodejs
```
查看已安装的软件：
```sh
choco list
```

# 结语
默认安装路径C:\ProgramData\chocolatey\lib,干净利落简单。


