const http = require("http");
const fs = require("fs");
const port = 4000;
function nodeSleep(time) {
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            resolve(true)
        }, time);
    });
}
function getUnseData() {
    return new Promise((resolve,reject)=>{
        fs.readFile('/Users/noder/unuseData.txt', (err, data) => {
            if (err) reject(err);
            resolve(data)
        });
    });
}
http.createServer( async function (request, response) {
    let sleepTime = 3000;
    await nodeSleep(sleepTime);
    let unuseData = await getUnseData();
    response.end(`Node Stop The World ${sleepTime}s,unseDate:${unuseData}`);  
}).listen(port);
console.log(`listen http://localhost:${port}/`)