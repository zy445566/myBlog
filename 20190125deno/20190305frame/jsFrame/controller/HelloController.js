import HelloServer from '../server/HelloServer.js'
export default class HelloController {
    constructor() {
        this.helloServer = new HelloServer();
    }

    async hello() {
        return await this.helloServer.hello();
    }
}