# 如何构建一个同时支持node和deno的框架
这篇文章，我更倾向于在分享自己的对构建多运行时框架构建思想，同时希望能够听取更多人的想法，构建更好的过渡框架。

# 最初想法
最初想法是收到wine的启发，直接用deno实现一套node的api，然后通过这个api来实现node程序在deno运行的无缝切换。但实现了一段时间后，发现存在几个问题。
* 工作量较大，每一次API不断出现，每次都要重新移植
* 不仅仅要支持deno,支持deno只是解决当前问题，后面可能会出现oden,enod等等
* 细节上很难做好，由于毕竟是两套实现，所以在细节上，始终很难保持一致
* 历史包袱将不断扩大，这会把node的历史问题带给下一个运行时

所以这个想法，在实现过程中和深思中发现并不是一个好方案，所以快速冷静下来，思考一个更好的解决方案。

# 新的想法
吸取教训后，痛定思痛。发现要完全丝滑迁移是不现实的，只能考虑保证新的产品能够更加无损的切换，只保证新的框架不会受到老框架的影响。

所以新点子出现，自己写一个中间层来支持，业务逻辑里面只需要写原生JS代码，不需要写node或者deno的代码不就好了。那么对比最初的方案优点缺点，我归类了一下：
优点：
1. 工作量偏小
2. 即使后续推出新的运行时，依旧可以较好的支持
3. 依赖自己实现的中间层，所以不受制运行时影响导致细节差别过大问题
4. 业务代码只写JS，不会把上一个运行时的历史包袱，带给下一个运行时

缺点：
* 只能在新业务中使用
* 库只能自己通过中间层暴露的接口重新实现一遍

# 付出实践
`注意1：当前教程使用node版本为非stable的v11.11版本（v10不支持），由于使用了大量实验性特性，所以在后续版API可能会产生更改`

`注意2：deno版本也持续长期不稳定，本教程使用的0.3.2版本`

## DEMO框架目录结构
由于基于这个DEMO框架讲解，还是要讲一讲目录的结构的。

代码文件链接：[点次打开查看](https://github.com/zy445566/myBlog/tree/master/20190125deno/20190305frame/jsFrame)
```sh
* controller #框架的控制器目录
* server #框架的服务层目录
* engineMiddle  #框架的运行时中间层目录
    * deno #切换到deno要运行的目录
    * node #切换到node要运行的目录
config.js #框架配置文件
mian.js #框架的伪入口文件
router.js #框架的路由文件
run.sh #框架的启动脚本用于选择运行时的启动
```
## 入口方案
通过获取参数的方式来启动框架，默认是使用node启动框架

show code(run.sh文件代码):
```sh
#!/usr/bin/env bash
if [ "$1" == "deno" ]
then
    deno --allow-read --allow-write --allow-net --allow-env ./engineMiddle/deno/mod.js
else
    NODE_OPTIONS='--experimental-vm-modules --experimental-modules --loader ./engineMiddle/node/custom-loader.mjs' node ./engineMiddle/node/index.js
fi
```
## node中间层方案
想法是使用vm来构建原生JS的运行环境，同时加载node官方的custom-loader.mjs来实现import的hook。同时使用v11的vm的最新试验性特性打开VM的import。

体现在代码上则是以下几点：
* 使用VM开执行原生JS
* 使用VM最新试验性特性打开原生JS的import的支持
* 将非JS所能实现的功能注入每个VM中，使得业务层除原生JS外只能使用我中间层暴露的非原生JS方法

show code:
```js
// engineMiddle/node/index.js 文件
import vm from 'vm';
import fs from 'fs';
import path from 'path';
import Http from './http.js';
import File from './file.js';
function getMidInjectObj() {
    return {
        /*
        * 暴露给中间层代码，这仅仅是注入演示
        * 如有需要可以增加挂载方法
        * 暴露的方法和deno中间层暴露保持一致就好
        */
        midInject:{ 
            console:console,
            Http:Http, //暴露给业务层的HTTP方法和deno暴露方法保持一致
            File:File //暴露给业务层的文件操作方法和deno暴露方法保持一致
        }
    }
}
(async()=>{
    // 把main.js放入VM中运行
    const mainPath = './main.js';
    const mainJsPath = path.join(process.cwd(),mainPath);
    const baseURL = new URL('file://');
    const mainJsUrl = new URL(mainJsPath, baseURL);
    const sandbox = vm.createContext(getMidInjectObj());
    const main = new vm.SourceTextModule(fs.readFileSync(mainJsUrl.pathname).toString(), {
        context:sandbox, 
        url: mainJsUrl.href,
        initializeImportMeta(meta){
            meta.url = mainJsUrl.href
    }} );
    // 实现VM的import加载器功能
    async function linker(specifier, referencingModule) {
        // 将传入相对路径和当前文件路径拼成新url
        const resolved = new URL(specifier, referencingModule.url);
        // 读取引用新文件并初始化
        if(fs.existsSync(resolved.pathname)){
            return new vm.SourceTextModule(fs.readFileSync(resolved.pathname).toString(), { 
                context: referencingModule.context, url: resolved.href,
                initializeImportMeta(meta){
                    meta.url = resolved.href
            }});
        }
        throw new Error(`Unable to resolve dependency: ${specifier}`);
    };
    // 加载VM的import加载器功能
    await main.link(linker);
    // 实例化
    main.instantiate();
    // 执行主代码
    let mainResult = await main.evaluate();
    let mainFunc = mainResult.result;
    await mainFunc();
})();
```

## deno中间层方案
由于deno没有类似VM的东西所以方法是直接挂载上去的,这就偏简单了。
```js
import Http from './http.js';
import File from './file.js';
import main from '../../main.js';
/*
* 暴露给中间层代码，这仅仅是注入演示
* 如有需要可以增加挂载方法
* 暴露的方法和node中间层暴露保持一致就好
*/
window.midInject = {
    console:console,
    Http:Http, //暴露给业务层的HTTP方法和node暴露方法保持一致
    File:File, //暴露给业务层的文件操作方法和node暴露方法保持一致
}
main();
```
可能有人说了node你防止了业务层只能使用中间层的非中间层代码，而deno没防止。其实这个很好解决，使用分别使用node和deno都跑以下代码或测试用例就好，如果只有deno能跑通则说明使用了deno的非原生JS代码。

## 业务层主入口

未完待续，明天再写

## 业务层的使用

未完待续，明天再写

# 最后聊聊
由于这是做的一个DEMO，所以很多都采取了极简模式，包括控制器和服务层都没有基类，模型层直接忽略了，没有使用工厂化生产控制器和服务层等等，同时路由目前连参数也不支持。但是对于这次关于同时兼容node和deno的服务框架的，考虑应该也是足够的。

思想包括，但不限于：
* 即使存在新的运行时，只要重新实现一遍中间层功能即可
* 使用不同入口，但可以从入口保证最终实现的功能相同
* 使用注入的方式，从暴露的中间层变量，如果使用JS之外的方法，包括http和文件读取，保证除中间层外只允许原生JS使用

最后希望大家能给出一些思想上的一些帮助而非单纯代码层面，谢谢