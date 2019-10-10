# 个人快速搭建serverless快速指南（建设中，目前只记录一些操作）
针对ubuntu18.04版本安装
```sh
sudo apt-get update
sudo apt-get install snapd -y
```

microk8s
```sh
sudo snap install --classic microk8s # export PATH=$PATH:/snap/bin/
```
k8s.gcr.io被墙问题
/var/snap/microk8s/current/args/文件夹所有toml后缀的文件的k8s.gcr.io替换为mirrorgooglecontainers
sed -i 's/k8s.gcr.io/mirrorgooglecontainers/g' `grep -rl  --include="*.yaml" --include="*.toml"  "k8s.gcr.io"  /snap/microk8s`
:%s/k8s.gcr.io/mirrorgooglecontainers/g
sudo systemctl restart snap.microk8s.daemon-containerd.service
安装个dashboard方便可视化看数据
```sh
sudo microk8s.status
sudo microk8s.enable dns dashboard
microk8s.kubectl -n kube-system edit configmap/coredns 
# 编辑 forward . 223.5.5.5 223.6.6.6，换阿里云dns，因为8.8.8.8是谷歌的会导致无法访问
# vim:%s/8.8.8.8\ 8.8.4.4/223.5.5.5\ 223.6.6.6/g
sudo microk8s.kubectl cluster-info
cat /snap/microk8s/current/basic_auth.csv # 获取账号密码password,user,uid,"group1,group2,group3"
sudo microk8s.config # 获取登陆密码
microk8s.kubectl -n kube-system get pod # 看status，dashboard有没有正常启动
microk8s.kubectl -n kube-system describe pod # 看描述是否报错
microk8s.kubectl -n kube-system get secret | grep default-token | cut -d " " -f1 # 获取token
sudo microk8s.kubectl -n kube-system describe secret default-token-djlf8 # default-token-djlf8是从上条命令获取的，每个人不一样
```
打开链接选择token登陆，使用上面显示的token
https://{你的IP}:16443/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/


查看是否安装成功
```sh
sudo microk8s.kubectl get nodes
sudo microk8s.kubectl get services
```
