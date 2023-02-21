import config from './config.js';
import Router from './router.js';
let mian = (async()=>{
    const Http = midInject.Http;
    const router = new Router();
    const http = new Http(router.getRouterMap());
    await http.listen(config.port);
});
export default mian;
mian;