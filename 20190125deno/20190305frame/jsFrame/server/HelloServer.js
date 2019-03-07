const File = midInject.File;
export default class HelloServer {
    hello() {
        // 读取db.json 假装有数据库
        let res = JSON.parse(File.getContent(import.meta.url,'./db.json'));
        return res.hello;
    }
}