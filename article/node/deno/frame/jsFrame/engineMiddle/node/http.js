import http from 'http';
export default class Http {
    constructor(router) {
        this.router = router;
    }

    async listen (port) {
        http.createServer(async (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/html'});
            if(this.router[req.url]) {
                let routerManger = this.router[req.url];
                res.write(await routerManger.controller[routerManger.method]())
            } else {
                let routerManger = this.router[this.router.default]
                res.write(await routerManger.controller[routerManger.method]())
            }
            res.end();
        }).listen(port);
        console.log(`listen: http://127.0.0.1:${port}`)
    }
}