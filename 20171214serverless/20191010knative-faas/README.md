# 个人快速搭建serverless快速指南（建设中，目前只记录一些操作）
针对ubuntu18.04版本安装
```sh
sudo apt-get update
sudo apt-get install snapd -y
```

microk8s
```sh
sudo snap install --classic microk8s
```
k8s.gcr.io
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
