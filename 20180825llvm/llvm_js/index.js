const babel_core = require('@babel/core');
const llvm  = require('llvm-node');
const path  = require('path');
const fs  = require('fs');
// node index.js fibo.js
let jsPath = path.join(__dirname,process.argv[2]);
let jsConent = fs.readFileSync(jsPath);
let jsAst = babel_core.parse(jsConent);
console.log(jsAst);