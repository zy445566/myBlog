const path = require('path');
const config = require('../config');
module.exports = [
    {
        urlPrefix:'/',
        staticPath:path.join(config.appDirname,'front','static'),
        defaultList:['index.html']
    }
]