import vm from 'vm';
import fs from 'fs';
import path from 'path';
import Http from './http.js';
import File from './file.js';
function getMidInjectObj() {
    return {
        midInject:{
            console:console,
            Http:Http,
            File:File
        }
    }
}
(async()=>{
    const mainPath = './main.js';
    const mainJsPath = path.join(process.cwd(),mainPath);
    const baseURL = new URL('file://');
    const mainJsUrl = new URL(mainJsPath, baseURL);
    const sandbox = vm.createContext(getMidInjectObj());
    const main = new vm.SourceTextModule(fs.readFileSync(mainJsUrl.pathname).toString(), {
        context:sandbox, 
        url: mainJsUrl.href,
        initializeImportMeta(meta){
            meta.url = mainJsUrl.href
    }} );
    async function linker(specifier, referencingModule) {
        const resolved = new URL(specifier, referencingModule.url);
        if(fs.existsSync(resolved.pathname)){
            return new vm.SourceTextModule(fs.readFileSync(resolved.pathname).toString(), { 
                context: referencingModule.context, url: resolved.href,
                initializeImportMeta(meta){
                    meta.url = resolved.href
            }});
        }
        throw new Error(`Unable to resolve dependency: ${specifier}`);
    };
    await main.link(linker);
    main.instantiate();
    let mainResult = await main.evaluate();
    let mainFunc = mainResult.result;
    await mainFunc();
})();