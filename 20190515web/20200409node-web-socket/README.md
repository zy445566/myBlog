# 使用nodejs实现服务端websocket通讯
起因是在写一个前置监控服务项目，需要数据相对实时的传输，然后正好看到nodejs文档中，实现websocket看起来挺简单的(其实只是冰山一角还有坑)，所以就打算自己实现一遍websocket通讯服务。先看看nodejs官方文档怎么实现的：
```js
// nodejs在http模块实现websocket的例子
const http = require('http');

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
server.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // echo back
});
```
第一眼以为通过upgrade拿到socket套接字，然后就可以直接用socket.write和socket.on('data')的方法来发送和获取数据。但事实并不是这样。

# 第一坑：Sec-WebSocket-Accept
我在浏览器中写好websocket的例子：
```js
    var ws = new WebSocket(`ws://${window.location.host}/`);
    ws.onopen = function()
    {
        console.log("握手成功");
        ws.send("发送数据测试");
    };      
    ws.onmessage = function (e) 
    { 
        console.log(e.data);
    };
```
结果一连接就断开，说我没有Sec-WebSocket-Accept这个http头，网上一查一点结果都没有，看来实现这个的确实不多。
找来找去终于找到了websocket的协议文档(https://tools.ietf.org/html/rfc6455)。

发现Sec-WebSocket-Accept这个返回头是根据客户端的请求头sec-websocket-key,加上全局唯一ID(258EAFA5-E914-47DA-95CA-C5AB0DC85B11)后使用sha1摘要后，再以base64格式输出。
```js
const crypto=require('crypto')
function getSecWebSocketAccept (secWebsocketKey){
    return crypto.createHash('sha1')
    .update(`${secWebsocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');
}

const secWebSocketAccept = getSecWebSocketAccept(req.headers['sec-websocket-key'])
socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
            'Upgrade: WebSocket\r\n' +
            'Connection: Upgrade\r\n' +
            'Sec-WebSocket-Accept: '+ secWebSocketAccept +'\r\n' +
            '\r\n');
```
再刷新下浏览器，发现握手成功了。

# 第二坑:接收到的客户端数据是乱码
握手成功后，肯定是要看客户端给我发了什么数据，原来是个buffer，但toString后居然是乱码。
```js
socket.on('data', (data) => {
    console.log(data.toString())
});
```
当时就在想里面是不是有猫腻，一看果然websocket还有frame的概念，接收到data就是一个frame，在这个框架里面有一定的结构。

在文档中叫Base Framing Protocol(https://tools.ietf.org/html/rfc6455#section-5.2),大概的结构如下：

```js
/**
    我在第二三行重新加了个按字节和比特来计算的比例尺
     0                   1                   2                   3
     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
                   1               2               3               4
     0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
    +-+-+-+-+-------+-+-------------+-------------------------------+
    |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
    |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
    |N|V|V|V|       |S|             |   (if payload len==126/127)   |
    | |1|2|3|       |K|             |                               |
    +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
    |     Extended payload length continued, if payload len == 127  |
    + - - - - - - - - - - - - - - - +-------------------------------+
    |                               |Masking-key, if MASK set to 1  |
    +-------------------------------+-------------------------------+
    | Masking-key (continued)       |          Payload Data         |
    +-------------------------------- - - - - - - - - - - - - - - - +
    :                     Payload Data continued ...                :
    + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    |                     Payload Data continued ...                |
    +---------------------------------------------------------------+
    */
```
什么意思呢？那么按照我标记的字节来算吧
```
---
第1个字节的第1个比特是FIN的值，用来标识这个frame信息传递是否结束，1是结束
第1个字节的第2-3个比特是RSV的值，用来标识这个frame信息传递是否结束
第1个字节的第4-8个比特是opcode的值，来标记状态1是文本数据2是二进制数据8是请求关闭链接
---
第2个字节的第1个比特是Mask的值，用来标识数据是否使用Masking-key来做异或解码
第2个字节的第2-8个比特PayloadLen,
代表数据长度，如果为126，则使用16位的扩展数据长
代表数据长度，如果为127，则使用8位的扩展数据长度
扩展长度使用大字端读取就好
```

那知道这些就可以通过代码来实现解码,代码实现如下
```js
function decodeSocketFrame (bufData){
    let bufIndex = 0
    const byte1 = bufData.readUInt8(bufIndex++).toString(2)
    const byte2 = bufData.readUInt8(bufIndex++).toString(2)
    const frame =  {
        fin:parseInt(byte1.substring(0,1),2),
        // RSV是保留字段，暂时不计算
        opcode:parseInt(byte1.substring(4,8),2),
        mask:parseInt(byte2.substring(0,1),2),
        payloadLen:parseInt(byte2.substring(1,8),2),
    }
    // 如果frame.payloadLen为126或127说明这个长度不够了，要使用扩展长度了
    // 如果frame.payloadLen为126，则使用Extended payload length同时为16/8字节数
    // 如果frame.payloadLen为127，则使用Extended payload length同时为64/8字节数
    // 注意payloadLen得长度单位是字节(bytes)而不是比特(bit)
    if(frame.payloadLen==126) {
        frame.payloadLen = bufData.readUIntBE(bufIndex,2);
        bufIndex+=2;
    } else if(frame.payloadLen==127) {
        // 虽然是8字节，但是前四字节目前留空，因为int型是4字节不留空int会溢出
        bufIndex+=4;
        frame.payloadLen = bufData.readUIntBE(bufIndex,4);
        bufIndex+=4;
    }
    if(frame.mask){
        const payloadBufList = []
        // maskingKey为4字节数据
        frame.maskingKey=[bufData[bufIndex++],bufData[bufIndex++],bufData[bufIndex++],bufData[bufIndex++]];
        for(let i=0;i<frame.payloadLen;i++) {
            payloadBufList.push(bufData[bufIndex+i]^frame.maskingKey[i%4]);
        }
        frame.payloadBuf = Buffer.from(payloadBufList)
    } else {
        frame.payloadBuf = bufData.slice(bufIndex,bufIndex+frame.payloadLen)
    }
    return frame
}
```

那如果你解码数据，那么发送的时候其实也是要遵循这种基本框架的，所以还要进行加码成frame框架后再发送，同理根据协议，可以实现如下代码：
```js
function encodeSocketFrame (frame){
    const frameBufList = [];
    // 对fin位移七位则为10000000加opcode为10000001
    const header = (frame.fin<<7)+frame.opcode;
    console.log(header)
    frameBufList.push(header)
    const bufBits = Buffer.byteLength(frame.payloadBuf);
    let payloadLen = bufBits;
    let extBuf;
    if(bufBits>=126) {
        //65536是2**16即两字节数字极限
        if(bufBits>=65536) {
            extBuf = Buffer.allocUnsafe(8);
            buf.writeUInt32BE(bufBits, 4);
            payloadLen = 127;
        } else {
            extBuf = Buffer.allocUnsafe(2);
            buf.writeUInt16BE(bufBits, 0);
            payloadLen = 126;
        }
    }
    let payloadLenBinStr = payloadLen.toString(2);
    while(payloadLenBinStr.length<8){payloadLenBinStr='0'+payloadLenBinStr;}
    frameBufList.push(parseInt(payloadLenBinStr,2));
    if(bufBits>=126) {
        frameBufList.push(extBuf);
    }
    frameBufList.push(...frame.payloadBuf)
    return Buffer.from(frameBufList)
}
```

那么我们发送和接受就简单了，直接通过socket再发送就好了，如下
```js
socket.on('data', (data) => {
    console.log(decodeSocketFrame(data).payloadBuf.toString())
    socket.write(encodeSocketFrame({
        fin:1,
        opcode:1,
        payloadBuf:Buffer.from('你好')
    }))
});
```

# 总结
其实websocket和http对于socket来说都是在上面加了一层协议，通过不同方法来实现其功能，随着技术的发展，协议也确实往复杂的方向发展。
在工作种如果自己实现协议可能就太费时间了，但是如果是非工作，实现一遍也还是能收获良多的。