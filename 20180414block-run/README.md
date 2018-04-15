# 针对使用非块运行和非块运行压测对比
该文使用源码地址：(地址)[https://github.com/zy445566/myBlog/tree/master/20180414block-run]

### 为什么会有这个实验
由于cnode上的一篇提问 (node.js单线程,是不是就不用消息队列了啊?)[https://cnodejs.org/topic/5acc702a042a804dc5196811]<br />
我当时的回答是<br />
```
举个例子，你要在数据表查是否有同名的，没同名则插入。
因为node无法按整个请求的sql块作为执行单元，而是按sql条作为了执行单元，那么按上面的来说两个select会先后到达，而第一条insert并没有插入，导致第二个select查询为空，还会继续插入用户。（如果表小可能不会出现，表大必现）
而消息队列则相当于是已将请求的整个sql块作为执行单元，即完成了整个请求的select和insert，才会执行下一个请求的select和insert。
```
这个回答是根据我以往在node遇到的坑，来回答的。貌似很有道理，毕竟我们平时执行node都是按条作为异步的最小单元执行的。<br />
但是事后我想，那为什么不能将node块做为顺序执行单位呢？<br />
```
没错，它确实可以
```
遂在当天晚上做了一个简单的块运行库，简单测试了一下，感觉好像是实现了，但由于业务繁忙（产品需求激增），所以一直没有时间去做优化和针对数据库的实际的测试！遂于周末来测试一下。<br />
我这边实现了三套针对数据库的并发测试<br />
1. 乐观锁抗并发
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
#### 块执行加乐观锁抗并发
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
(其他代码文件地址)[https://github.com/zy445566/myBlog/blob/master/20180414block-run/index.js]

### 运行结果
#### 乐观锁抗并发
Optimistic


#### 事务加乐观锁抗并发

#### 块执行加乐观锁抗并发


