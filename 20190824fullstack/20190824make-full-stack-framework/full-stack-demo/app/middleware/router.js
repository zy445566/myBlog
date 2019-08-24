const url = require('url');
module.exports = function(router) {
    return async (ctx, next) => {
        await next();
        if(ctx.request.url.indexOf(router.prefixPath)!=0) {return;}
        let urlList = url.parse(ctx.request.url).pathname.split('/');
        if(!router.routerMap.has(urlList[2])) {return;}
        let controller = router.routerMap.get(urlList[2]);
        if(!(controller[urlList[3]] instanceof Function)) {return;}
        try{
            ctx.body = {
                errCode:0,
                errKey:"",
                data:await controller[urlList[3]](ctx)
            }
        }catch(err) {
            ctx.body = {
                errCode:1,
                errKey:"sys.sys_error",
            }
            process.stdout.write(err.stack);
        }
    }
}