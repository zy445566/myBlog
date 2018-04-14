const http = require('http');
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
    sqlCount = 0;
}

async function sqlCommon()
{
    let name = `test:${sqlCount}`;
    let conn = await getConn();
    let testSelete = await queryPromise(
        conn,
        'SELECT * FROM `test` WHERE `name`= ? AND `version`=?',
        [name,sqlCount]
    );
    if(testSelete.length>0)
    {
        let testRes = await queryPromise(
            conn,
            'UPDATE `test` SET `name`= ?,`version`=?+1 WHERE `version`=?',
            [name,sqlCount,sqlCount]
        );
        if(testRes.affectedRows>0)
        {
            sqlCount++;
        }
    } else {
        console.log(sqlCount)
    }
}

async function sqlTrans()
{
    let conn = await getConn();
    await queryPromise(conn,'TRUNCATE TABLE test');
}

async function sqlBlock()
{
    let conn = await getConn();
    await queryPromise(conn,'TRUNCATE TABLE test');
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


  