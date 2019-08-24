const Koa = require('koa');
const path = require('path');
const config = require('./app/config');

/* 为全干定制的中间件 */
const router = require('./app/middleware/router');
const static = require('./app/middleware/static');

/* koa实例初始化 */
const app = new Koa();
app.use(static(require('./app/back/static')));
app.use(router(require('./app/back/router')));

app.listen(config.port, config.hostname);

/* 前端启动 */
require('child_process').fork('run.js',process.argv,{cwd:path.join(__dirname,'app','front')});
