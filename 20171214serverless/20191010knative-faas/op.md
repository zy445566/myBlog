# 个人快速搭建serverless快速指南（建设中，目前只记录一些操作）
https://multipass.run/#install
```sh
# 这里的话最好分配双核和4G内存，否则将不够，如果配置高可以适当多分配
multipass launch --name ubuntults -c 2 -m 2G
multipass exec ubuntults bash
# 进入后如果需要代理则需要获取宿主机的地址进行代理
# 比如我在宿主机内网ip192.168.64.1
# 那么代理是export http_proxy=http://192.168.64.1:1087;export https_proxy=http://192.168.64.1:1087;
```

针对ubuntu18.04版本安装
```sh
sudo apt-get update
sudo apt-get install snapd -y
```

microk8s
```sh
sudo snap install --classic microk8s
sudo snap alias microk8s.kubectl kubectl
```
k8s.gcr.io被墙问题后续还有knative的gcr.io被墙问题，这里就别想了，加了sha，要挪过来实在太麻烦
/var/snap/microk8s/current/args/文件夹所有toml后缀的文件的k8s.gcr.io替换为mirrorgooglecontainers，然后重启containerd.service
sudo sed -i 's/k8s.gcr.io/mirrorgooglecontainers/g' `sudo grep -rl  --include="*.yaml" --include="*.toml"  "k8s.gcr.io"  /var/snap/microk8s/current/args/`
sudo microk8s.reset # 这里可以多重置几次直到提示服务重启完成
:%s/k8s.gcr.io/mirrorgooglecontainers/g
<!-- sudo systemctl restart snap.microk8s.daemon-containerd.service -->
sudo microk8s.restart
安装个dashboard方便可视化看数据
```sh
sudo microk8s.status
sudo microk8s.enable dns
sudo microk8s.kubectl -n kube-system edit configmap/coredns 
# 编辑 forward . 223.5.5.5 223.6.6.6，换阿里云dns，因为8.8.8.8是谷歌的会导致无法访问
# vim:%s/8.8.8.8\ 8.8.4.4/223.5.5.5\ 223.6.6.6/g
echo '#!/bin/bash
namespace=${1-"kube-system"}
for podname in $(sudo microk8s.kubectl -n $namespace get -o=name pod)
do
    mkdir -p $(dirname $podname)
    echo $(basename $podname)
    sudo microk8s.kubectl -n $namespace get pod  -o yaml $(basename $podname) > $podname.yaml
    sed -i "s/k8s.gcr.io/mirrorgooglecontainers/g" $podname.yaml
    sudo microk8s.kubectl  -n $namespace replace -f $podname.yaml
done' > replace_mirror.sh
sh replace_mirror.sh
sudo microk8s.kubectl cluster-info
cat /snap/microk8s/current/basic_auth.csv # 获取账号密码password,user,uid,"group1,group2,group3"
sudo microk8s.config # 获取登陆密码,注意最好拷贝出来看看不然容易拷贝错误
sudo kubectl get pods --all-namespaces
sudo microk8s.kubectl -n kube-system get pod # 看status，dashboard有没有正常启动
sudo microk8s.kubectl -n kube-system describe pod coredns # 看描述是否报错
sudo microk8s.kubectl -n kube-system get secret | grep default-token | cut -d " " -f1 # 获取token
sudo microk8s.kubectl -n kube-system describe secret default-token-djlf8 # default-token-djlf8是从上条命令获取的，每个人不一样
```
打开链接选择token登陆，使用上面显示的token
https://{你的IP}:16443/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/


查看是否安装成功
```sh
sudo microk8s.kubectl get nodes
sudo microk8s.kubectl get services
```
安装Knative
```sh
echo 'N;' | sudo microk8s.enable knative
```
查看是否安装完成
```sh
sudo kubectl get pods -n knative-serving
sudo kubectl get pods -n knative-eventing
sudo kubectl get pods -n knative-monitoring
```
// 开启rbac强行给匿名用户赋权超级管理员
  sudo kubectl create clusterrolebinding anonymous-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:anonymous

  sudo kubectl create clusterrolebinding unauthenticated-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:unauthenticated

  sudo kubectl delete clusterrolebinding anonymous-cluster-admin unauthenticated-cluster-admin