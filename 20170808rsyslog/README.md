# 教你一步一步利用rsyslog搭建自己的日志系统
## rsys是什么
rsyslog 是一个syslog的升级版，可用于处理大型的系统的日志需求。并且可以把输入到日志转换到各个数据系统上，如图。
![rsyslog](https://raw.githubusercontent.com/zy445566/myBlog/master/20170808rsyslog/imgs/rsyslog.png)
## 教程开始
本教材使用centos系统，其他系统只能作为参考作用

## 如何安装
一般来说centos都自带了rsyslog,当然你也可以通过源码包来安装 <br />
源码包下载地址:http://www.rsyslog.com/downloads/download-v8-stable/ <br />
或使用 <br />
```sh
sudo yum install rsyslog
```
这里就不再赘述，相信这一步很快能度过

## 如何开启我们的rsyslog远程服务
由于我们要远程写入日志，所以我们要打开支持远程的连接,使用vim打开文件
```sh
sudo vim /etc/rsyslog.conf
```
并将以下注释打开
```ini
# Provides UDP syslog reception
$ModLoad imudp #打开udp模块
$UDPServerRun 514 #打开udp服务，并监听514端口
# Provides TCP syslog reception
$ModLoad imtcp #打开tcp模块
$InputTCPServerRun 514 #打开tcp服务，并监听514端口
```
然后重启我们的服务
```sh
sudo service rsyslog restart
```

## 如何使用我们的node进行连接来写入日志
其实这一步很简单，根据上面开启的服务，直接使用原生的socket即可<br />
直接上代码（下面两种版本选一种即可，udp快，但不能保证传输必达性）<br />
```js
//tcp版本
const net = require('net');
function writeLog(port,host,logInfo)
    {
        var client = new net.Socket();
        return new Promise((resolve,reject)=>{
            client.connect(port, host, () => {
                client.end(logInfo);
                client.destroy();
                resolve(true);
            });
            client.once('error', (err) => {
                console.log(err);
                reject(err);
            });
        });
       
    }
writeLog(514,'127.0.0.1','hello！rsyslog!')；
```
```js
//udp版本
const dgram = require('dgram');
function writeLog(port,host,logInfo)
    {
        var client = dgram.createSocket('udp4');
        return new Promise((resolve,reject)=>{
            var message = Buffer.from(logInfo);
            client.send(message, port, host, (err) => {
                if(err)reject(err);
                resolve(true);
                client.close();
            });
        });
       
    }
```
这时我们如何查看信息呢？很简单，默认是在／var/log/message文件中<br />
```
tail -f ／var/log/message
```
我们应该可以在末端看到“hello！rsyslog!”<br />
但所有文件都在message，我存其他地方行不行？<br />
这就要涉及rsyslog规则了<br />

### 如何使用rsyslog规则
在配置文件/etc/rsyslog.conf里面，我们能看到默认规则
```ini
#### RULES ####

# Log all kernel messages to the console.
# Logging much else clutters up the screen.
#kern.*                                                 /dev/console

# Log anything (except mail) of level info or higher.
# Don't log private authentication messages!
*.info;mail.none;authpriv.none;cron.none                /var/log/messages

# The authpriv file has restricted access.
authpriv.*                                              /var/log/secure

# Log all the mail messages in one place.
mail.*                                                  -/var/log/maillog


# Log cron stuff
cron.*                                                  /var/log/cron

# Everybody gets emergency messages
*.emerg                                                 :omusrmsg:*

# Save news errors of level crit and higher in a special file.
uucp,news.crit                                          /var/log/spooler

# Save boot messages also to boot.log
local7.*                                                /var/log/boot.log
```
为什么我们会访问/var/log/messages，这里很明显，<br />
所有info数据类型都会进入/var/log/messages文件中<br />
这里就要说明Facility(设备)和Severity（日志等级）了<br />
比如我在/etc/rsyslog.conf增加以下代码<br />
```ini
local1.info   /var/log/local1.info.log #别忘了增加配置要重启服务哦
# 这里的Facility就是local1，Severity就是info
```
Facility和Severity有以下几种<br />
```
Facility:有0-23种设备
0 kernel messages 
1 user-level messages 
2 mail system 
3 system daemons 
4 security/authorization messages 
5 messages generated internally by syslogd 
6 line printer subsystem 
7 network news subsystem 
8 UUCP subsystem 
9 clock daemon 
10 security/authorization messages 
11 FTP daemon 
12 NTP subsystem 
13 log audit 
14 log alert 
15 clock daemon 
16-23 　　　　local0 - local7

Severity:日志等级

0 Emergency
1 Alert
2 Critical
3 Error
4 Warning
5 Notice
6 Informational
7 Debug
```
### 问题又来了，我们应该如何写入进local1.info的local1.info.log文件中呢？
这里就涉及到syslog的日志协议了，如图<br />
![syslog-stant](https://raw.githubusercontent.com/zy445566/myBlog/master/20170808rsyslog/imgs/syslog-stant.png)
<br />比如我们要发送到local1.info中<br />
```js
writeLog(514,'127.0.0.1','<142>Jul 26 21:02:30 127.0.0.1 myApp[0]: hello！local1.info!')；
```
### 那我们来拆解着一段
#### PRI：
那你<142>怎么来的呢？<br />
因为local1.info对应的Facility是17，Severity是6 <br />
而PRI计算规则是Facility乘8+6即是17乘8+6=142 <br />
#### TIME：
Jul 26 21:02:30 就是时间
#### IP或主机名
127.0.0.1 就是ip，你也可以填写你的主机名如 zsComputer
#### 程序名和错误编号
myApp[0]: 这里myApp就是我们的应用名称(后面可以根据这个做日志拆分)，0代表的是该应用的错误编码，如果是错误则大于0
#### 我们要发送的消息
hello！local1.info!

### 接下来我们进去查看信息是否进入
```
tail -f /var/log/local1.info.log
```
这时你应该会看到以下信息在/var/log/local1.info.log文件中
```log
Jul 26 21:02:30 127.0.0.1 hello！local1.info!
```
### 当然规则也有高级用法比如按应用名创建
```ini
$template myFormat,"/var/log/%programname%/%$year%%$month%%$day%.log"
*.* -?myFormat #本机测试使用
#fromhost-ip, !isequal, "127.0.0.1" ?myFormat #实际线上格式
#这里会创建myApp目录并根据年月日生成日志
```
可使用变量如下
```
msg,rawmsg,hostname,source,fromhost,fromhost-ip,syslogtag,programname,pri-text,iut,syslogfacility,syslogfacility-text,syslogseverity,syslogseverity-text,syslogpriority,syslogpriority-text,timegenerated,timereported,timestamp,protocol-version,structured-data,app-name,procid,msgid,inputname
```
系统常量
```
$bom,$now,$year,$month,$day,$hour,$hhour,$qhour,$minute,$myhostname
```

## 简单的rsyslog教程结束
如果想看rsyslog结合kafka和hbase的教程，<br />
请点星 https://github.com/zy445566/myBlog/tree/master/20170808rsyslog  <br />
超过100我将进行写rsyslog结合kafka和hbase的教程   <br />

