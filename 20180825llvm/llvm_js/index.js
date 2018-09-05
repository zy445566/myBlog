const babel_core = require('@babel/core');
const llvm  = require('llvm-node');
const path  = require('path');
const fs  = require('fs');
const the_context = new llvm.LLVMContext();
const the_module = new llvm.Module("jsvm", the_context);
// node index.js fibo.js
let jsPath = path.join(__dirname,process.argv[2] || 'fibo.js');
let jsConent = fs.readFileSync(jsPath);
let jsAst = babel_core.parse(jsConent);
// console.log(jsAst);
let func_name = 'fibo';
const double_type = llvm.Type.getDoubleTy(the_context);
const the_function_type = llvm.FunctionType.get(double_type,[double_type],false);
the_function = llvm.Function.create(the_function_type,llvm.LinkageTypes.ExternalLinkage,func_name,the_module);
let the_args = the_function.getArguments();
the_args[0].name='num';