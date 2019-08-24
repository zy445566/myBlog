const path = require('path');
const applicationType = require('./application-type.js');
const fs = require('fs');
function readFile(filePath) {
    return new Promise((resolve,reject)=>{
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    })
}
function switchTypeByExt(extname) {
    if(applicationType[extname]) {
        return applicationType[extname];
    }
    return false;
}

module.exports = function(static) {
    return async (ctx,next) => {
        for(let staticItem of static) {
            if(ctx.request.url.indexOf(staticItem.urlPrefix)!=0) {return;}
            for(let defaultItem of ['',...staticItem.defaultList]) {
                let filePath = path.join(staticItem.staticPath,ctx.request.url,defaultItem);
                if(!fs.existsSync(filePath)) {continue;}
                let fileStats = fs.statSync(filePath);
                if(!fileStats.isFile()) {continue;}
                let extname = path.extname(filePath);
                let type = switchTypeByExt(extname);
                if(type) {
                    ctx.type = type;
                }
                ctx.body = (await readFile(filePath)).toString();
                // ctx.body = fs.createReadStream(filePath);// 这里仅仅适用于大文件下载
            }
        }
        await next();
    }
}