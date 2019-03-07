import config from './config.js';
import router from './router.js';
let mian = (async()=>{
    const Http = midInject.Http;
    new Http(router).listen(config.port);
});
export default mian;
mian;