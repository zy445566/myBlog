import { serve } from "https://deno.land/x/std@v0.2.10/http/server.ts";
export default class Http {
    constructor(router) {
        this.router = router;
    }

    async listen (port) {
        const listenAddr = `127.0.0.1:${port}`;
        const s = serve(listenAddr);
        console.log(`listen: http://${listenAddr}`);
        for await (const req of s) {
            if(this.router[req.url]) {
                let routerManger = this.router[req.url];
                req.respond({ body: new TextEncoder().encode(await routerManger.controller[routerManger.method]()) });
            } else {
                let routerManger = this.router[this.router.default];
                req.respond({ body: new TextEncoder().encode(await routerManger.controller[routerManger.method]()) });
            }
            
        }
    }
}
