var http = require('http');
var url = require('url');

function fibo(num)
{
	if(num<2){return 1;} 
  	return fibo(num-1)+fibo(num-2);
}

http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var params = url.parse(req.url, true).query;
    let num = params.num>0?params.num:Math.ceil(Math.random()*40);
    res.end(`num is ${num},fibo is ${fibo(num)}`);
 
}).listen(3000);