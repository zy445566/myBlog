const babel_core = require('@babel/core');
const fs  = require('fs');
module.exports = function (js_path){
    let js_conent = fs.readFileSync(js_path);
    let js_ast = babel_core.parse(js_conent);
    return js_ast;
}
