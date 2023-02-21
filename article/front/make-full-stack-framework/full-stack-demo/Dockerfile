FROM centos:latest

# 安装依赖
RUN yum -y update  
RUN yum -y install wget

# 安装node环境
ENV NODE_VERSION v12.8.0
RUN mkdir -p /node/$NODE_VERSION
RUN wget https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.gz
RUN tar xzf node-$NODE_VERSION-linux-x64.tar.gz -C /node/
ENV PATH  /node/node-$NODE_VERSION-linux-x64/bin:$PATH

WORKDIR /myApp

# 复制文件(已使用.dockerignore)
COPY . /myApp

# 安装项目依赖
RUN npm install  --registry=https://registry.npm.taobao.org

# 暴露端口
EXPOSE 3000

# docker入口文件
CMD ["npm","run", "stable"]