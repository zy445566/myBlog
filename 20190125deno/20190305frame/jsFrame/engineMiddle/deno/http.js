import { listen } from "deno";
export default class Http {
    constructor(router) {
        this.router = router;
    }

    listen (port) {
        const listener = listen("tcp", `0.0.0.0:${port}`);
        console.log(`listen: http://127.0.0.1:${port}`);
        let acceptConn = async ()=>{
            let conn = await listener.accept();
            let line = '';
            while(line!='\n') {
                line = await conn.read();
            }
            conn.write('HTTP/1.1 200 OK');
            conn.write('Content-Type: text/html');
            conn.write(`Date: ${new Date().toGMTString()}`);
            conn.write('Connection: keep-alive');
            conn.write('Transfer-Encoding: chunked');
            conn.write('Test');
            conn.close();
        }
        acceptConn();
        while(true) {
            acceptConn();
        }
        listener.close();
    }
}
