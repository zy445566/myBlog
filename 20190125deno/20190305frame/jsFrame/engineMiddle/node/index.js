import vm from 'vm';
import fs from 'fs';
import path from 'path';
function getMidInjectObj(jsDir,jsPath) {
    return {
        midInject:{
            console:console,
            jsPath:jsPath,
            jsDir:jsDir
        }
    }
}
(async()=>{
    const mainPath = './main.js';
    const mainJsPath = path.join(process.cwd(),mainPath);
    const mainModule = getMidInjectObj(process.cwd(),mainJsPath);
    const sandbox = vm.createContext(mainModule);
    const main = new vm.SourceTextModule(fs.readFileSync(mainJsPath).toString(), {context:sandbox} );
    async function linker(specifier, referencingModule) {
        if (specifier === 'midInject') {
            return new vm.SourceTextModule(`export default midInject;`, { context: referencingModule.context });
        } else {
            let jsPath = path.join(referencingModule.context.midInject.jsDir,specifier);
            if(fs.existsSync(jsPath)){
                return new vm.SourceTextModule(fs.readFileSync(jsPath).toString(), { context: referencingModule.context});
            }
        }
        throw new Error(`Unable to resolve dependency: ${specifier}`);
    };
    await main.link(linker);
    main.instantiate();
    await main.evaluate();
})();