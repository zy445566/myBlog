#[macro_use]
extern crate neon;

use neon::vm::{Call, JsResult};
use neon::js::JsString;
use neon::js::JsInteger;
use neon::js::Variant;

//原有的hello方法
fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "hello node").unwrap())
}

//斐波那契数方法入口
fn fib(call: Call) -> JsResult<JsInteger> {
    let scope = call.scope;
    //获取第一个参数
    let option_num = call.arguments.get(scope,0);
    //定义参数值变量
    let mut num:i32 = 0;
    //获取参数值
    if let Some(x1) = option_num {
        if let Variant::Integer(x2) = x1.variant() {
            num = x2.value() as i32;
        }
    }
    //调用简单的求斐波那契数方法，并返回js的Integer对象
    Ok(JsInteger::new(scope, easy_fib(num)))
}

// 简单的求斐波那契数方法，有兴趣的同学可以实现一下矩阵快速幂求斐波那契数
fn easy_fib(num:i32) -> i32
{
    if num < 2
    {
        return 1;
    } else {
        return easy_fib(num-1) + easy_fib(num-2);
    }
}

//模块导出
register_module!(m, {
    try!(m.export("hello", hello));
    try!(m.export("fib", fib));
    Ok(())
});
