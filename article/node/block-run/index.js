const http = require('http');
const BlockRun = require('block-run');
const url = require('url');
const mysql = require('mysql');
const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : '127.0.0.1',
    user            : 'root',
    password        : '147159',
    database        : 'test'
});
const port = 8088;
const getConn = ()=>{
    return new Promise((res,rej)=>{
        pool.getConnection(function(err, conn) {
            if (err) rej (err);
            res(conn);
          });
    });
};
const  queryPromise = (conn,sql,bind=[]) =>{
    return new Promise((res,rej)=>{
        conn.query(sql,bind,  (err, result, field)=> {
            if (err) rej (err);
            res(result);
        });
    });
};

let sqlCount = 1;
async function sqlClear()
{
    let conn = await getConn();
    await queryPromise(conn,'TRUNCATE TABLE test');
    await queryPromise(conn,'INSERT INTO `test`.`test` (`id`,`name`,`version`) VALUES (1,"test:1",1);');
    sqlCount = 1;
    conn.release();
}

function getName(count)
{
    return `test:${count}`
}

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

function beginTransaction(conn)
{
    return new Promise((res,rej)=>{
        conn.beginTransaction((err)=>{
            if(err)rej(err);
            res(true);
        })
    });
}

function rollback(conn)
{
    return new Promise((res,rej)=>{
        conn.rollback((err)=>{
            if(err)rej(err);
            res(true);
        })
    });
}

function commit(conn)
{
    return new Promise((res,rej)=>{
        conn.commit((err)=>{
            if(err)rej(err);
            res(true);
        })
    });
}

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


function sqlBlock()
{
    return new Promise ((reslove,rejected)=>{
        BlockRun.run('sqlBlockChannel1',async ()=>{
            await sqlCommon('sqlBlock');
            reslove(true)
        },3000);
    });
}

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
 let abN = 100;
 let abC = 10;
 console.log(`clear url:http://127.0.0.1:${port}/clear`);
 console.log(`ab common command: ab -n ${abN} -c ${abC} http://127.0.0.1:${port}/common`);
 console.log(`ab trans command: ab -n ${abN} -c ${abC} http://127.0.0.1:${port}/trans`);
 console.log(`ab block command: ab -n ${abN} -c ${abC} http://127.0.0.1:${port}/block`);


//  setInterval(()=>{
//     if (BlockRun.getQueue()['sqlBlockChannel1'] != undefined){
//         console.log(BlockRun.getQueue()['sqlBlockChannel1'].length)
//     }
    
//  },1000)


  