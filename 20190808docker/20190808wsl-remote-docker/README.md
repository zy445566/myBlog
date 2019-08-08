# 迫于开始使用windows，但docker还是不能少
由于本人更换公司且公司统一使用windows所以开始使用windows电脑，但unix命令行用习惯了，所以再让我重新用cmd还是powerShell想想还是不太舒服，所以转战wsl，但是一番折腾后居然发现wsl的由于是虚拟环境docker的服务端居然启动不了，但wsl用docker的客户端还是很不错的。所以想想还是在宿主机装个服务端勉勉强强还能在wsl用用，随开始安装。

# win10家庭版给了我一个暴击
docker在windows有两个常用版本一个是docker desktop用的是win自带的hyper-V虚拟的环境，另一个是给没有自带hyper-V的系统用toolbox用virtualbox虚拟的环境。

一开始抱着能用就行的心态用了toolbox版本，但缺点大的我几乎无法忍受，且不说用virtualbox虚拟环境给机器带来的强大负担，更让人无法忍受的是docker命令居然只能在cmd上使用，在powershell都不能用，否则会报这个命令是cmd命令，非cmd不能使用。

忍不了，但win10家庭版没有自带hyper-V不能支持docker desktop，根据教程用命令开启了家庭版的hyper-V，并且修改注册表来改成专业版，但问题来了，只能欺骗低版本的docker desktop不能欺骗高版本的docker desktop，最重要的是低版本的一直会提示升级，真担心我手贱点一下就用不了，最终作为强迫症患者，我选择放弃，送他进我的windows垃圾桶。

# 瞄准了开发机
突然想到喵的，开发机是linux的，利用上面的docker服务不就好了。所以连上开发机。修改服务文件。
```sh
vim /lib/systemd/system/docker.service
```
找到ExecStart这个配置在后面加一个 -H tcp://0.0.0.0:2375
```conf
# 比如我的是 ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
# 然后修改成下面这样，可以既监听本地也可以监听外网端口
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2375 -H fd:// --containerd=/run/containerd/containerd.sock
```
然后重启下服务
```sh
systemctl daemon-reload
systemctl restart docker
```
# 一顿操作猛如虎，看看我的电脑能不能连上
我内网的那台开发机的IP是192.168.1.22,所以感觉试试
```sh
docker -H 192.168.1.22:2375 version # 这里替换成自己的docker服务的IP
```
出现Server的信息就妥了。但又有一个问题就是不可能一直使用 -H 192.168.1.22:2375 太麻烦了。所以用命令设个变量就妥了。
```sh
export DOCKER_HOST=tcp://192.168.1.22:2375 # 如果要开机启动可以加入 ~/.bashrc后source
```

# 使用体验
使用之后爽了，和linux上使用是一毛一样了。缺点就是你构建了docker的image还是启动了容器都不是在本地启动，而是在开发机上启动，不过对我来说也好，毕竟节约资源了。