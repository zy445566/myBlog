const shareObject = require('bindings')('shareObject');
// 初始化数据
shareObject.write('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
setInterval(() => {
    console.log(shareObject.read())
}, 1000);