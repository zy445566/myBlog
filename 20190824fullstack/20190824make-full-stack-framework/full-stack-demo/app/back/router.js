const HelloController = require('./src/controller/HelloController');
module.exports = {
    prefixPath:'/api',
    routerMap:new Map([
        ['hello',HelloController],
    ])
}