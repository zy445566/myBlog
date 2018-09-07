
const parse  = require('./lib/parse');
const jsvm  = require('./lib/jsvm');
const path  = require('path');



// node index.js fibo.js && llc fibo.js.o -o fibo.js.s && gcc fibo.js.s -o fibo
if (process.argv.length<3) {
    throw new Error('args number gt 3');
}
let js_path = path.join(__dirname,process.argv[2]);
let js_ast = parse(js_path);
let js_vm =  new jsvm(js_ast);
js_vm.gen();
console.log(js_vm.print());
let bit_code_path = path.join(__dirname,`${process.argv[2]}.o`);
js_vm.write(bit_code_path);
