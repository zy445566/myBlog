const config = require('../config');
const webpack = require('webpack');
const compiler = webpack(require('./webpack.config.js'));
let compilerOnce = false
for(let arg of process.argv) {
    if(arg=='--stable') {
        compilerOnce = true;
    }
}

function runBack(err, stats) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stats.toString({
    errors: true,
    warnings: true,
    modules: false,
    chunks: false,
    colors: true
    }));
    console.log(`link: http://${config.hostname}:${config.port}/`);
}

if(compilerOnce) {
    compiler.run(runBack)
} else {
    compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
    },runBack);
}