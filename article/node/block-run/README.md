# 针对使用非块运行和块运行并发压测对比

### 为什么会有这个实验
由于cnode上的一篇提问 [node.js单线程,是不是就不用消息队列了啊?](https://cnodejs.org/topic/5acc702a042a804dc5196811)<br />
我当时的回答是<br />
```
举个例子，你要在数据表查是否有同名的，没同名则插入。
因为node无法按整个请求的sql块作为执行单元，而是按sql条作为了执行单元，那么按上面的来说两个select会先后到达，而第一条insert并没有插入，导致第二个select查询为空，还会继续插入用户。（如果表小可能不会出现，表大必现）
而消息队列则相当于是已将请求的整个sql块作为执行单元，即完成了整个请求的select和insert，才会执行下一个请求的select和insert。
```
这个回答是根据我以往在node遇到的坑，来回答的。貌似很有道理，毕竟我们平时执行node都是按条作为异步的最小单元执行的。<br />
但是事后我想，那为什么不能将node块做为顺序执行单位呢？<br />
```
没错，它确实可以
```
遂在当天晚上做了一个简单的块运行库，简单测试了一下，感觉好像是实现了，但由于业务繁忙（产品需求激增），所以一直没有时间去做优化和针对数据库的实际的测试！遂于周末来测试一下。<br />
我这边实现了三套针对数据库的并发测试<br />
1. 乐观锁抗并发
2. 事务加乐观锁抗并发
3. 块执行加乐观锁抗并发

### 主要代码如下
#### 乐观锁抗并发
```js
async function sqlCommon(sqlCommonName = 'sqlCommon')
{
    let conn;
    try{
        conn = await getConn();
        let testSelete = await queryPromise(
            conn,
            'SELECT * FROM `test` WHERE `name`= ? AND `version`=?',
            [getName(sqlCount),sqlCount]
        );
        if(testSelete.length>0)
        {
            let testRes = await queryPromise(
                conn,
                'UPDATE `test` SET `name`= ?,`version`=?+1 WHERE `version`=?',
                [getName(sqlCount+1),sqlCount,sqlCount]
            );
            if(testRes.affectedRows>0)
            {
                sqlCount++;
            } else {
                console.log(`${sqlCommonName} failed:${sqlCount}`)
            }
        } else {
            console.log(`${sqlCommonName} failed:${sqlCount}`)
        }
        conn.release();
    } catch(e){
        console.log(`${sqlCommonName} failed:${sqlCount}`)
        conn.release();
        // console.log(e.stack)
    }
}
```
#### 事务加乐观锁抗并发
```js
async function sqlTrans()
{
    let conn;
    try{
        conn = await getConn();
        await queryPromise(conn,'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;')
        beginTransaction(conn);
        let testSelete = await queryPromise(
            conn,
            'SELECT * FROM `test` WHERE `name`= ? AND `version`=?',
            [getName(sqlCount),sqlCount]
        );
        if(testSelete.length>0)
        {
            let testRes = await queryPromise(
                conn,
                'UPDATE `test` SET `name`= ?,`version`=?+1 WHERE `version`=?',
                [getName(sqlCount+1),sqlCount,sqlCount]
            );
            if(testRes.affectedRows>0)
            {
                sqlCount++;
            } else {
                console.log(`sqlTrans failed:${sqlCount}`)
                rollback(conn);
            }
        } else {
            console.log(`sqlTrans failed:${sqlCount}`)
        }
        commit(conn);
        conn.release();
    } catch(e){
        console.log(`sqlTrans failed:${sqlCount}`)
        // console.log(e.stack);//这里会爆出很多事务锁错误
        rollback(conn);
        conn.release();
    }
}
```
#### 块执行加乐观锁抗并发(仅仅是将乐观锁，放如块执行的某个渠道，改造很简单)
[乐观锁需要的包地址](https://www.npmjs.com/package/block-run)<br />
[乐观锁需要的仓库地址](https://github.com/zy445566/block-run)<br />
```js
function sqlBlock()
{
    return new Promise ((reslove,rejected)=>{
        BlockRun.run('sqlBlockChannel1',async ()=>{
            await sqlCommon('sqlBlock');
            reslove(true)
        },3000);
    });
}
```

### 主服务入口
```js
http.createServer( async (request, response) => {
    try {
    let pathname = url.parse(request.url).pathname;
    //console.log(`url:http://127.0.0.1:${port}{$pathname}`)
    let showText = 'test';
    switch (pathname)
    {
        case '/clear':
            await sqlClear();
            showText = 'clear';
            break;
        case '/common':
            await sqlCommon();
            showText = 'common';
            break;
        case '/trans':
            await sqlTrans();
            showText = 'trans';
            break;
        case '/block':
            await sqlBlock();
            showText = 'block';
            break;
    }
    response.writeHead(200, {'Content-Type': 'text/html'});    
    response.write(showText);
    response.end();
    } catch(e) {
        console.log(e.stack)
    }
 }).listen(port);
```
### 其他代码请看
[其他代码文件地址](https://github.com/zy445566/myBlog/blob/master/20190125deno/20180414block-run/index.js)

### 运行结果
#### 乐观锁抗并发
##### ab
![optimisticOnly-ab](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticOnly-ab.png)
##### failed
![optimisticOnly-failed](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticOnly-failed.png)
##### res
![optimisticOnly-res](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticOnly-res.png)
#### 事务加乐观锁抗并发(和乐观几乎一致，有时事务结果好一个两个)
##### ab
![optimisticTrans-ab](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticTrans-ab.png)
##### failed
![optimisticTrans-failed](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticTrans-failed.png)
##### res
![optimisticTrans-res](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticTrans-res.png)

#### 块执行加乐观锁抗并发
##### ab
![optimisticBlock-ab](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlock-ab.png)
##### failed (一开始看到没有数据失败，感觉还挺神奇的)
![optimisticBlock-failed](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlock-failed.png)
##### res (看来神奇是必然的，嘿嘿)
![optimisticBlock-res](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlock-res.png)

到这里有人会说了，你这个ab压力太小了，当然没什么了，其实我想说，主要还是数据和乐观锁结果太难看了，我要照顾一下。<br />
大家想看块执行的牛逼之处就让大家看个痛快<br />

#### 块执行加乐观锁抗并发(并发升级版本)
##### ab 直接上 -n 10000 -c 100
![optimisticBlockSuper-ab](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlockSuper-ab.png)
##### failed (怎么还没更新失败？神奇？)
![optimisticBlockSuper-failed](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlockSuper-failed.png)
##### res (看来神奇又是必然的，嘿嘿)
![optimisticBlockSuper-res](https://raw.githubusercontent.com/zy445566/myBlog/master/20190125deno/20180414block-run/img/optimisticBlockSuper-res.png)

### 最后
还有谁不服！简直就是并发小神器啊！如果是个人建站抗并发的话足够了！无须事务照样抗并发，性能杠杠的！<br />
对结果有疑问的同学可以自行测试，注意两点：
1. 测试前要 curl http://127.0.0.1:8088/clear 保证数据库没有被之前测试污染
2. sql和全部代码都在[此处](https://github.com/zy445566/myBlog/tree/master/20190125deno/20180414block-run)
3. 测试前要 npm install 
4. 此次测试使用的块执行库是block-run的1.0.8版本：
[块执行包地址](https://www.npmjs.com/package/block-run)
[块执行仓库地址](https://github.com/zy445566/block-run)
5. 补充一下，如果要涉及数据回滚，最好在块执行中要加上事务，块执行高效的原因其实就在于保证成功率，这里没有测加事务的块执行的版本，我相信加事务的块执行的效率还是会比非块执行的事务版本要高，有兴趣的可以测试一下