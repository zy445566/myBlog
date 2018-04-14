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
const  queryPromise = (sql,bind=[]) =>{
    return new Promise((res,rej)=>{
        pool.query(sql,bind,  (err, results, fields)=> {
            if (error) rej (err);
            res({result, field});
        });
    })
};
http.createServer( async (request, response) => {
    let pathname = url.parse(request.url).pathname;
    //console.log(`url:http://127.0.0.1:${port}{$pathname}`)
    switch (pathname)
    {
        case '/clear':
            await queryPromise('TRUNCATE TABLE');
            break;
        case '/common':
            break;
        case '/trans':
            break;
        case '/block':
            break;
    }
    response.writeHead(200, {'Content-Type': 'text/html'});    
    response.write('test');
    response.end();
 }).listen(port);
 console.log(`url:http://127.0.0.1:${port} listening port:${port}`);


  