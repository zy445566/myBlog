# 个人快速搭建serverless快速指南（建设中，目前只记录一些操作）
针对ubuntu18.04版本安装
```sh
apt-get update
sudo apt-get install docker.io
apt-get install snapd
```
会遇到的问题k8s.gcr.io翻墙问题，提前拉，如果已翻墙可忽略
```sh
docker pull mirrorgooglecontainers/kube-apiserver-amd64:v1.11.3
docker pull mirrorgooglecontainers/kube-controller-manager-amd64:v1.11.3
docker pull mirrorgooglecontainers/kube-scheduler-amd64:v1.11.3
docker pull mirrorgooglecontainers/kube-proxy-amd64:v1.11.3
docker pull mirrorgooglecontainers/pause:3.1
docker pull mirrorgooglecontainers/etcd-amd64:3.2.18
docker pull coredns/coredns:1.1.3
docker tag docker.io/mirrorgooglecontainers/kube-proxy-amd64:v1.11.3 k8s.gcr.io/kube-proxy-amd64:v1.11.3
docker tag docker.io/mirrorgooglecontainers/kube-scheduler-amd64:v1.11.3 k8s.gcr.io/kube-scheduler-amd64:v1.11.3
docker tag docker.io/mirrorgooglecontainers/kube-apiserver-amd64:v1.11.3 k8s.gcr.io/kube-apiserver-amd64:v1.11.3
docker tag docker.io/mirrorgooglecontainers/kube-controller-manager-amd64:v1.11.3 k8s.gcr.io/kube-controller-manager-amd64:v1.11.3
docker tag docker.io/mirrorgooglecontainers/etcd-amd64:3.2.18  k8s.gcr.io/etcd-amd64:3.2.18
docker tag docker.io/mirrorgooglecontainers/pause:3.1  k8s.gcr.io/pause:3.1
docker tag docker.io/coredns/coredns:1.1.3  k8s.gcr.io/coredns:1.1.3

```

microk8s
```sh
sudo snap install --classic microk8s # 已翻墙直接使用最新版，只使用docker的组件containerd
# snap install microk8s --classic --channel=1.13/stable
```
安装个dashboard方便可视化看数据
```sh
sudo microk8s.status
sudo microk8s.enable dns dashboard
microk8s.kubectl -n kube-system edit configmap/coredns 
# 编辑 forward . 223.5.5.5 223.6.6.6，换阿里云dns，因为8.8.8.8是谷歌的会导致无法访问
sudo microk8s.kubectl cluster-info
cat /snap/microk8s/current/basic_auth.csv # 获取账号密码password,user,uid,"group1,group2,group3"
microk8s.kubectl -n kube-system get pod # 看status，dashboard有没有正常启动
microk8s.kubectl -n kube-system describe pod 
microk8s.kubectl -n kube-system get secret | grep default-token | cut -d " " -f1 # 获取token
sudo microk8s.kubectl -n kube-system describe secret default-token-sfj9q # default-token-sfj9q是从上条命令获取的，每个人不一样
```



查看是否安装成功
```sh
sudo microk8s.kubectl get nodes
sudo microk8s.kubectl get services
```
