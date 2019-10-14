const http = require('http');
const port = process.env.PORT || 8080;
http.createServer((req, res) => {
    const target = process.env.TARGET || 'World';
    res.end(`Hello ${target}!`);
}).listen(port);
console.log(`listening on port:http://127.0.0.1:${port}`);