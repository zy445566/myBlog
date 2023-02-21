import { open } from "deno";
export default class FileManger {
    static async getContent(url,filePath) {
        let urlList = url.replace('file://','').split('/');
        urlList[urlList.length-1] = filePath;
        let localPath = urlList.join('/');
        const file = await open(localPath);
        let buf = new Uint8Array(256);
        await file.read(buf);
        // 因为初始长度为Uint8的256长度，而原字符串不存在，用了\0填充，导致JSON.parse失败
        let jsonData = String.fromCharCode.apply(null, new Uint16Array(buf)).replace(/\0/g,'');
        // byteLength必须小于1024，否在存在溢可能
        return jsonData;
    }
}