# 使用inspect进行远程调试
我们什么时候需要远程调试呢？比如在容器中，如果使用传统的方法只能cp进去修改测试环境的文件来debugger，这样做是非常麻烦的，但是如果我们对测试环境做判断，如果是测试环境我们则可以启动inspect进行远程调试的话，我们在调试就能做到事半功倍。

# 开始启动配置调试服务
很多人会觉得配置调试服务很麻烦，实际上特别简单，而且当我们的node版本大于或等于8的话，直接可以使用一个命令来启动。

假设我们的项目启动文件为app/api.js文件，那么如果我们是使用node或者nodemon来启动，我们可以使用
```sh
node  --inspect app/api.js
# 或
nodemon --inspect app/api.js
```
来启动服务，默认绑定在127.0.0.1:9229。`注意:--inspect命令必须在启动文件的前面否则无效`

由于默认绑定127.0.0.1所以一般情况是局域网其它机器访问不了的，而我们测试网往往至少要暴露在局域网中。所以当我们使用PM2时可以这样用。
```sh 
# 再使用调试模式启动
pm2 start node --name="my-api" -- --inspect=0.0.0.0:9229 app/api.js
```
我们可以先看PM2的log查看是否存在：Debugger listening on ws://0.0.0.0:9229/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx类似这样的输出,如果有则启动成功。

接下来我们可以用浏览器访问inspect绑定的地址，比如测试ip是192.168.1.111，那么我们可以访问一下192.168.1.111:9229，如果出现《WebSockets request was expected》则说明测试服务,我们可以访问到。

# 接下来使用vscode来配置远程调试了
这里列出了两种vscode调试代码的方式：
* 本地启动调试的方式（第一条）
* 远程调试的配置方式（第二条）

具体如下：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch", // 本地启动调试则可以使用launch
            "name": "本地启动", 
            "skipFiles": [
                "<node_internals>/**",
                "${workspaceRoot}/node_modules/**/*.js"
            ],
            "program": "${workspaceFolder}\\app\\api.js"
        }
        {
            "type": "node",
            "request": "attach", // 这个和本地调试不一样，使用inspect必须配置attach
            "name": "远程调试",
            "skipFiles": [
                "<node_internals>/**",
                "${workspaceRoot}/node_modules/**/*.js"
            ],
            "address": "远程服务的域名或IP",
            "port": 9229, // 默认远程服务的调试端口
            "remoteRoot": "远程服务的项目绝对路径",
        }
    ]
}
```

这个文件一般是在项目的`.vscode/launch.json`中，只要我们把远程调试配置好，就可以使用远程调试工具了。然后我们使用调试选择`远程调试`，再对某个代码打上断点，则当某个请求访问断点时就可以打出断点信息了。`注意:要保持代码一致断点才能够有效，使用前请进行一次git pull`。
