# 个人搭建serverless架构快速指南
之前我们都是基于云服务商的serverless来做服务的，但是存在一个问题，不够标准化，即每个云服务商都可能有自己的一套方案，最近在看knative，发现是一套不错的标准化方案，所以个人搭建来尝尝鲜。

# 准备工作
如果我们只有一台机器的话，则需要一台相对较好的机器或工作站，如果自己有三台以上的机器则相对“舒适”。目前本人以一台机器搭建集群的方式来构建基于knative的serverless服务。

我们可以使用轻量的虚拟服务工具[multipass](https://multipass.run/#install)来方便的模拟集群服务。 我这里使用multipass运行了一个master和两个slave，都是分配了双核CPU和2G运行内存(所以您的机器至少还有8G空闲内存)，如下：
```sh
multipass launch --name m1 -c 2 -m 4G
multipass launch --name s1 -c 2 -m 2G
multipass launch --name s2 -c 2 -m 2G
# 这一步可以虚拟机是否启动
multipass list 
```
同时分别给下面的机器都安装microk8s，我这里就示范一下master的安装过程，两个slave的安装步骤类似，如下：
```sh
# 这一步进入master节点
multipass exec m1 bash 
# 安装microk8s,慢的话可以重试，它会自动切换节点
# 当前目前最新的microk8s版本是v1.16.0
sudo snap install --classic microk8s 
# 设置一下命令行的别名
sudo snap alias microk8s.kubectl kubectl 
# 退出主节点
exit
```
安装好了microk8s 先不要着急，我们还要做一些工作，这里您可以选择走代理容器仓库或者在虚拟服务中打开翻墙。
* 翻墙方案
```sh
# 进入后如果需要代理则需要获取宿主机的地址进行代理
# 比如先在宿主机终端代理ip不要绑定127.0.0.1而是0.0.0.0，这样同局域网其它机器才能访问
# 比如我在宿主机内网ip192.168.64.1
# 那么在每个虚拟服务代理命令是：
export http_proxy=http://192.168.64.1:1087;export https_proxy=http://192.168.64.1:1087;
# 然后修改代理
sudo vim /var/snap/microk8s/current/args/containerd-env
# 增加HTTPS_PROXY=http://192.168.64.1:1087
# 完成后重置下服务，这里可以多重置几次直到提示服务重启完成
sudo microk8s.reset 
# 这里注意看看虚拟服务是否翻墙成功
curl google.com
```
* 代理容器仓库方案
```sh
# 因为k8s.gcr.io被墙了，如果不方便使用代理
# 可以先把对应的容器images放到自己私库中
sudo sed -i 's/k8s.gcr.io/{这里替换成你自己的私库地址}/g' `sudo grep -rl  --include="*.yaml" --include="*.toml"  "k8s.gcr.io"  /var/snap/microk8s/current/args/`
# 完成后重置下服务，这里可以多重置几次直到提示服务重启完成
sudo microk8s.reset 
```
# 设置主从服务
我这里只展示master和slave1节点的的主从设置，如果要设置slave2节点，请重复下面的步骤，如下：
```sh
# 进入master节点
multipass exec m1 bash 
# 设置为k8s的master节点
sudo microk8s.add-node 
# 这里第一行会输出Join node with: microk8s.join .....
# 然后复制这一行
# 不是其它行的，不要搞错了
# 退出主节点
exit
# 进入slave1节点，如果要进slave2，则为s2
multipass exec s1 bash 
# 下面这行是我主节点输出的，你们的是不一样的
sudo microk8s.join 192.168.64.3:25000/bBhVYWpAEdgVdzchAidRMHbqRzevXXEt
# 退出slave1节点
exit
```
查看节点是否完成，如下：
```sh
sudo microk8s.kubectl get no
# 输出如下：
NAME           STATUS   ROLES    AGE     VERSION
192.168.64.4   Ready    <none>   3m35s   v1.16.0
192.168.64.5   Ready    <none>   2m38s   v1.16.0
m1             Ready    <none>   22m     v1.16.0
```
到这里主从设置就完成了，如果机器好的话建议最后设置主从，毕竟分布后没有单机方便调试了。

# 开启k8s的dns服务
```sh
sudo microk8s.enable dns
```
由于默认dns的上游是8.8.8.8是谷歌的dns服务，我们可能链接不上，所以修改成阿里云的吧,如下:
```sh
# 输入<英文>冒号(:)，后粘贴下面 
# %s/8.8.8.8\ 8.8.4.4/223.5.5.5\ 223.6.6.6/g 
# 按回车就能一键修改了
sudo microk8s.kubectl -n kube-system edit configmap/coredns 
# 这个vim编辑器，然后:wq 保存并退出就好
```
然后看服务是否正常runing
```sh
sudo microk8s.kubectl get pods --all-namespaces
```
如果有问题则看看是什么问题引起的,比如镜像是否下拉正常，代理是否成功，并解决
```sh
sudo microk8s.kubectl -n kube-system describe pod coredns 
```
解决删除coredns，它会自动重启个新的
```sh
# coredns-xxxxx-xxxxx是你那个容器的名字和后缀，每个不一样
sudo microk8s.kubectl -n kube-system delete pod coredns-xxxxx-xxxxx
```
直到这样才算成功
```sh
multipass@m1:~$ sudo microk8s.kubectl get pods --all-namespaces
NAMESPACE     NAME                      READY   STATUS    RESTARTS   AGE
kube-system   coredns-9b8997588-chwbr   1/1     Running   0          4m8s
```
# 开启istio服务
```sh
echo 'N' | sudo microk8s.enable istio
# 最后会输出Istio is starting就部署成功了
```
但是还是要看服务是否都启动
```sh
sudo microk8s.kubectl get pods --all-namespaces
```
这里有些istio老是健康检查失败，我觉得是microk8s的BUG,可能是重启容器后kubelet未启动导致
```sh
sudo snap stop microk8s
sudo snap start microk8s
```
注意这里可能会重置dns的配置,重新改下就好
```sh
# 输入<英文>冒号(:)，后粘贴下面 
# %s/8.8.8.8\ 8.8.4.4/223.5.5.5\ 223.6.6.6/g 
# 按回车就能一键修改了
sudo microk8s.kubectl -n kube-system edit configmap/coredns 
# 这个vim编辑器，然后:wq 保存并退出就好
```
# 开启knative服务
```sh
echo 'N' | sudo microk8s.enable knative
# 最后会输出Knative is starting就部署成功了
```
可能会停留在这里，没关系，多等一下就好了.这是因为istio没有启动完全，启动完全就好了
```sh
The connection to the server 127.0.0.1:16443 was refused - did you specify the right host or port?
```
注意这里如果使用自己的私库，注意一些替换
```sh
echo '#!/bin/bash
namespace=${1-"kube-system"}
for podname in $(sudo microk8s.kubectl -n $namespace get -o=name pod)
do
    mkdir -p $(dirname $podname)
    echo $(basename $podname)
    sudo microk8s.kubectl -n $namespace get pod  -o yaml $(basename $podname) > $podname.yaml
    sed -i "s/gcr.io/{替换成你对应的私库地址}/g" $podname.yaml
    sudo microk8s.kubectl  -n $namespace replace -f $podname.yaml
done' > replace_mirror.sh
sh replace_mirror.sh {替换成你需要重新替换的命名空间}
```
knavtive果然很大，给大家看一下有多少pod,反正我这分配了2核，4G的虚拟机已经卡的不行了
```sh
pod/grafana-7568fffb58-2bphj
pod/istio-citadel-756ffc49cc-66f4x
pod/istio-cleanup-secrets-1.2.2-ftf6m
pod/istio-egressgateway-79f567989c-mj72l
pod/istio-galley-757c85bdcb-r2rw2
pod/istio-grafana-post-install-1.2.2-8mm52
pod/istio-ingressgateway-7d4c9898bf-5h4nk
pod/istio-pilot-7d89f7fdd4-kfqjh
pod/istio-policy-568dd867fb-th4fc
pod/istio-sidecar-injector-7ccc68767c-q7jtk
pod/istio-telemetry-867dc6bd9f-wjqxb
pod/istio-tracing-84cbc6bc8-s5rq6
pod/kiali-54655cd89-wxkj2
pod/prometheus-6f74d6f76d-8bqq7
pod/zipkin-78b84857d5-pc7fq
pod/eventing-controller-699c55df94-mjfn5
pod/eventing-webhook-57b5c65467-sd2p2
pod/imc-controller-9d7bf5895-pm8xv
pod/imc-dispatcher-7848cfc59b-77pth
pod/sources-controller-64f8c46b5d-zgfls
pod/elasticsearch-logging-0
pod/grafana-b7999c9c8-5ws5b
pod/kibana-logging-669968b8d4-f9htp
pod/kube-state-metrics-594f5d4588-rqvvq
pod/node-exporter-z8ctb
pod/prometheus-system-1
pod/activator-6469979459-ztwnk
pod/autoscaler-67ddb69b5c-qcnpg
pod/autoscaler-hpa-5dd6b94d9-brssm
pod/controller-58c9c44966-tggzd
pod/networking-istio-8fc67796d-75p4b
pod/webhook-dfc9dd4c4-874cg
pod/coredns-9b8997588-t5lrn
```
```sh
echo '#!/bin/bash
for podname in $(sudo microk8s.kubectl -n $namespace get -o=name pod)
do
    sudo microk8s.kubectl delete pod $(basename $podname) --all-namespaces
done' > replace_mirror.sh
sh restart_all_pod.sh {替换成你需要重新替换的命名空间}
```

# Hello World
1. npm初始化package.json(./package.json)
```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "zy445566",
  "license": "MIT"
}
```
2. Hello World代码(./index.js)
```js
const http = require('http');
const port = process.env.PORT || 8080;
http.createServer((req, res) => {
    const target = process.env.TARGET || 'World';
    res.end(`Hello ${target}!`);
}).listen(port);
console.log(`listening on port:http://127.0.0.1:${port}`);
```
3. 构建docker文件并推送(./Dockerfile)
```Dockerfile
FROM node:12-slim
WORKDIR /usr/src/app
COPY . ./
RUN npm install
CMD [ "npm", "start" ]
```
比如我的docker.io的id是zy445566
```sh
docker build -t zy445566/helloworld-nodejs .
docker push zy445566/helloworld-nodejs
```
4. 写service的yaml文件并部署(./service.yaml)
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: helloworld-nodejs
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: docker.io/zy445566/helloworld-nodejs
        env:
        - name: TARGET
          value: "Node.js Sample Native v1"
```
部署服务
```sh
kubectl apply --filename service.yaml
```
5. 获取ip并访问
```sh
echo 'INGRESSGATEWAY=knative-ingressgateway
if kubectl get configmap config-istio -n knative-serving &> /dev/null; then
    INGRESSGATEWAY=istio-ingressgateway
fi
kubectl get svc $INGRESSGATEWAY --namespace istio-system' > get_ip_address.sh
sh get_ip_address.sh
kubectl get ksvc helloworld-nodejs  --output=custom-columns=NAME:.metadata.name,URL:.status.url
curl -H "Host: helloworld-nodejs.default.example.com" http://{IP_ADDRESS} # 这个是get_ip_address获取的地址
# output: Hello Node.js Sample Native v1!
```

# 总结
至此使用microk8s搭建的Knative服务总体来说还是不错，但是microk8s问题也挺多的，本来抱着省心去做的，结果也不是那么省心，期待microk8s后续能越做越好吧。就Knative来说服务偏大，单机基本无法承载，远远超出了我的预想，不建议为了实现serverless架构就动用这个牛刀，服务复杂后再上这个也不迟。对于multipass用来虚拟环境做分布式应用测试还不错，是个小而美的东西。