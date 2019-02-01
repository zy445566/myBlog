# deno系列第二篇，给deno做rust扩展
这篇文章主要接着 [《编译deno，deno结构解析》](https://github.com/zy445566/myBlog/blob/master/20190125deno/20190125build/README.md)作的第二篇，由于deno目标是给提供像浏览器一样的安全的环境，但是如果你需要在后端实现一些deno不方便实现的东西，你要如何做呢？那为什么我们不能给deno做一个扩展呢？我们就以做一个计算斐波那契数列的方法做一个deno做rust扩展。

# 第一步：定义消息类型
上篇文章目录解析说到，deno是通过中间层使得v8和rust互相调用，那么v8是c++写的，rust又是另一门语言，那需要通讯要怎么怎么做呢？deno使用很常规的类似RPC来调用，只不过去掉了r。使用过thrift和grpc的同学都知道如果要实现多语言通讯实际上是要互相定义类型，deno也不例外，只不过使用的是flatbuffers，这里有兴趣自行学习。

所以我们第一步定义类型：

* 在src/msg.fbs中增加GetFibo和GetFiboRes两种类型，类型名字可以随便取，代码如下

```fbs
union Any {
  Start,
  ...
  GetFibo,
  GetFiboRes
}

table GetFibo {
  num: int32;
}

table GetFiboRes {
  result: int32;
}
```
什么意思呢？你可以这样认为GetFibo就是定义了我传入的参数列表类型，GetFiboRes则是定义了返回值的类型。而我们要做计算斐波那契数列的方法，那么参数只有一个数字，结果也只有一个数字，所以将我们都只要定义一个数字类型就好。

写好后，我们可以编译一下
```sh
./tools/build.py 
# 生成target/debug/gen/msg_generated.ts，这个我们后面要用到
```

# 第二步：建立与rust进行通讯的方法和ts的方法定义
* 新建一个文件js/get_fibo.ts，代码如下

```ts
import * as msg from "gen/msg_generated";
import * as flatbuffers from "./flatbuffers";
import { assert } from "./util";
import * as dispatch from "./dispatch";

function req(
    num: number,
  ): [flatbuffers.Builder, msg.Any, flatbuffers.Offset] {
    const builder = flatbuffers.createBuilder();
    msg.GetFibo.startGetFibo(builder);
    msg.GetFibo.addNum(builder, num);
    const inner = msg.GetFibo.endGetFibo(builder);
    return [builder, msg.Any.GetFibo, inner];
  }
  
  function res(baseRes: null | msg.Base): number {
    assert(baseRes !== null);
    assert(msg.Any.GetFiboRes === baseRes!.innerType());
    const res = new msg.GetFiboRes();
    assert(baseRes!.inner(res) !== null);
    return res.result();
  }


export function getFiboSync(num: number): number {
    return res(dispatch.sendSync(...req(num)));
}
  

export async function getFibo(num: number): Promise<number> {
    return res(await dispatch.sendAsync(...req(num)));
}
```
作下说明：
* gen/msg_generated 就是我们之前生成的数据类型定义
* flatbuffers 用来产生协议数据的工具
* assert 检测数据是否异常的工具
* dispatch 发送数据通讯的方法

此外如果我们只需要写js而不需要通讯rust的话，其实就也不需要引用这些库了，直接在getFiboSync和getFibo写方法就好了。这个文件ts主要用途就是和rust交互用的，同时定义下要暴露的ts方法，req方法是组转要发送的数据结构，res则是处理接收回来的消息，dispatch发送数据。

`注`：getFiboSync和getFibo 分别代表同步方法和异步方法

# 增加rust方法
在src/ops.rs增加方法，这里的方法也主要是接收和数据组装,代码如下：
```rs
...
let op_creator: OpCreator = match inner_type {
      msg::Any::Accept => op_accept,
      msg::Any::Chdir => op_chdir,
      ...
      msg::Any::GetFibo => op_get_fibo //增加我们的方法
      _ => panic!(format!(
        "Unhandled message {}",
        msg::enum_name_any(inner_type)
      )),
...
fn op_get_fibo(
  _state: &Arc<IsolateState>,
  base: &msg::Base<'_>,
  data: libdeno::deno_buf,
) -> Box<Op> {
  assert_eq!(data.len(), 0);
  let inner = base.inner_as_get_fibo().unwrap();
  let cmd_id = base.cmd_id();
  let num = inner.num();

  blocking(base.sync(), move || -> OpResult {
    // 计算fibonacci数列
    let sqrt5 = 5_f64.sqrt();
    let c1 = (1.0_f64+sqrt5)/2.0_f64;
    let c2 = (1.0_f64-sqrt5)/2.0_f64;
    let result_f = (sqrt5/5.0_f64)*(c1.powi(num)-c2.powi(num));
    let result = result_f as i32;

    let builder = &mut FlatBufferBuilder::new();
    let inner = msg::GetFiboRes::create(
      builder,
      &msg::GetFiboResArgs {
        result, 
      },
    );

    Ok(serialize_response(
      cmd_id,
      builder,
      msg::BaseArgs {
        inner: Some(inner.as_union_value()),
        inner_type: msg::Any::GetFiboRes,
        ..Default::default()
      },
    ))
  })
}
...
```
这里稍微解释一下rust的match在这里的意思，你可以理解为一个增强版的switch，就是GetFibo的数据类型过来的话，就执行op_get_fibo方法，而op_get_fibo主要是在封装FlatBufferBuilder数据，而真正有效计算斐波那契数列的代码其实就一点，当然如果功能代码量大则可以新建一个rust文件来搞，如下：
```rs
    let sqrt5 = 5_f64.sqrt();
    let c1 = (1.0_f64+sqrt5)/2.0_f64;
    let c2 = (1.0_f64-sqrt5)/2.0_f64;
    let result_f = (sqrt5/5.0_f64)*(c1.powi(num)-c2.powi(num));
    let result = result_f as i32;
```

# 最后一步
其实到这里链路就算彻底打通了，我们只差最后一步，把我们的方法暴露出来

* 修改js/deno.ts文件，把get_fibo.ts的方法暴露出去即可
```ts
...
export { getFiboSync, getFibo } from "./get_fibo";
...
```
编译之后就搞定了
```sh
./tools/build.py 
```
测试代码如下：
```ts
import * as deno from "deno";

(async()=>{
    console.log(deno.getFiboSync(10));
    console.log(await deno.getFibo(11));
})();
```
其实在上一篇我也有讲到，学习deno就是学习一个库，相信看过测试代码就知道原因了。

# 结语
这次应该真的是过年前的最后一篇。