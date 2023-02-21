export default class HelloServer {
    constructor () {
        this.File = midInject.File;
    }
    async hello() {
        // 读取db.json 假装有数据库
        let res = JSON.parse(await this.File.getContent(import.meta.url,'./db.json'));
        return res.hello;
    }
}